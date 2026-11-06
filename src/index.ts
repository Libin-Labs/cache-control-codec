const TOKEN = /^[!#$%&'*+.^_`|~0-9A-Za-z-]+$(?![\s\S])/;
export type CacheDirectiveValue = string | true;
export type CacheControl = ReadonlyMap<string, CacheDirectiveValue>;

function split(input: string): string[] {
  const out: string[] = [];
  let start = 0,
    quoted = false,
    escaped = false;
  for (let i = 0; i < input.length; i++) {
    const c = input[i]!;
    if (escaped) escaped = false;
    else if (quoted && c === '\\') escaped = true;
    else if (c === '"') quoted = !quoted;
    else if (!quoted && c === ',') {
      out.push(input.slice(start, i));
      start = i + 1;
    }
  }
  if (quoted || escaped) throw new TypeError('Unterminated quoted cache directive.');
  out.push(input.slice(start));
  return out;
}

function readValue(raw: string): string {
  if (!raw.startsWith('"')) {
    if (!TOKEN.test(raw)) throw new TypeError('Invalid cache directive token value.');
    return raw;
  }
  if (!raw.endsWith('"') || raw.length < 2)
    throw new TypeError('Malformed quoted cache directive.');
  let value = '';
  for (let i = 1; i < raw.length - 1; i++) {
    let c = raw[i]!;
    if (c === '\\') c = raw[++i]!;
    else if (c === '"') throw new TypeError('Unescaped quote in cache directive.');
    if (c === undefined || /[\0-\x08\x0a-\x1f\x7f]/.test(c))
      throw new TypeError('Invalid quoted cache directive.');
    value += c;
  }
  return value;
}

export function parseCacheControl(input: string): Map<string, CacheDirectiveValue> {
  if (typeof input !== 'string' || input.length > 16_384 || /[\r\n\0]/.test(input))
    throw new TypeError('Invalid Cache-Control field.');
  const result = new Map<string, CacheDirectiveValue>();
  const parts = split(input);
  if (parts.length > 100) throw new RangeError('Cache directive count limit exceeded.');
  for (const raw of parts) {
    const item = raw.trim();
    if (!item) throw new TypeError('Empty cache directive.');
    const equals = item.indexOf('=');
    const name = (equals < 0 ? item : item.slice(0, equals)).trim().toLowerCase();
    if (!TOKEN.test(name) || result.has(name))
      throw new TypeError('Invalid or duplicate cache directive.');
    const value = equals < 0 ? true : readValue(item.slice(equals + 1).trim());
    if (/^(?:s-maxage|max-age|stale-if-error|stale-while-revalidate)$/.test(name) && value === true)
      throw new TypeError(`${name} requires a value.`);
    if (
      typeof value === 'string' &&
      /^(?:s-maxage|max-age|stale-if-error|stale-while-revalidate)$/.test(name)
    ) {
      if (!/^\d+$(?![\s\S])/.test(value) || !Number.isSafeInteger(Number(value)))
        throw new TypeError(`Invalid numeric cache directive: ${name}`);
    }
    if (
      name === 'public' ||
      name === 'no-store' ||
      name === 'no-transform' ||
      name === 'must-revalidate' ||
      name === 'proxy-revalidate' ||
      name === 'immutable' ||
      name === 'must-understand'
    ) {
      if (value !== true) throw new TypeError(`${name} must not have a value.`);
    }
    result.set(name, value);
  }
  return result;
}

export function serializeCacheControl(directives: CacheControl): string {
  const parts: string[] = [];
  for (const [rawName, value] of directives) {
    const name = rawName.toLowerCase();
    if (!TOKEN.test(name)) throw new TypeError('Invalid cache directive name.');
    const numeric = /^(?:s-maxage|max-age|stale-if-error|stale-while-revalidate)$/.test(name);
    if (numeric && value === true) throw new TypeError(`${name} requires a value.`);
    if (
      numeric &&
      typeof value === 'string' &&
      (!/^\d+$(?![\s\S])/.test(value) || !Number.isSafeInteger(Number(value)))
    )
      throw new TypeError(`Invalid numeric cache directive: ${name}`);
    const valueless =
      /^(?:public|no-store|no-transform|must-revalidate|proxy-revalidate|immutable|must-understand)$/.test(
        name,
      );
    if (valueless && value !== true) throw new TypeError(`${name} must not have a value.`);
    if (value === true) parts.push(name);
    else {
      if (/[\0-\x1f\x7f]/.test(value)) throw new TypeError('Control character in cache directive.');
      const encoded = TOKEN.test(value) ? value : `"${value.replace(/(["\\])/g, '\\$1')}"`;
      parts.push(`${name}=${encoded}`);
    }
    if (parts.length > 100) throw new RangeError('Cache directive count limit exceeded.');
  }
  const result = parts.join(', ');
  if (result.length > 16_384) throw new RangeError('Cache-Control field is too long.');
  return result;
}
