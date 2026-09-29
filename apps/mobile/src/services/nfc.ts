/**
 * NFC attendance tag reader.
 *
 * react-native-nfc-manager needs a development build; it does not exist in
 * Expo Go. The module is therefore required lazily and guarded so importing
 * this file can never crash Expo Go, web, or a device without NFC.
 */
import type { NdefRecord } from 'react-native-nfc-manager';

type NfcLib = typeof import('react-native-nfc-manager');

export type NfcStatus = 'unavailable' | 'unsupported' | 'disabled' | 'ready';

export type NfcErrorCode =
  | 'CANCELLED'
  | 'EMPTY_TAG'
  | 'UNSUPPORTED_TAG'
  | 'UNAVAILABLE'
  | 'DISABLED';

export class NfcError extends Error {
  code: NfcErrorCode;

  constructor(code: NfcErrorCode, message?: string) {
    super(message ?? code);
    this.name = 'NfcError';
    this.code = code;
  }
}

const TNF_WELL_KNOWN = 0x01;
const RTD_TEXT = 0x54; // 'T'

function isTextRecord(record: NdefRecord): boolean {
  if (record.tnf !== TNF_WELL_KNOWN) return false;
  const { type } = record;
  return typeof type === 'string'
    ? type === 'T'
    : type.length === 1 && type[0] === RTD_TEXT;
}

/**
 * Pure: returns the trimmed text of the first NDEF text record.
 * Throws EMPTY_TAG when the tag holds no records or only blank text, and
 * UNSUPPORTED_TAG when it holds records but none is a text record.
 */
export function extractTagText(
  records: readonly NdefRecord[] | null | undefined,
  decode: (payload: Uint8Array) => string,
): string {
  if (!records || records.length === 0) {
    throw new NfcError('EMPTY_TAG', 'The tag contains no data.');
  }
  const record = records.find(isTextRecord);
  if (!record) {
    throw new NfcError('UNSUPPORTED_TAG', 'The tag has no NDEF text record.');
  }
  const text = decode(Uint8Array.from(record.payload)).trim();
  if (!text) {
    throw new NfcError('EMPTY_TAG', 'The tag text is empty.');
  }
  return text;
}

let cachedLib: NfcLib | null | undefined;

function loadLib(): NfcLib | null {
  if (cachedLib !== undefined) return cachedLib;
  try {
    const { NativeModules } = require('react-native');
    cachedLib = NativeModules.NfcManager
      ? (require('react-native-nfc-manager') as NfcLib)
      : null;
  } catch {
    cachedLib = null;
  }
  return cachedLib;
}

let starting: Promise<void> | undefined;

function ensureStarted(lib: NfcLib): Promise<void> {
  starting ??= lib.default.start().catch((error: unknown) => {
    starting = undefined;
    throw error;
  });
  return starting;
}

// Serialises tech-request releases: the library delays its Android cleanup,
// and an overlapping release would tear down a scan started right after it.
let release: Promise<void> = Promise.resolve();

function releaseTechnology(lib: NfcLib): Promise<void> {
  release = release.then(() => lib.default.cancelTechnologyRequest());
  return release;
}

export async function getNfcStatus(): Promise<NfcStatus> {
  const lib = loadLib();
  if (!lib) return 'unavailable';
  try {
    if (!(await lib.default.isSupported())) return 'unsupported';
    await ensureStarted(lib);
    return (await lib.default.isEnabled()) ? 'ready' : 'disabled';
  } catch {
    // Native calls reject when there is no adapter or activity to query.
    return 'unsupported';
  }
}

export async function openNfcSettings(): Promise<void> {
  const lib = loadLib();
  if (lib) await lib.default.goToNfcSetting();
}

export async function cancelNfcScan(): Promise<void> {
  const lib = loadLib();
  if (lib) await releaseTechnology(lib);
}

/** Waits for one tag and resolves with the trimmed NDEF text record. */
export async function readTagText(): Promise<string> {
  const lib = loadLib();
  if (!lib) throw new NfcError('UNAVAILABLE', 'NFC needs a development build.');

  const status = await getNfcStatus();
  if (status === 'disabled') throw new NfcError('DISABLED', 'NFC is turned off.');
  if (status !== 'ready') {
    throw new NfcError('UNAVAILABLE', 'This device does not support NFC.');
  }

  await release;
  try {
    await lib.default.requestTechnology(lib.NfcTech.Ndef);
    const tag = await lib.default.getTag();
    return extractTagText(tag?.ndefMessage, lib.Ndef.text.decodePayload);
  } catch (error) {
    if (error instanceof NfcError) throw error;
    if (error instanceof lib.NfcError.UserCancel) {
      throw new NfcError('CANCELLED', 'The scan was cancelled.');
    }
    throw new NfcError(
      'UNSUPPORTED_TAG',
      error instanceof Error ? error.message : 'The tag could not be read.',
    );
  } finally {
    await releaseTechnology(lib);
  }
}
