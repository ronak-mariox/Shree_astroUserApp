/**
 * The audio of a voice consultation: one Agora RTC channel (voice only), one
 * at a time, wrapped so the screen only ever says "join this", "mute",
 * "speaker", "renew the token" and "leave".
 *
 * Who is in the channel, and whether they may be, is decided on the server:
 * `fetchCallToken` (services/api.ts) hands back the app id, the channel name
 * (the session id), this side's fixed uid and a short-lived token, and only
 * for an active call session the caller belongs to. Nothing here chooses any
 * of that.
 *
 * `react-native-agora` is loaded on the first join rather than at startup:
 * its native module is resolved when the JS module is first evaluated, so a
 * build that has not linked it yet (the pods not installed, an older binary
 * under Metro) would otherwise fail to open the app at all rather than just
 * fail to place a call. The same lazy load keeps the Jest suite, which has
 * no native modules, away from it entirely.
 */

import { PermissionsAndroid, Platform } from 'react-native';
import type {
  ErrorCodeType,
  IRtcEngine,
  IRtcEngineEventHandler,
  UserOfflineReasonType,
} from 'react-native-agora';

type AgoraSdk = typeof import('react-native-agora');

/** What the wrapper reports back, in the order a call usually sees them. */
export type VoiceCallEvent =
  /** This side is in the channel — the peer may or may not be yet. */
  | { type: 'joined' }
  | { type: 'peerJoined'; uid: number }
  | { type: 'peerLeft'; uid: number; reason: UserOfflineReasonType }
  /** The network dropped; the SDK is trying to get back into the channel by itself. */
  | { type: 'reconnecting' }
  | { type: 'reconnected' }
  /** The token runs out in ~30s (or already has): fetch a fresh one and call `renewVoiceToken`. */
  | { type: 'tokenExpiring' }
  | { type: 'error'; code: ErrorCodeType | number; message: string }
  /** Android refused RECORD_AUDIO — nothing was joined. */
  | { type: 'permissionDenied' };

/** Dev-only tracing for the first real-device runs — every engine call's return code and every event. */
const VOICE_LOG = (...args: unknown[]) => { if (__DEV__) console.log('[voice]', ...args); };

export type JoinVoiceCallOptions = {
  appId: string;
  channelName: string;
  uid: number;
  token: string;
  onEvent: (event: VoiceCallEvent) => void;
};

let engine: IRtcEngine | null = null;
let handler: IRtcEngineEventHandler | null = null;
/**
 * Bumped by every join and every leave. A join awaits the permission prompt
 * and the SDK load; if a leave (the screen closing, the session ending) lands
 * in between, the join notices its number is stale and stops rather than
 * entering a channel nobody is looking at any more.
 */
let generation = 0;
/** What the screen last asked for, applied the moment a channel is joined and re-applied on every later change. */
let wantMuted = false;
let wantSpeaker = false;
/** True from `onJoinChannelSuccess` until leave: the speaker route can only be set on a live connection (-3 before). */
let inChannel = false;

async function ensureMicrophonePermission(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    /** iOS asks by itself on first capture, with NSMicrophoneUsageDescription as the copy. */
    return true;
  }
  const status = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
  return status === PermissionsAndroid.RESULTS.GRANTED;
}

/**
 * Joins the call. Resolves `true` once `joinChannel` has been accepted (the
 * `joined` event follows when the SDK is actually in); `false` when it could
 * not be attempted, after reporting why through `onEvent`.
 */
