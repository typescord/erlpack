import { Packable } from './constants';
import { Decoder } from './decoder';
import { Encoder } from './encoder';

export * from './constants';

export function encode(value?: Packable, defaultBufferSize?: number): Buffer {
	return new Encoder(defaultBufferSize).encode(value);
}

export function decode(data: Buffer): Packable {
	return new Decoder(data).decode();
}
