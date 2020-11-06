import { createFarm } from '../..';

// Create a worker farm
const farm = createFarm('./out/examples/basic/worker.js', {
	maxSize: 3, // Maximum amount of workers
});

async function run(name: string) {
    console.log(`Thread ${name} starting`);
    const res = await (await farm.spawn()).hardTask();
    return console.log(`Thread ${name} returned: ${res}`);
}

(async () => {
    await Promise.all([
        run('#1'),
        run('#2'),
        run('#3')
    ])

    console.log('All threads done');
    await farm.end();
    console.log('All threads terminated');
})();
