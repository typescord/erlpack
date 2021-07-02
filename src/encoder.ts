import {
	INTEGER_EXT,
	LARGE_BIG_EXT,
	LIST_EXT,
	MAP_EXT,
	NEW_FLOAT_EXT,
	NIL_EXT,
	SMALL_ATOM_UTF8_EXT,
	SMALL_BIG_EXT,
	SMALL_INTEGER_EXT,
	BINARY_EXT,
	VERSION,
	Packable,
	STRING_EXT,
} from './constants';

const GOLDEN_RATIO = (1 + Math.sqrt(5)) / 2;

export class Encoder {
	public static readonly DEFAULT_BUFFER_SIZE = 2048;

	private buffer: Buffer;
	private offset = 1;

	public constructor(defaultBufferSize = Encoder.DEFAULT_BUFFER_SIZE) {
		this.buffer = Buffer.alloc(defaultBufferSize);
		this.buffer.writeUInt8(VERSION);
	}

	private ensure(size: number) {
		if (this.offset + size > this.buffer.length) {
			const oldBuffer = this.buffer;
			// ~1.6... growth factor.
			oldBuffer.copy((this.buffer = Buffer.alloc(Math.round(oldBuffer.length * GOLDEN_RATIO + size))));
		}
	}

	private append8(value: number) {
		this.buffer.writeUInt8(value, this.offset++);
	}

	private append32(value: number) {
		this.buffer.writeUInt32BE(value, this.offset);
		this.offset += 4;
	}

	public encode(value: Packable): Buffer {
		this.encodeValue(value);
		return this.buffer.slice(0, this.offset);
	}

	// eslint-disable-next-line sonarjs/cognitive-complexity
	private encodeValue(value: Packable) {
		if (value === null || value === undefined) {
			this.encodeAtom('nil');
			return;
		}

		switch (typeof value) {
			case 'object': {
				if (value instanceof Buffer) {
					if (value.byteLength < 65_536) {
						this.ensure(3 + value.byteLength); // 1 + 2 + value.byteLength
						this.append8(STRING_EXT);
						this.buffer.writeUInt16BE(value.byteLength, this.offset);
						this.offset += 2;
						value.copy(this.buffer, undefined, undefined, value.byteLength - 1);
						this.offset += value.byteLength - 1;
					} else {
						this.ensure(6 + 2 * value.byteLength); // 1 + 4 + 2 * value.byteLength + 1
						this.append8(LIST_EXT);
						this.append32(value.byteLength);
						for (let i = 0; i < value.byteLength; i++) {
							this.append8(SMALL_INTEGER_EXT);
							this.append8(value[i]);
						}
						this.append8(NIL_EXT);
						this.offset += value.byteLength - 1;
					}
					return;
				}

				if (Array.isArray(value)) {
					if (value.length === 0) {
						this.ensure(1);
						this.append8(NIL_EXT);
						return;
					}
					this.ensure(7); // 1 + 4 + 1 + 1 (???)
					this.append8(LIST_EXT);
					this.append32(value.length);
					// eslint-disable-next-line unicorn/no-for-loop
					for (let i = 0; i < value.length; i++) {
						this.encodeValue(value[i]);
					}
					this.append8(NIL_EXT);
					return;
				}

				this.ensure(5); // 1 + 4
				this.append8(MAP_EXT);
				const keys = Object.keys(value);
				this.append32(keys.length);
				// eslint-disable-next-line unicorn/no-for-loop
				for (let i = 0; i < keys.length; i++) {
					this.encodeString(keys[i]); // the key is always a string
					this.encodeValue(value[keys[i]]);
				}
				return;
			}

			case 'string':
				this.encodeString(value);
				return;

			case 'number': {
				if (Number.isInteger(value)) {
					if (value > -1 && value < 256) {
						this.ensure(2); // 1 + 1
						this.append8(SMALL_INTEGER_EXT);
						this.append8(value);
						return;
					}

					if (value > -2_147_483_649 && value < 2_147_483_648) {
						this.ensure(5); // 1 + 4
						this.append8(INTEGER_EXT);
						this.buffer.writeInt32BE(value, this.offset);
						this.offset += 4;
						return;
					}

					this.encodeBigInt(BigInt(value));
					return;
				}

				this.ensure(9); // 1 + 8
				this.append8(NEW_FLOAT_EXT);
				this.buffer.writeDoubleBE(value, this.offset);
				this.offset += 8;
				return;
			}

			case 'boolean':
				this.encodeAtom(value ? 'true' : 'false');
				return;

			case 'bigint':
				this.encodeBigInt(value);
				return;

			default:
				throw new Error(`Unsupported value type (${typeof value}).`);
		}
	}

	private encodeString(string: string) {
		const stringLength = Buffer.byteLength(string);
		this.ensure(5 + stringLength); // 1 + 4 + stringLength
		this.append8(BINARY_EXT);
		this.append32(stringLength);
		this.buffer.write(string, this.offset, stringLength);
		this.offset += stringLength;
	}

	private encodeAtom(atom: string) {
		this.ensure(2 + atom.length); // 1 + 1 + atom.length
		this.append8(SMALL_ATOM_UTF8_EXT);
		this.append8(atom.length);
		// atom is always ASCII ('true', 'false', 'null', or 'nil').
		for (let i = 0; i < atom.length; i++) {
			this.buffer[this.offset++] = atom.charCodeAt(i);
		}
	}

	private encodeBigInt(value: bigint) {
		this.ensure(3); // 1 + 1 + 1
		// assume that `value` is SMALL_BIG_EXT by default.
		this.append8(SMALL_BIG_EXT);
		const byteLengthIndex = this.offset++;
		this.append8(value < 0n ? 1 : 0);
		let ull = value < 0n ? -value : value;
		let byteLength = 0;
		while (ull > 0) {
			this.ensure(1);
			this.append8(Number(ull & 0xffn));
			ull >>= 8n;
			byteLength++;
		}

		if (byteLength < 256) {
			this.buffer.writeUInt8(byteLength, byteLengthIndex);
			return;
		}

		this.buffer.writeUInt8(LARGE_BIG_EXT, byteLengthIndex - 1);

		// shift values by 3.
		this.ensure(3);
		for (let i = this.offset; i >= byteLengthIndex; i--) {
			this.buffer[i + 3] = this.buffer[i];
		}
		this.offset += 3;

		this.buffer.writeUInt32BE(byteLength, byteLengthIndex);
	}
}
