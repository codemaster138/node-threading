"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const __1 = require("../..");
// Create a worker pool
const pool = __1.createPool('./out/examples/pool/worker.js', 1);
(async () => {
    const res = await (await pool.spawn()).hardTask();
    console.log(`Thread returned: ${res}`);
    await pool.end();
})();
