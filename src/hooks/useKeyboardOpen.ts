import { useEffect, useState } from 'react';
import { Keyboard, Platform } from 'react-native';

/**
 * Whether the software keyboard is on screen right now.
 *
 * Android runs edge-to-edge (android/gradle.properties: edgeToEdgeEnabled),
 * where `windowSoftInputMode="adjustResize"` no longer shrinks the window —
 * so screens avoid the keyboard themselves with KeyboardAvoidingView
 * `behavior="padding"` on both platforms, and use this to drop the
 * navigation-bar safe-area padding while the keyboard covers that bar
 * (otherwise the composer floats a bar's height above the keys).
 */
export function useKeyboardOpen(): boolean {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const show = Keyboard.addListener(showEvent, () => setOpen(true));
    const hide = Keyboard.addListener(hideEvent, () => setOpen(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  return open;
}
