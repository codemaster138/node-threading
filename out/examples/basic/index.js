"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const __1 = require("..//..");
// Create a worker farm
const farm = __1.createFarm('./out/examples/basic/worker.js', {
    maxSize: 1,
});
(async () => {
    const res = await (await farm.spawn()).hardTask();
    console.log(`Thread returned: ${res}`);
    await farm.end();
})();
