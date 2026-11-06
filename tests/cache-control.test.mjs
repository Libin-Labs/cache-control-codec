import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { parseCacheControl, serializeCacheControl } from '../dist/esm/index.js';

test('parses extension and standard directives with normalized keys', () => {
  const parsed = parseCacheControl('Max-Age=60, no-store, extension=value');
  assert.equal(parsed.get('max-age'), '60');
  assert.equal(parsed.get('no-store'), true);
  assert.equal(parsed.get('extension'), 'value');
});
test('handles quoted values containing commas and escaped quotes', () => {
  const parsed = parseCacheControl('private="field,one", extension="a \\"b\\""');
  assert.equal(parsed.get('private'), 'field,one');
  assert.equal(parsed.get('extension'), 'a "b"');
  assert.deepEqual([...parseCacheControl(serializeCacheControl(parsed))], [...parsed]);
});
test('rejects duplicate names, empty items, and malformed quoting', () => {
  for (const value of ['no-store, NO-STORE', 'no-store,', 'x="unfinished', 'x='])
    assert.throws(() => parseCacheControl(value), TypeError);
});
test('validates numeric directives and valueless standard flags', () => {
  for (const value of ['max-age=-1', 's-maxage=1.5', 'max-age', 'immutable=yes'])
    assert.throws(() => parseCacheControl(value), TypeError);
  assert.equal(parseCacheControl('max-age=0, immutable').get('max-age'), '0');
  assert.equal(parseCacheControl('max-age=0001').get('max-age'), '0001');
  assert.equal(parseCacheControl('no-cache="etag", private="set-cookie"').get('no-cache'), 'etag');
  assert.throws(() => serializeCacheControl(new Map([['max-age', true]])), TypeError);
  assert.throws(() => serializeCacheControl(new Map([['immutable', 'yes']])), TypeError);
});
test('rejects control injection and serializer invalid tokens', () => {
  assert.throws(() => parseCacheControl('max-age=1\r\nx:y'), TypeError);
  assert.throws(() => parseCacheControl('no-store\n'), TypeError);
  assert.throws(() => serializeCacheControl(new Map([['bad name', true]])), TypeError);
  assert.throws(() => serializeCacheControl(new Map([['x', 'bad\nvalue']])), TypeError);
});
test('enforces input, output, and directive count bounds', () => {
  assert.throws(() => parseCacheControl(`x="${'a'.repeat(16_400)}"`), TypeError);
  assert.throws(() => parseCacheControl(Array(101).fill('x').join(',')), RangeError);
});
test('CommonJS exposes parser and serializer', () => {
  const api = createRequire(import.meta.url)('../dist/cjs/index.js');
  assert.deepEqual(Object.keys(api).sort(), ['parseCacheControl', 'serializeCacheControl']);
});
