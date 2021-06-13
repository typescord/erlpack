const { cpus } = require('os');
const Benchmark = require('benchmark');
const ftee = require('./build');

const parsedData = {
	a: 1,
	b: { c: [3, 4, 5], d: { c: [{ 1: 2 }, 3, 'é	><,péé~~😀😉😐😑😍🤩😑😪😴😓😲'] } },
	d: null,
	e: { g: [{ h: null, i: 'j' }, '147878194'], a__bb: '124', 124: 4, 9: [] },
	6: undefined,
};
const data = JSON.stringify(parsedData);
const encodedData = ftee.encode(parsedData);

console.log(`Results (Node.js ${process.version}, ${cpus()[0].model}):\n`);

new Benchmark.Suite()
	.add('JSON.parse', () => JSON.parse(data))
	.add('ftee.decode', () => ftee.decode(encodedData))
	.add('JSON.stringify', () => JSON.stringify(parsedData))
	.add('ftee.encode', () => ftee.encode(parsedData))

	.on('cycle', ({ target }) => console.log(`${target}${target.id % 4 === 0 ? '\n' : ''}`))
	.run({ async: true });

// Results (Node.js v15.14.0, Intel(R) Core(TM) i5-2410M CPU @ 2.30GHz):

// JSON.parse x 192,198 ops/sec ±4.96% (82 runs sampled)
// ftee.decode x 52,886 ops/sec ±9.07% (78 runs sampled)
// JSON.stringify x 100,985 ops/sec ±11.04% (62 runs sampled)
// ftee.encode x 16,640 ops/sec ±51.38% (58 runs sampled)
