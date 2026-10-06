/* global __dirname */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { harness } = require('./support/firestore-harness.cjs');
function luminance(hex) { const channels = hex.slice(1).match(/../g).map(value => parseInt(value, 16) / 255).map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4); return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]; }
function contrast(a, b) { const values = [luminance(a), luminance(b)].sort((a, b) => b - a); return (values[0] + 0.05) / (values[1] + 0.05); }
test('primary button, body text and muted text have readable contrast on their actual surfaces', () => {
  const { palette } = harness().load('src/constants/restaurant-theme.ts');
  for (const [text, background] of [[palette.white, palette.primary], [palette.white, palette.olive], [palette.cocoa, palette.cream], [palette.muted, palette.cream], [palette.muted, palette.white], [palette.muted, palette.sand]]) assert.ok(contrast(text, background) >= 4.5, `${text} on ${background}`);
});
test('all semantic status labels have readable text contrast and a background distinct from their foreground', () => {
  const { statusTone } = harness().load('src/constants/restaurant-theme.ts');
  for (const status of ['confirmed','arrived','seated','completed','cancelled','no_show','available','reserved','occupied','cleaning','waiting','called','high','medium','info','unknown']) { const tone = statusTone(status); assert.ok(contrast(tone.foreground, tone.background) >= 4.5, status); }
});
test('every restaurant image reference resolves to a locally bundled JPEG with no remote runtime image URL', () => {
  const source = fs.readFileSync(path.join(__dirname, '../src/constants/restaurant-images.ts'), 'utf8');
  assert.doesNotMatch(source, /https?:/);
  for (const match of source.matchAll(/require\('([^']+)'\)/g)) { const image = fs.readFileSync(path.resolve(__dirname, '../src/constants', match[1])); assert.equal(image[0], 0xff); assert.equal(image[1], 0xd8); }
});
