import {
	ATOM_EXT,
	ATOM_UTF8_EXT,
	BINARY_EXT,
	FLOAT_EXT,
	INTEGER_EXT,
	LARGE_BIG_EXT,
	LARGE_TUPLE_EXT,
	LIST_EXT,
	MAP_EXT,
	NEW_FLOAT_EXT,
	NIL_EXT,
	Packable,
	SMALL_ATOM_EXT,
	SMALL_ATOM_UTF8_EXT,
	SMALL_BIG_EXT,
	SMALL_INTEGER_EXT,
	SMALL_TUPLE_EXT,
	STRING_EXT,
	VERSION,
} from './constants';

export class Decoder {
	private offset = 1;

	public constructor(private readonly buffer: Buffer) {
		const version = buffer.readUInt8();
		if (version !== VERSION) {
			throw new Error(`The version ${version} is unsupported.`);
		}
	}

	private read8() {
		return this.buffer.readUInt8(this.offset++);
	}

	private read16() {
		const value = this.buffer.readUInt16BE(this.offset);
		this.offset += 2;
		return value;
	}

	private read32() {
		const value = this.buffer.readUInt32BE(this.offset);
		this.offset += 4;
		return value;
	}

	public decode(): Packable {
		const tag = this.read8();

		switch (tag) {
			case MAP_EXT: {
				const length = this.read32();
				const object: Record<string | number, Packable> = {};
				for (let i = 0; i < length; i++) {
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					object[this.decode() as any] = this.decode();
				}
				return object;
			}

			case LIST_EXT: {
				const array = this.decodeArray(this.read32());
				// assume that the tail marker is always present.
				this.offset++;
				// if (this.read8() !== NIL_EXT) {
				//   throw new Error('List must end with a tail marker.');
				// }
				return array;
			}

			case NIL_EXT:
				return [];

			case BINARY_EXT:
				return this.decodeString(this.read32());

			case INTEGER_EXT: {
				const value = this.buffer.readInt32BE(this.offset);
				this.offset += 4;
				return value;
			}

			case SMALL_INTEGER_EXT:
				return this.read8();

			case SMALL_BIG_EXT:
				return this.decodeBigInt(BigInt(this.read8()));

			case NEW_FLOAT_EXT: {
				const value = this.buffer.readDoubleBE(this.offset);
				this.offset += 8;
				return value;
			}

			case SMALL_TUPLE_EXT:
				return this.decodeArray(this.read8());

			case LARGE_TUPLE_EXT:
				return this.decodeArray(this.read32());

			case LARGE_BIG_EXT:
				return this.decodeBigInt(BigInt(this.read32()));

			case ATOM_EXT:
			case ATOM_UTF8_EXT:
				return this.decodeAtom(this.read16());

			case SMALL_ATOM_EXT:
			case SMALL_ATOM_UTF8_EXT:
				return this.decodeAtom(this.read8());

			case STRING_EXT: {
				const length = this.read16();
				return this.buffer.slice(this.offset, (this.offset += length));
			}

			case FLOAT_EXT:
				return parseFloat(this.decodeString(31, 'ascii'));

			default:
				throw new Error(`Unsupported tag (${tag}).`);
		}
	}

	private decodeString(length: number, encoding?: BufferEncoding) {
		return this.buffer.slice(this.offset, (this.offset += length)).toString(encoding);
	}

	private decodeAtom(length: number) {
		const atom = this.decodeString(length);
		switch (atom) {
			case 'nil':
			case 'null':
				// eslint-disable-next-line unicorn/no-null
				return null;
			case 'true':
				return true;
			case 'false':
				return false;
			default:
				return atom;
		}
	}

	private decodeArray(length: number) {
		const array = Array<Packable>(length);
		for (let i = 0; i < length; i++) {
			array[i] = this.decode();
		}
		return array;
	}

	private decodeBigInt(length: bigint) {
		const sign = this.read8();
		let value = 0n;
		for (let i = 0n; i < length; i++) {
			value |= BigInt(this.read8()) << (i * 8n);
		}
		return (sign === 0 ? value : -value).toString();
	}
}
