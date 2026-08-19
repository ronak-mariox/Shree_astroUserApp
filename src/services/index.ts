export { client, API_BASE_URL, ApiError } from './client';
export {
  register,
  buildRegistrationForm,
  requestLoginOtp,
  verifyLoginOtp,
  loginPhoneOf,
  signOut,
} from './auth';
export {
  restoreSession,
  clearSession,
  getSession,
  getAccessToken,
  isSignedIn,
  onSessionChange,
  updateUser,
} from './session';
export { isKeystoreAvailable } from './secureStore';
export { pickProfilePhoto } from './photoPicker';
export * as api from './api';
export type { DirectoryCard, DirectoryFilters, Home, Intake } from './api';
export type { Session } from './session';
export type {
  AuthSession,
  AuthUser,
  BirthDraft,
  LoginIdentifier,
  OtpRequest,
  PhotoAsset,
  ProfileDraft,
  RegistrationDraft,
} from './auth';
