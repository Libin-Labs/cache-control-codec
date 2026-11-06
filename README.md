# @lp-labs/cache-control-codec

Strict `Cache-Control` directive parser and serializer. It parses directives only; freshness
calculation and policy remain with the caller. Independent, with zero runtime or peer dependencies.

## Install and quickstart

```bash
npm install @lp-labs/cache-control-codec
```

```js
import { parseCacheControl, serializeCacheControl } from '@lp-labs/cache-control-codec';

const directives = parseCacheControl('max-age=60, no-transform, extension="a,b"');
if (directives.get('max-age') !== '60') throw new Error('Directive parse failed');
if (!serializeCacheControl(directives).includes('extension="a,b"'))
  throw new Error('Serialization failed');
```

## API

- `parseCacheControl(input): Map<string, CacheDirectiveValue>` lowercases directive names; values
  are strings or `true` for valueless directives. Quoted values are unescaped.
- `serializeCacheControl(directives): string` serializes a map, quoting and escaping non-token
  values.
- `CacheDirectiveValue` is `string | true`; `CacheControl` is a readonly map of those values.

Duplicate directives, empty list items, malformed quotes, controls, CR/LF and invalid tokens are
rejected. `max-age`, `s-maxage`, `stale-if-error`, and `stale-while-revalidate` values must be
nonnegative safe decimal integers. `no-cache` and `private` may carry their optional quoted
field-name list; known valueless flags reject assigned values. Unknown extension
directives are retained. The field is limited to 16,384 characters and 100 directives. Invalid
input throws `TypeError`; output/count overflow throws `RangeError`.

Parse/serialize cost is O(n) with O(d) map storage. This codec deliberately does not compute
freshness, age, request/response precedence, shared/private cache behavior, validators, or storage
policy; use a separate policy layer for those decisions.

Runtime exports: `parseCacheControl`, `serializeCacheControl`. Type exports:
`CacheDirectiveValue`, `CacheControl`. ESM/CommonJS declarations; Node.js 18+, ES2022, no browser
globals.

## Support

If this library is useful to you, consider supporting its maintenance with a [donation via PayPal](https://www.paypal.me/LibinPrasanth).

## Author

Created by [Libin Prasanth](https://www.linkedin.com/in/libinprasanth/). Connect on LinkedIn for updates and discussion.
