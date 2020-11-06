import { createFarm } from '..//..';

// Create a worker farm
const farm = createFarm('./out/examples/basic/worker.js', {
	maxSize: 1, // Maximum amount of workers
});

(async () => {
    const res = await (await farm.spawn()).hardTask();
    console.log(`Thread returned: ${res}`);
    await farm.end();
})();
