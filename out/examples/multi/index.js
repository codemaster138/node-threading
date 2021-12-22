"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const __1 = require("../..");
// Create a worker farm
const farm = __1.createFarm('./out/examples/basic/worker.js', {
    maxSize: 3,
});
async function run(name) {
    console.log(`Thread ${name} starting`);
    const res = await (await farm.spawn()).hardTask();
    return console.log(`Thread ${name} returned: ${res}`);
}
(async () => {
    await Promise.all([
        run('#1'),
        run('#2'),
        run('#3')
    ]);
    console.log('All threads done');
    await farm.end();
    console.log('All threads terminated');
})();
