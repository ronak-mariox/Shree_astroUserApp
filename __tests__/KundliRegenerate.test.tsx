/**
 * The Kundli tab asks the server which chart belongs to the seeker's CURRENT
 * birth details (GET /kundli/me) rather than trusting an id it remembered:
 *
 *   - details it already has a chart for  ->  "View Kundli", straight to it
 *     (a database read on the server; nothing generated again);
 *   - any detail changed                  ->  "Generate Kundli", which asks
 *     for the birth details and casts a new chart.
 */
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

import App from '../App';
import { BirthDetailsScreen } from '../src/screens/BirthDetailsScreen';
import { KundliResultScreen } from '../src/screens/KundliResultScreen';
import { KundliScreen } from '../src/screens/KundliScreen';
import { clearSession, saveSession } from '../src/services/session';
import * as api from '../src/services/api';

jest.mock('react-native-safe-area-context', () => {
  const actual = jest.requireActual('react-native-safe-area-context');
  const ReactActual = jest.requireActual('react');
  const initialMetrics = {
    frame: { x: 0, y: 0, width: 390, height: 844 },
    insets: { top: 47, left: 0, right: 0, bottom: 34 },
  };
  return {
    ...actual,
    SafeAreaProvider: ({ children }: { children: React.ReactNode }) =>
      ReactActual.createElement(actual.SafeAreaProvider, { initialMetrics }, children),
  };
});

const mockApi = api as unknown as { fetchCurrentKundli: jest.Mock; createBirthProfile: jest.Mock };

/** The account's birth details, as GET /users/me returns them. */
const profileWith = (timeOfBirth: string) => ({
  id: 'u-1',
  name: 'Arjun Sharma',
  email: 'arjun@example.com',
  phone: '9876543210',
  wallet: { balance: 1250, totalAdded: 3000, totalSpent: 1750 },
  stats: { consultations: 12, kundlis: 3 },
  birthDetails: {
    dateOfBirth: '1995-08-15T00:00:00.000Z',
    timeOfBirth,
    place: { formatted: 'Mumbai, Maharashtra' },
  },
});

const flush = async () => {
  await ReactTestRenderer.act(async () => {
    for (let i = 0; i < 10; i += 1) await Promise.resolve();
  });
};

const pressLabel = async (tree: ReactTestRenderer.ReactTestRenderer, label: string) => {
  const target = tree.root.findAll(
    n => typeof n.type !== 'string' && typeof n.props.onPress === 'function' && n.props.accessibilityLabel === label,
  )[0];
  if (!target) {
    throw new Error(`Nothing pressable labelled "${label}"`);
  }
  await ReactTestRenderer.act(async () => {
    await target.props.onPress();
  });
  await flush();
};

let tree: ReactTestRenderer.ReactTestRenderer;

/** Signs in and lands on the Kundli tab. */
const openKundliTab = async () => {
  await saveSession({
    accessToken: 'test-access',
    refreshToken: 'test-refresh',
    user: { id: 'u-1', name: 'Arjun Sharma', email: 'arjun@example.com', phone: '9876543210' } as never,
  });
  await ReactTestRenderer.act(async () => {
    tree = ReactTestRenderer.create(<App />);
  });
  for (let i = 0; i < 40; i += 1) {
    await flush();
    if (tree.root.findAll(n => typeof n.props.onPress === 'function' && n.props.accessibilityLabel === 'Kundli').length > 0) break;
    await ReactTestRenderer.act(async () => {
      await new Promise<void>(resolve => setTimeout(() => resolve(), 50));
    });
  }
  await pressLabel(tree, 'Kundli');
  return tree.root.findByType(KundliScreen);
};

beforeEach(() => {
  mockApi.fetchCurrentKundli.mockReset();
  mockApi.createBirthProfile.mockReset();
  mockApi.createBirthProfile.mockResolvedValue({ id: 'profile-new', status: 'ready' });
});

afterEach(async () => {
  await ReactTestRenderer.act(() => {
    tree.unmount();
  });
  await clearSession();
  jest.restoreAllMocks();
});

test('a chart already generated for these details: "View Kundli" opens it without generating again', async () => {
  mockApi.fetchCurrentKundli.mockResolvedValue({ found: true, profileId: 'profile-1', status: 'ready' });
  const kundli = await openKundliTab();

  expect(mockApi.fetchCurrentKundli).toHaveBeenCalled();
  expect(kundli.props.hasKundli).toBe(true);

  await ReactTestRenderer.act(async () => {
    await kundli.props.onGenerateKundli();
  });
  await flush();
  expect(tree.root.findByType(KundliResultScreen).props.profileId).toBe('profile-1');
  expect(mockApi.createBirthProfile).not.toHaveBeenCalled();
});

test('birth details changed (no chart for them): the tab offers to generate, and asks for the details', async () => {
  mockApi.fetchCurrentKundli.mockResolvedValue({ found: false, reason: 'not_generated' });
  const kundli = await openKundliTab();

  expect(kundli.props.hasKundli).toBe(false);
  await ReactTestRenderer.act(async () => {
    await kundli.props.onGenerateKundli();
  });
  await flush();
  // The birth-details form, where the place is picked from search — a new chart needs its coordinates.
  expect(tree.root.findAllByType(BirthDetailsScreen)).toHaveLength(1);
  expect(tree.root.findAllByType(KundliResultScreen)).toHaveLength(0);
});

