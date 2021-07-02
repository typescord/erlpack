import * as ftee from '..';

const helloWorldList = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const helloWorldListWithNull = [1, 2, 3, 4, 5, 0, 6, 7, 8, 9, 10, 11];

describe('unpacks', () => {
	it('short list via string with null byte', () => {
		expect(ftee.decode(Buffer.from([131, 107, 0, 12, ...helloWorldListWithNull]))).toEqual(
			Buffer.from(helloWorldListWithNull),
		);
	});

	it('short list via string without null byte', () => {
		expect(ftee.decode(Buffer.from([131, 107, 0, 11, ...helloWorldList]))).toEqual(Buffer.from(helloWorldList));
	});

	it('binary with null byte', () => {
		expect(
			ftee.decode(Buffer.from([131, 109, 0, 0, 0, 12, 104, 101, 108, 108, 111, 0, 32, 119, 111, 114, 108, 100])),
		).toBe('hello\u0000 world');
	});

	it('binary without null byte', () => {
		expect(
			ftee.decode(Buffer.from([131, 109, 0, 0, 0, 11, 104, 101, 108, 108, 111, 32, 119, 111, 114, 108, 100])),
		).toBe('hello world');
	});

	it('dictionary', () => {
		const data = Buffer.from([
			131, 116, 0, 0, 0, 3, 97, 2, 97, 2, 97, 3, 108, 0, 0, 0, 3, 97, 1, 97, 2, 97, 3, 106, 109, 0, 0, 0, 1, 97, 97, 1,
		]);
		const unpacked = ftee.decode(data);
		expect({ a: 1, 2: 2, 3: [1, 2, 3] }).toEqual(unpacked);
	});

	it('false', () => {
		expect(ftee.decode(Buffer.from([131, 115, 5, 102, 97, 108, 115, 101]))).toBe(false);
	});

	it('true', () => {
		expect(ftee.decode(Buffer.from([131, 115, 4, 116, 114, 117, 101]))).toBe(true);
	});

	it('nil token is array', () => {
		expect(ftee.decode(Buffer.from([131, 106]))).toEqual([]);
	});

	it('nil atom is null', () => {
		expect(ftee.decode(Buffer.from([131, 115, 3, 110, 105, 108]))).toBeNull();
	});

	it('null is null', () => {
		expect(ftee.decode(Buffer.from([131, 115, 4, 110, 117, 108, 108]))).toBeNull();
	});

	it('floats', () => {
		expect(
			ftee.decode(
				Buffer.from([
					131, 99, 50, 46, 53, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 101, 43, 48,
					48, 0, 0, 0, 0, 0,
				]),
			),
		).toBe(2.5);
		expect(
			ftee.decode(
				Buffer.from([
					131, 99, 53, 46, 49, 53, 49, 50, 49, 50, 51, 56, 52, 49, 50, 51, 52, 51, 49, 50, 53, 48, 48, 48, 101, 43, 49,
					51, 0, 0, 0, 0, 0,
				]),
			),
		).toBe(51_512_123_841_234.314_234_123_414_351_234_123_413_42);
	});

	it('new floats', () => {
		expect(ftee.decode(Buffer.from([131, 70, 64, 4, 0, 0, 0, 0, 0, 0]))).toBe(2.5);
		expect(ftee.decode(Buffer.from([131, 70, 66, 199, 108, 204, 235, 237, 105, 40]))).toBe(
			51_512_123_841_234.314_234_123_414_351_234_123_413_42,
		);
	});

	it('small int', () => {
		for (let i = 0; i < 256; i++) {
			expect(ftee.decode(Buffer.from([131, 97, i]))).toBe(i);
		}
	});

	it('int32', () => {
		expect(ftee.decode(Buffer.from([131, 98, 0, 0, 4, 0]))).toBe(1024);
		expect(ftee.decode(Buffer.from([131, 98, 128, 0, 0, 0]))).toBe(-2_147_483_648);
		expect(ftee.decode(Buffer.from([131, 98, 127, 255, 255, 255]))).toBe(2_147_483_647);
	});

	it('small big ints', () => {
		expect(ftee.decode(Buffer.from([131, 110, 4, 1, 1, 2, 3, 4]))).toBe('-67305985');
		expect(ftee.decode(Buffer.from([131, 110, 4, 0, 1, 2, 3, 4]))).toBe('67305985');
		expect(ftee.decode(Buffer.from([131, 110, 10, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]))).toBe('47390263963055590408705');
	});

	it('atoms', () => {
		expect(
			ftee.decode(Buffer.from([131, 100, 0, 13, 103, 117, 105, 108, 100, 32, 109, 101, 109, 98, 101, 114, 115])),
		).toBe('guild members');
	});

	it('tuples', () => {
		expect(ftee.decode(Buffer.from([131, 104, 3, 109, 0, 0, 0, 6, 118, 97, 110, 105, 115, 104, 97, 1, 97, 4]))).toEqual(
			['vanish', 1, 4],
		);
		expect(
			ftee.decode(Buffer.from([131, 105, 0, 0, 0, 3, 109, 0, 0, 0, 6, 118, 97, 110, 105, 115, 104, 97, 1, 97, 4])),
		).toEqual(['vanish', 1, 4]);
	});

	it('excepts from malformed token', () => {
		const data = Buffer.from([
			131, 113, 0, 0, 0, 3, 97, 2, 97, 2, 97, 3, 108, 0, 0, 0, 3, 97, 1, 97, 2, 97, 3, 106, 109, 0, 0, 0, 1, 97, 97, 1,
		]);
		expect(() => ftee.decode(data)).toThrow(new Error('Unsupported tag (113).'));
		expect(() => ftee.decode(Buffer.from([131, 107, 0]))).toThrow(
			new Error('The value of "offset" is out of range. It must be >= 0 and <= 1. Received 2'),
		);
	});

	it('excepts from malformed array', () => {
		expect(() => ftee.decode(Buffer.from([131, 116, 0, 0, 0, 3, 97, 2, 97, 2, 97, 3]))).toThrow(
			new Error('The value of "offset" is out of range. It must be >= 0 and <= 11. Received 12'),
		);
	});

	it('excepts from malformed object', () => {
		const data = Buffer.from([131, 98, 0, 0, 4]);
		expect(() => ftee.decode(data)).toThrow(
			new Error('The value of "offset" is out of range. It must be >= 0 and <= 1. Received 2'),
		);
	});

	it('excepts from malformed integer', () => {
		expect(() => ftee.decode(Buffer.from([131, 98, 0, 0, 4]))).toThrow(
			new Error('The value of "offset" is out of range. It must be >= 0 and <= 1. Received 2'),
		);
	});
});
