import { createPool } from '../..';

// Create a worker pool
const pool = createPool('./out/examples/pool/worker.js', 1);

(async () => {
    const res = await (await pool.spawn()).hardTask();
    console.log(`Thread returned: ${res}`);
    await pool.end();
})();