test('an id remembered from a previous session is dropped when it no longer matches', async () => {
  // First run: a chart exists and is remembered on the device.
  mockApi.fetchCurrentKundli.mockResolvedValue({ found: true, profileId: 'profile-1', status: 'ready' });
  let kundli = await openKundliTab();
  expect(kundli.props.hasKundli).toBe(true);
  await ReactTestRenderer.act(() => {
    tree.unmount();
  });

  // Next run, after the seeker edited their birth details: the server says none matches.
  mockApi.fetchCurrentKundli.mockResolvedValue({ found: false, reason: 'not_generated' });
  kundli = await openKundliTab();
  expect(kundli.props.hasKundli).toBe(false);
  await ReactTestRenderer.act(async () => {
    await kundli.props.onGenerateKundli();
  });
  await flush();
  expect(tree.root.findAllByType(BirthDetailsScreen)).toHaveLength(1);
});

test('generating from the form opens the new chart', async () => {
  mockApi.fetchCurrentKundli.mockResolvedValue({ found: false, reason: 'not_generated' });
  const kundli = await openKundliTab();
  await ReactTestRenderer.act(async () => {
    await kundli.props.onGenerateKundli();
  });
  await flush();

  await ReactTestRenderer.act(async () => {
    await tree.root.findByType(BirthDetailsScreen).props.onGenerateKundli({
      dateOfBirth: '15/08/1995',
      timeOfBirth: '06:30 AM',
      placeOfBirth: 'Mumbai, Maharashtra, India',
      placeId: 'place:mumbai#0',
    });
  });
  await flush();

  expect(mockApi.createBirthProfile).toHaveBeenCalledWith(
    expect.objectContaining({ dateOfBirth: '15/08/1995', timeOfBirth: '06:30 AM', placeId: 'place:mumbai#0' }),
  );
  expect(tree.root.findByType(KundliResultScreen).props.profileId).toBe('profile-new');
});

test('editing birth details from the Kundli tab SAVES them, and comes back to the tab', async () => {
  mockApi.fetchCurrentKundli.mockResolvedValue({ found: true, profileId: 'profile-1', status: 'ready' });
  jest.spyOn(api, 'fetchProfile').mockResolvedValue(profileWith('06:30') as never);
  const saveProfile = jest
    .spyOn(api, 'saveProfile')
    .mockResolvedValue(profileWith('23:45') as never);

  const kundli = await openKundliTab();
  expect(kundli.props.birthDetails).toEqual(
    expect.arrayContaining([expect.objectContaining({ label: 'Time', value: '06:30' })]),
  );

  await ReactTestRenderer.act(async () => {
    await kundli.props.onEditBirthDetails();
  });
  await flush();
  const form = tree.root.findByType(BirthDetailsScreen);
  expect(form.props.initialDetails).toEqual(
    expect.objectContaining({ timeOfBirth: expect.any(String), placeOfBirth: 'Mumbai, Maharashtra' }),
  );

  // Change the time of birth and press Save & Continue.
  await ReactTestRenderer.act(async () => {
    await form.props.onSave({
      dateOfBirth: '15/08/1995',
      timeOfBirth: '11 : 45 PM',
      placeOfBirth: 'Mumbai, Maharashtra',
    });
  });
  await flush();

  // It was actually written to the account…
  expect(saveProfile).toHaveBeenCalledWith({
    dateOfBirth: '15/08/1995',
    timeOfBirth: '11 : 45 PM',
    placeOfBirth: 'Mumbai, Maharashtra',
  });
  // …the Kundli tab is back, showing what was saved…
  expect(tree.root.findAllByType(BirthDetailsScreen)).toHaveLength(0);
  expect(tree.root.findByType(KundliScreen).props.birthDetails).toEqual(
    expect.arrayContaining([expect.objectContaining({ label: 'Time', value: '23:45' })]),
  );
  // …and no chart was generated behind the seeker's back.
  expect(mockApi.createBirthProfile).not.toHaveBeenCalled();
});

test('a failed save keeps the seeker on the form (nothing silently lost)', async () => {
  mockApi.fetchCurrentKundli.mockResolvedValue({ found: false, reason: 'not_generated' });
  jest.spyOn(api, 'fetchProfile').mockResolvedValue(profileWith('06:30') as never);
  jest.spyOn(api, 'saveProfile').mockRejectedValue(new Error('Network unreachable'));

  const kundli = await openKundliTab();
  await ReactTestRenderer.act(async () => {
    await kundli.props.onEditBirthDetails();
  });
  await flush();

  const form = tree.root.findByType(BirthDetailsScreen);
  await expect(
    form.props.onSave({ dateOfBirth: '15/08/1995', timeOfBirth: '11 : 45 PM', placeOfBirth: 'Mumbai, Maharashtra' }),
  ).rejects.toThrow('Network unreachable');
  expect(tree.root.findAllByType(BirthDetailsScreen)).toHaveLength(1);
});
