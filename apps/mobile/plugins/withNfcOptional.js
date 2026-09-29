const { withAndroidManifest } = require('@expo/config-plugins');

const NFC_FEATURE = 'android.hardware.nfc';

/**
 * Declares NFC hardware as optional so the app stays installable from Google
 * Play on phones without an NFC chip. The JS layer reports such devices as
 * 'unsupported' via getNfcStatus().
 */
module.exports = function withNfcOptional(config) {
  return withAndroidManifest(config, (mod) => {
    const manifest = mod.modResults.manifest;
    const features = (manifest['uses-feature'] ??= []);
    const existing = features.find((f) => f.$['android:name'] === NFC_FEATURE);

    if (existing) {
      existing.$['android:required'] = 'false';
    } else {
      features.push({
        $: { 'android:name': NFC_FEATURE, 'android:required': 'false' },
      });
    }
    return mod;
  });
};
