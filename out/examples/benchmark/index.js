"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
const tauris_1 = require("tauris");
const __1 = require("../..");
const benchmark_1 = __importStar(require("./benchmark"));
const argv_defaults = {
    t: 8,
    L: false,
};
const argv = new tauris_1.Command("subservient-benchmark")
    .describe("A benchmark to test how subservient's multithreading compares to single-threaded node.js")
    .option("L", {
    alias: ["no-live"],
    description: "Disable showing amount of operations so far",
    type: "boolean",
})
    .parse(process.argv.slice(2));
const options = { ...argv_defaults, ...argv };
/// Single thread benchmarks ///
const processSingleThread = (_n) => {
    var x = 1;
    for (let i = 0; i < 100; i++) {
        x += _n;
    }
    return x;
};
const singleThread = benchmark_1.default("Single thread", async (nums) => {
    await Promise.all([
        (async () => {
            nums.forEach((n) => processSingleThread(n));
        })(),
    ]);
}, () => [Array.from({ length: 10000 }, () => Math.round(Math.random() * 1000))]);
/// Multi-thread benchmarks ///
const nWorkers = (n) => {
    return benchmark_1.default(`${n} Workers`, async (nums, ...workers) => {
        await Promise.all(workers.map((worker, i) => worker.hardTask(workers.length, i, nums)));
    }, (farm, ...workers) => [
        Array.from({ length: 10000 }, () => Math.round(Math.random() * 1000)),
        ...workers,
    ], async () => {
        const farm = __1.createFarm(path_1.resolve(__dirname, "worker.js"), {
            maxSize: n,
            idleTime: 5000,
        });
        return [
            farm,
            ...(await Promise.all(Array.from({ length: n }, () => farm.spawn()))),
        ];
    }, async (farm) => {
        await farm.end();
    });
};
// const twoWorkers = benchmark(
//   "Two workers",
//   async (nums: number[], worker1: any, worker2: any) => {
//     const p1 = worker1.hardTask(2, 0, nums);
//     const p2 = worker2.hardTask(2, 1, nums);
//     await Promise.all([p1, p2]);
//   },
//   (worker1: any, worker2: any, _farm: any) => [
//     Array.from({ length: 10000 }, () => Math.round(Math.random() * 1000)),
//     worker1,
//     worker2,
//   ],
//   async () => {
//     const farm = createFarm(resolve(__dirname, "worker.js"), {
//       maxSize: 2,
//       idleTime: 5000,
//     });
//     const worker1 = await farm.spawn();
//     const worker2 = await farm.spawn();
//     return [worker1, worker2, farm];
//   },
//   async (_w1: any, _w2: any, farm: WorkerFarm) => {
//     await farm.end();
//   }
// );
const oneWorker = nWorkers(1);
const twoWorkers = nWorkers(2);
const fourWorkers = nWorkers(4);
(async () => {
    const reportsSingleThread = await benchmark_1.runBenchmarks([singleThread], {
        ops: 10000,
        noLive: options.L,
    });
    const reportsOneThread = await benchmark_1.runBenchmarks([oneWorker], {
        ops: 10000,
        noLive: options.L,
    });
    const reportsTwoThreads = await benchmark_1.runBenchmarks([twoWorkers], {
        ops: 10000,
        noLive: options.L,
    });
    const reportsFourThreads = await benchmark_1.runBenchmarks([fourWorkers], {
        ops: 10000,
        noLive: options.L,
    });
    benchmark_1.printReports([
        reportsSingleThread,
        reportsOneThread,
        reportsTwoThreads,
        reportsFourThreads,
    ].reduce((a, v) => [...a, ...v], []));
})();