export async function joinVoiceCall({ appId, channelName, uid, token, onEvent }: JoinVoiceCallOptions): Promise<boolean> {
  /** One call at a time — anything still live is left first. */
  leaveVoiceCall();
  const attempt = ++generation;

  const allowed = await ensureMicrophonePermission();
  if (attempt !== generation) {
    return false;
  }
  if (!allowed) {
    onEvent({ type: 'permissionDenied' });
    return false;
  }

  let sdk: AgoraSdk;
  try {
    sdk = await import('react-native-agora');
  } catch {
    onEvent({ type: 'error', code: -1, message: 'Voice calls need the app rebuilt with react-native-agora.' });
    return false;
  }
  if (attempt !== generation) {
    return false;
  }

  const rtc = sdk.createAgoraRtcEngine();
  const initialised = rtc.initialize({
    appId,
    channelProfile: sdk.ChannelProfileType.ChannelProfileCommunication,
  });
  VOICE_LOG('initialize ->', initialised);
  if (initialised < 0) {
    onEvent({ type: 'error', code: initialised, message: 'Could not start the voice engine.' });
    return false;
  }
  VOICE_LOG('enableAudio ->', rtc.enableAudio());
  /** A voice call plays through the earpiece unless the seeker turns the speaker on. */
  VOICE_LOG('setDefaultAudioRoute ->', rtc.setDefaultAudioRouteToSpeakerphone(false));

  const events: IRtcEngineEventHandler = {
    onJoinChannelSuccess: () => {
      inChannel = true;
      /** Whatever the seeker set while the channel was still coming up. */
      engine?.muteLocalAudioStream(wantMuted);
      engine?.setEnableSpeakerphone(wantSpeaker);
      onEvent({ type: 'joined' });
    },
    onRejoinChannelSuccess: () => onEvent({ type: 'reconnected' }),
    onUserJoined: (_connection, remoteUid) => onEvent({ type: 'peerJoined', uid: remoteUid }),
    onUserOffline: (_connection, remoteUid, reason) => onEvent({ type: 'peerLeft', uid: remoteUid, reason }),
    onConnectionStateChanged: (_connection, state, reason) => {
      if (state === sdk.ConnectionStateType.ConnectionStateReconnecting) {
        onEvent({ type: 'reconnecting' });
      } else if (state === sdk.ConnectionStateType.ConnectionStateFailed) {
        onEvent({ type: 'error', code: reason, message: 'The call connection failed.' });
      }
    },
    onTokenPrivilegeWillExpire: () => onEvent({ type: 'tokenExpiring' }),
    onRequestToken: () => onEvent({ type: 'tokenExpiring' }),
    onError: (code, message) => onEvent({ type: 'error', code, message }),
  };
  rtc.registerEventHandler(events);
  engine = rtc;
  handler = events;

  const joining = rtc.joinChannel(token, channelName, uid, {
    clientRoleType: sdk.ClientRoleType.ClientRoleBroadcaster,
    publishMicrophoneTrack: true,
    publishCameraTrack: false,
    autoSubscribeAudio: true,
    autoSubscribeVideo: false,
  });
  if (joining < 0) {
    onEvent({ type: 'error', code: joining, message: 'Could not join the call.' });
    leaveVoiceCall();
    return false;
  }
  /** The mute flag may be set before the channel is up; the speaker route is applied on `onJoinChannelSuccess`. */
  rtc.muteLocalAudioStream(wantMuted);
  return true;
}

/** Leaves whatever call is live and frees the engine. Safe to call any number of times, including with no call up. */
export function leaveVoiceCall() {
  generation += 1;
  const rtc = engine;
  const events = handler;
  engine = null;
  handler = null;
  inChannel = false;
  if (!rtc) {
    return;
  }
  try {
    if (events) {
      rtc.unregisterEventHandler(events);
    }
    rtc.leaveChannel();
    /** Synchronous, as Agora asks when the engine may be created again straight away (a Retry, the next call): an async release still winding down makes the next `joinChannel` fail with -17. */
    rtc.release(true);
    VOICE_LOG('release(sync) done');
  } catch (e) {
    VOICE_LOG('release threw', String(e));
    /** The native side is already gone — there is nothing left to leave. */
  }
}

/** Stops (or resumes) sending this side's microphone; the channel stays joined. */
export function setMuted(muted: boolean) {
  wantMuted = muted;
  engine?.muteLocalAudioStream(muted);
}

/** Speakerphone on, or back to the earpiece. */
export function setSpeaker(on: boolean) {
  wantSpeaker = on;
  if (inChannel) {
    engine?.setEnableSpeakerphone(on);
  }
}

/** Hands the SDK a fresh token after `tokenExpiring`. */
export function renewVoiceToken(token: string) {
  engine?.renewToken(token);
}
