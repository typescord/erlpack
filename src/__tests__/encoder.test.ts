import * as ftee from '..';

describe('packs', () => {
	it('string with null byte', () => {
		const expected = Buffer.from([131, 109, 0, 0, 0, 12, 104, 101, 108, 108, 111, 0, 32, 119, 111, 114, 108, 100]);
		expect(ftee.encode('hello\u0000 world').equals(expected)).toBe(true);
	});

	it('string without null byte', () => {
		const expected = Buffer.from([131, 109, 0, 0, 0, 11, 104, 101, 108, 108, 111, 32, 119, 111, 114, 108, 100]);
		expect(ftee.encode('hello world').equals(expected)).toBe(true);
	});

	it('dictionary', () => {
		const expected = Buffer.from([
			131, 116, 0, 0, 0, 3, 109, 0, 0, 0, 1, 50, 97, 2, 109, 0, 0, 0, 1, 51, 108, 0, 0, 0, 3, 97, 1, 97, 2, 97, 3, 106,
			109, 0, 0, 0, 1, 97, 97, 1,
		]);
		const packed = ftee.encode({ a: 1, '2': 2, '3': [1, 2, 3] });
		expect(packed.equals(expected)).toBe(true);
	});

	it('false', () => {
		const expected = Buffer.from([131, 119, 5, 102, 97, 108, 115, 101]);
		const packed = ftee.encode(false);
		expect(packed.equals(expected)).toBe(true);
	});

	it('true', () => {
		const expected = Buffer.from([131, 119, 4, 116, 114, 117, 101]);
		const packed = ftee.encode(true);
		expect(packed.equals(expected)).toBe(true);
	});

	it('null and undefined are nil atom', () => {
		const expected = Buffer.from([131, 119, 3, 110, 105, 108]);
		// eslint-disable-next-line unicorn/no-null
		expect(ftee.encode(null).equals(expected)).toBe(true);
		expect(ftee.encode().equals(expected)).toBe(true);
	});

	it('floats as new floats', () => {
		expect(ftee.encode(2.5).equals(Buffer.from([131, 70, 64, 4, 0, 0, 0, 0, 0, 0]))).toBe(true);
		expect(
			ftee
				.encode(51_512_123_841_234.314_234_123_414_351_234_123_413_42)
				.equals(Buffer.from([131, 70, 66, 199, 108, 204, 235, 237, 105, 40])),
		).toBe(true);
	});

	it('small int', () => {
		for (let i = 0; i < 256; i++) {
			expect(Buffer.from([131, 97, i]).equals(ftee.encode(i))).toBe(true);
		}
	});

	it('int32', () => {
		expect(ftee.encode(1024).equals(Buffer.from([131, 98, 0, 0, 4, 0]))).toBe(true);
		expect(ftee.encode(-2_147_483_648).equals(Buffer.from([131, 98, 128, 0, 0, 0]))).toBe(true);
		expect(ftee.encode(2_147_483_647).equals(Buffer.from([131, 98, 127, 255, 255, 255]))).toBe(true);
	});

	it('big ints', () => {
		expect(ftee.encode(-67_305_985n).equals(Buffer.from([131, 110, 4, 1, 1, 2, 3, 4]))).toBe(true);
		expect(ftee.encode(67_305_985n).equals(Buffer.from([131, 110, 4, 0, 1, 2, 3, 4]))).toBe(true);
		expect(ftee.encode(-578_437_695_752_307_201n).equals(Buffer.from([131, 110, 8, 1, 1, 2, 3, 4, 5, 6, 7, 8]))).toBe(
			true,
		);
		expect(ftee.encode(578_437_695_752_307_201n).equals(Buffer.from([131, 110, 8, 0, 1, 2, 3, 4, 5, 6, 7, 8]))).toBe(
			true,
		);
	});

	it('very big ints', () => {
		const expected = Buffer.from([
			131, 111, 0, 0, 1, 0, 0, 199, 113, 28, 199, 113, 28, 199, 113, 28, 199, 113, 28, 199, 113, 28, 199, 113, 28, 199,
			113, 28, 199, 113, 28, 199, 113, 28, 199, 113, 28, 199, 113, 28, 199, 113, 28, 199, 113, 28, 199, 113, 28, 199,
			113, 28, 199, 113, 28, 199, 113, 28, 199, 113, 28, 199, 113, 28, 199, 113, 28, 199, 113, 28, 199, 113, 28, 199,
			113, 28, 199, 113, 28, 199, 113, 28, 199, 113, 22, 163, 161, 231, 18, 130, 10, 140, 88, 232, 79, 41, 99, 87, 160,
			31, 239, 212, 9, 5, 208, 206, 87, 81, 246, 53, 178, 215, 172, 140, 169, 180, 33, 82, 13, 69, 8, 242, 141, 255, 96,
			221, 202, 68, 140, 189, 213, 98, 4, 49, 253, 0, 197, 202, 104, 209, 131, 150, 170, 19, 94, 212, 245, 195, 220,
			229, 139, 107, 230, 29, 60, 56, 237, 150, 126, 12, 44, 208, 207, 249, 80, 146, 221, 125, 152, 15, 39, 124, 20,
			199, 180, 178, 209, 155, 138, 97, 145, 61, 252, 128, 215, 20, 37, 196, 3, 126, 19, 0, 255, 1, 88, 136, 207, 38,
			78, 46, 46, 145, 149, 228, 150, 44, 20, 72, 9, 57, 165, 193, 69, 132, 207, 89, 254, 121, 28, 3, 31, 151, 8, 119,
			77, 187, 226, 242, 129, 144, 212, 140, 1, 94, 91, 227, 101, 4, 64, 45, 96, 102, 81, 218, 17, 160, 136, 47, 63,
			204, 120, 202, 146, 67, 172, 167, 189, 251, 227, 28, 87, 4, 88,
		]);
		expect(ftee.encode(BigInt('1'.repeat(617))).equals(expected)).toBe(true);
		expected.writeUInt8(1, 6); // sign -
		expect(ftee.encode(-BigInt('1'.repeat(617))).equals(expected)).toBe(true);
	});

	it('list', () => {
		const expected = Buffer.from([
			131, 108, 0, 0, 0, 5, 97, 1, 109, 0, 0, 0, 3, 116, 119, 111, 70, 64, 8, 204, 204, 204, 204, 204, 205, 109, 0, 0,
			0, 4, 102, 111, 117, 114, 108, 0, 0, 0, 1, 109, 0, 0, 0, 4, 102, 105, 118, 101, 106, 106,
		]);
		expect(ftee.encode([1, 'two', 3.1, 'four', ['five']]).equals(expected)).toBe(true);
	});

	it('empty list', () => {
		expect(ftee.encode([]).equals(Buffer.from([131, 106]))).toBe(true);
	});
});
