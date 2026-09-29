// Run: node --test scripts/nfc.test.mjs   (Node >= 22.18 strips TS types natively)
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { extractTagText, NfcError } from '../src/services/nfc.ts';

const require = createRequire(import.meta.url);
const { text } = require('react-native-nfc-manager/ndef-lib');
const decode = text.decodePayload;

const textRecord = (value, lang = 'en') => ({
  tnf: 1,
  type: [0x54],
  payload: text.encodePayload(value, lang),
});
const uriRecord = { tnf: 1, type: [0x55], payload: [0x04, 0x61] };

const codeOf = (fn) => {
  try {
    fn();
  } catch (e) {
    assert.ok(e instanceof NfcError);
    return e.code;
  }
  assert.fail('expected NfcError');
};

test('decodes and trims the first text record', () => {
  assert.equal(extractTagText([textRecord('  coopsetu:attend:abc123 \n')], decode), 'coopsetu:attend:abc123');
});

test('accepts string record type and skips non-text records', () => {
  const rec = { ...textRecord('tok'), type: 'T' };
  assert.equal(extractTagText([uriRecord, rec], decode), 'tok');
});

test('handles multibyte lang code and utf-8 text', () => {
  assert.equal(extractTagText([textRecord('tökén', 'en-IN')], decode), 'tökén');
});

test('empty inputs -> EMPTY_TAG', () => {
  for (const records of [undefined, null, []]) {
    assert.equal(codeOf(() => extractTagText(records, decode)), 'EMPTY_TAG');
  }
});

test('blank text -> EMPTY_TAG', () => {
  assert.equal(codeOf(() => extractTagText([textRecord('   ')], decode)), 'EMPTY_TAG');
});

test('no text record -> UNSUPPORTED_TAG', () => {
  assert.equal(codeOf(() => extractTagText([uriRecord], decode)), 'UNSUPPORTED_TAG');
  assert.equal(codeOf(() => extractTagText([{ tnf: 2, type: [0x54], payload: [0] }], decode)), 'UNSUPPORTED_TAG');
});
