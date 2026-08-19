/**
 * The multipart body Create Account submits: every field the two steps
 * collected, and the photo when one was picked.
 *
 * React Native's FormData keeps a file part as the `{ uri, name, type }` object
 * it was handed, while the web one this test environment ships coerces it to a
 * string — so the parts are recorded through a stub, which is what the runtime
 * would store either way.
 */

import { buildRegistrationForm } from '../src/services/auth';

type Part = [string, any];

class RecordingFormData {
  parts: Part[] = [];
  append(name: string, value: any) {
    this.parts.push([name, value]);
  }
}

/** The RN TS config has no DOM lib, so the global is reached through a cast. */
const globals = globalThis as unknown as { FormData: unknown };
const originalFormData = globals.FormData;

beforeAll(() => {
  globals.FormData = RecordingFormData;
});

afterAll(() => {
  globals.FormData = originalFormData;
});

const partsOf = (form: FormData): Record<string, any> =>
  Object.fromEntries((form as unknown as RecordingFormData).parts);

const draft = {
  profile: {
    fullName: '  Arjun Sharma ',
    email: ' Arjun@Example.COM ',
    phoneNumber: '+91 98765 43210',
    gender: 'male' as const,
  },
  birth: {
    dateOfBirth: '15/08/1999',
    timeOfBirth: '06 : 30 AM',
    placeOfBirth: 'Mumbai, Maharashtra',
  },
};

describe('buildRegistrationForm', () => {
  it('carries both steps, trimmed and normalised', () => {
    const parts = partsOf(buildRegistrationForm(draft));

    expect(parts.fullName).toBe('Arjun Sharma');
    expect(parts.email).toBe('arjun@example.com');
    expect(parts.phone).toBe('9876543210');
    expect(parts.gender).toBe('male');
    expect(parts.dateOfBirth).toBe('15/08/1999');
    expect(parts.timeOfBirth).toBe('06 : 30 AM');
    expect(parts.placeOfBirth).toBe('Mumbai, Maharashtra');
  });

  it('leaves the photo out when none was picked', () => {
    expect(partsOf(buildRegistrationForm(draft)).photo).toBeUndefined();
  });

  it('leaves gender out when it was not answered', () => {
    const parts = partsOf(
      buildRegistrationForm({
        ...draft,
        profile: { ...draft.profile, gender: undefined },
      }),
    );
    expect(parts.gender).toBeUndefined();
  });

  it('appends a picked photo as a file part', () => {
    const parts = partsOf(
      buildRegistrationForm({ ...draft, photo: { uri: 'file:///tmp/IMG_0042.heic' } }),
    );

    expect(parts.photo).toEqual({
      uri: 'file:///tmp/IMG_0042.heic',
      /** Filename falls back to the one in the path, type to JPEG. */
      name: 'IMG_0042.heic',
      type: 'image/jpeg',
    });
  });

  it('keeps the name and type the picker supplied', () => {
    const parts = partsOf(
      buildRegistrationForm({
        ...draft,
        photo: { uri: 'content://media/42', name: 'avatar.png', type: 'image/png' },
      }),
    );

    expect(parts.photo).toEqual({
      uri: 'content://media/42',
      name: 'avatar.png',
      type: 'image/png',
    });
  });

  it('names a photo whose uri has no filename', () => {
    const parts = partsOf(
      buildRegistrationForm({ ...draft, photo: { uri: 'content://media/external/42' } }),
    );
    expect(parts.photo.name).toBe('profile.jpg');
  });

  it('sends ten digits whether or not a country code was typed', () => {
    const bare = partsOf(
      buildRegistrationForm({
        ...draft,
        profile: { ...draft.profile, phoneNumber: '9876543210' },
      }),
    );
    expect(bare.phone).toBe('9876543210');
  });
});
