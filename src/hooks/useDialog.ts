import { useCallback, useState } from 'react';

import type { DialogRequest } from '../components/AppDialog';

/**
 * One dialog per screen, opened from anywhere in it.
 *
 * `Alert.alert` needed no state because the OS owned the window; the app's own
 * dialog does, and this keeps that to three lines at the call site:
 *
 *   const dialog = useDialog();
 *   dialog.show({ title: 'Insufficient Balance', message, actions: [...] });
 *   <AppDialog request={dialog.request} onDismiss={dialog.dismiss} />
 *
 * Showing while one is already open replaces it, which is what a second failure
 * arriving should do — the newer message is the one that matters.
 *
 * `show` and `dismiss` never change, so an effect that raises a message depends
 * on `dialog.show` rather than on the whole object — which does change, every
 * time a message opens or closes.
 */
export function useDialog() {
  const [request, setRequest] = useState<DialogRequest>();

  const show = useCallback((next: DialogRequest) => setRequest(next), []);
  const dismiss = useCallback(() => setRequest(undefined), []);

  return { request, show, dismiss };
}
