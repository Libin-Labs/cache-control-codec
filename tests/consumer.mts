import {
  parseCacheControl,
  serializeCacheControl,
  type CacheDirectiveValue,
} from '@lp-labs/cache-control-codec';
const directives: Map<string, CacheDirectiveValue> = parseCacheControl('no-store');
const line: string = serializeCacheControl(directives);
// @ts-expect-error directives accept only strings or true.
serializeCacheControl(new Map([['x', 1]]));
void line;
