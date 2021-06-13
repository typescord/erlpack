# Ftee (Format Term External Erlang)

Ftee is a fast encoder and decoder for the Erlang External Term Format (version 131) written in TypeScript.

**Note:** the decoder does not check the lists' tail marker. _If this is inconvenient, feel free to make an issue/PR._

### Supported terms

- Atoms (decode-only)
- Booleans
- [Strings](https://erlang.org/doc/apps/erts/erl_ext_dist.html#binary_ext)
- Floats
- Integers
- Larges and smalls bigs
- [Map (objects)](https://erlang.org/doc/apps/erts/erl_ext_dist.html#map_ext)
- [Arrays](https://erlang.org/doc/apps/erts/erl_ext_dist.html#list_ext)
- Tuples (decode-only)
- ["Strings"](https://erlang.org/doc/apps/erts/erl_ext_dist.html#string_ext) (via Buffer, larges buffers are encoded as lists.)

### How to encode

```js
const ftee = require('@typescord/ftee');

const packed = ftee.encode({ a: true, list: ['of', 3, 'things', 'to', 'pack'] });
console.log(packed);
```

### How to decode

**Note:** `LARGE_BIG_EXT` or `SMALL_BIG_EXT` are decoded as `string`s (instead of `bigint`s).

```js
const ftee = require('@typescord/ftee');

const packed = Buffer.from('\u0083\u006d\u0000\u0000\u0000\u000bHello world', 'binary');
try {
	const unpacked = ftee.decode(packed);
	console.log(unpacked);
} catch (error) {
	console.error(error);
}
```
