import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import {
  NfcError,
  cancelNfcScan,
  getNfcStatus,
  openNfcSettings,
  readTagText,
  type NfcStatus,
} from '../services/nfc';

export interface NfcScan {
  status: NfcStatus;
  scanning: boolean;
  error: NfcError | null;
  /** Waits for one tag and passes its text to `onToken`. */
  start: (onToken: (token: string) => void | Promise<void>) => Promise<void>;
  cancel: () => void;
  openSettings: () => Promise<void>;
}

export function useNfcScan(): NfcScan {
  const [status, setStatus] = useState<NfcStatus>('unavailable');
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<NfcError | null>(null);
  const mounted = useRef(true);
  const scanId = useRef(0);

  const refreshStatus = useCallback(async () => {
    const next = await getNfcStatus();
    if (mounted.current) setStatus(next);
  }, []);

  const cancel = useCallback(() => {
    scanId.current += 1; // invalidates the in-flight start() call
    if (mounted.current) setScanning(false);
    cancelNfcScan().catch(() => {
      // Releasing an already-closed session may reject; nothing to recover.
    });
  }, []);

  useEffect(() => {
    mounted.current = true;
    refreshStatus();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') refreshStatus();
      else if (state === 'background') cancel();
    });
    return () => {
      mounted.current = false;
      subscription.remove();
      scanId.current += 1;
      cancelNfcScan().catch(() => {
        // Unmounting: no state left to update.
      });
    };
  }, [refreshStatus, cancel]);

  const start = useCallback(
    async (onToken: (token: string) => void | Promise<void>) => {
      if (!mounted.current) return;
      const id = ++scanId.current;
      setError(null);
      setScanning(true);
      let token: string;
      try {
        token = await readTagText();
      } catch (e) {
        if (id !== scanId.current || !mounted.current) return;
        setScanning(false);
        if (e instanceof NfcError && e.code === 'CANCELLED') return;
        if (e instanceof NfcError && e.code === 'DISABLED') refreshStatus();
        setError(
          e instanceof NfcError
            ? e
            : new NfcError('UNSUPPORTED_TAG', 'The tag could not be read.'),
        );
        return;
      }
      if (id !== scanId.current || !mounted.current) return;
      setScanning(false);
      // Errors from onToken belong to the caller (e.g. an API failure).
      await onToken(token);
    },
    [refreshStatus],
  );

  return { status, scanning, error, start, cancel, openSettings: openNfcSettings };
}
