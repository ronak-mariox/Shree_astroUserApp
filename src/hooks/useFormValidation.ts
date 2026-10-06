/**
 * When a form shows its errors, and where it takes the user when Submit finds one.
 *
 * The rules themselves live in utils/validation.ts; a screen computes its
 * `errors` map from them on every render and hands it here. This hook only
 * decides visibility:
 *
 * - a field's message appears once that field has been left (blur) or once
 *   Submit has been pressed — never while the first character is being typed;
 * - it follows the value from then on, so it disappears the moment the value
 *   becomes valid;
 * - a server-side 422 message for a field shows until that field is edited.
 *
 * `submit()` marks every field, then scrolls to (and focuses, for a text
 * input) the first invalid one, and says whether the form may be sent.
 */

import { useCallback, useRef, useState } from 'react';
import type { LayoutChangeEvent } from 'react-native';

import { firstInvalidField, type FieldError } from '../utils/validation';

/** Whatever a text input's ref holds — only `focus` is used. */
type InputHandle = { focus?: () => void } | null;
/** Whatever a ScrollView's ref holds — only `scrollTo` is used. */
type ScrollHandle = { scrollTo?: (options: { y: number; animated?: boolean }) => void } | null;

/** Space left above a field the form scrolls to, so its label is visible too. */
const REVEAL_MARGIN = 24;

export function useFormValidation<F extends string>(
  values: Record<F, unknown>,
  errors: Record<F, FieldError>,
) {
  const [touched, setTouched] = useState<Partial<Record<F, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  /** A server message, with the value it was about — it stops applying once the value changes. */
  const [server, setServer] = useState<Partial<Record<F, { message: string; value: unknown }>>>({});

  const scrollRef = useRef<ScrollHandle>(null);
  const setScroll = useCallback((element: ScrollHandle) => {
    scrollRef.current = element;
  }, []);
  const inputs = useRef<Partial<Record<F, InputHandle>>>({});
  /** Each field's y, relative to the container whose own y is `containerY`. */
  const positions = useRef<Partial<Record<F, number>>>({});
  const containerY = useRef(0);

  const valuesRef = useRef(values);
  valuesRef.current = values;

  const error = (field: F): FieldError => {
    const fromServer = server[field];
    if (fromServer && fromServer.value === values[field]) {
      return fromServer.message;
    }
    return submitted || touched[field] ? errors[field] : undefined;
  };

  const touch = useCallback((field: F) => {
    setTouched(current => (current[field] ? current : { ...current, [field]: true }));
  }, []);

  /** Brings a field into view and, when it is a text input, puts the cursor in it. */
  const reveal = useCallback((field: F) => {
    const y = positions.current[field];
    if (y !== undefined) {
      scrollRef.current?.scrollTo?.({
        y: Math.max(0, containerY.current + y - REVEAL_MARGIN),
        animated: true,
      });
    }
    inputs.current[field]?.focus?.();
  }, []);

  /**
   * True when the form may be sent; otherwise every error is shown and the
   * first is revealed. `current` overrides `errors` for a check whose rules
   * differ by which button was pressed and have not re-rendered yet.
   */
  const submit = (current: Record<F, FieldError> = errors): boolean => {
    setSubmitted(true);
    setServer({});
    const first = firstInvalidField(current);
    if (first !== undefined) {
      reveal(first);
      return false;
    }
    return true;
  };

  /** Maps a server refusal's per-field messages onto the form, revealing the first. */
  const setServerErrors = useCallback(
    (fields: Partial<Record<F, string>>) => {
      const next: Partial<Record<F, { message: string; value: unknown }>> = {};
      let first: F | undefined;
      for (const field of Object.keys(fields) as F[]) {
        const message = fields[field];
        if (message) {
          next[field] = { message, value: valuesRef.current[field] };
          first = first ?? field;
        }
      }
      setServer(next);
      if (first !== undefined) {
        reveal(first);
      }
    },
    [reveal],
  );

  /** Props for a field's outermost view, so Submit can scroll to it. */
  const locate = (field: F) => ({
    onLayout: (event: LayoutChangeEvent) => {
      positions.current[field] = event.nativeEvent.layout.y;
    },
  });

  /** Ref for a field's text input, so Submit can focus it. */
  const inputRef = (field: F) => (element: InputHandle) => {
    inputs.current[field] = element;
  };

  /** onLayout for the view that holds the located fields, when it is not the scroll content itself. */
  const locateContainer = (event: LayoutChangeEvent) => {
    containerY.current = event.nativeEvent.layout.y;
  };

  return {
    error,
    touch,
    submit,
    submitted,
    setServerErrors,
    /** Ref for the form's ScrollView. */
    scrollRef: setScroll,
    locate,
    locateContainer,
    inputRef,
    focus: (field: F) => inputs.current[field]?.focus?.(),
  };
}
