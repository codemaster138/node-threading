import { resolve } from "path";
import { Command } from "tauris";
import { createFarm } from "../..";
import WorkerFarm from "../../master/farm/farm";
import benchmark, { printReports, runBenchmarks } from "./benchmark";

const argv_defaults = {
  t: 8,
  L: false,
};

const argv = new Command("subservient-benchmark")
  .describe(
    "A benchmark to test how subservient's multithreading compares to single-threaded node.js"
  )
  .option("L", {
    alias: ["no-live"],
    description: "Disable showing amount of operations so far",
    type: "boolean",
  })
  .parse(process.argv.slice(2));

const options = { ...argv_defaults, ...argv };

/// Single thread benchmarks ///

const processSingleThread = (_n: number) => {
  var x = 1;
  for (let i = 0; i < 100; i++) {
    x += _n;
  }
  return x;
};

const singleThread = benchmark(
  "Single thread",
  async (nums: number[]) => {
    await Promise.all([
      (async () => {
        nums.forEach((n) => processSingleThread(n));
      })(),
    ]);
  },
  () => [Array.from({ length: 10000 }, () => Math.round(Math.random() * 1000))]
);

/// Multi-thread benchmarks ///

const nWorkers = (n: number) => {
  return benchmark(
    `${n} Workers`,
    async (nums: number[], ...workers: any[]) => {
      await Promise.all(
        workers.map((worker, i) => worker.hardTask(workers.length, i, nums))
      );
    },
    (farm: any, ...workers: any[]) => [
      Array.from({ length: 10000 }, () => Math.round(Math.random() * 1000)),
      ...workers,
    ],
    async () => {
      const farm = createFarm(resolve(__dirname, "worker.js"), {
        maxSize: n,
        idleTime: 5000,
      });

      return [
        farm,
        ...(await Promise.all(Array.from({ length: n }, () => farm.spawn()))),
      ];
    },
    async (farm) => {
      await farm.end();
    }
  );
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
  const reportsSingleThread = await runBenchmarks([singleThread], {
    ops: 10000,
    noLive: options.L,
  });
  const reportsOneThread = await runBenchmarks([oneWorker], {
    ops: 10000,
    noLive: options.L,
  });
  const reportsTwoThreads = await runBenchmarks([twoWorkers], {
    ops: 10000,
    noLive: options.L,
  });
  const reportsFourThreads = await runBenchmarks([fourWorkers], {
    ops: 10000,
    noLive: options.L,
  });

  printReports(
    [
      reportsSingleThread,
      reportsOneThread,
      reportsTwoThreads,
      reportsFourThreads,
    ].reduce((a, v) => [...a, ...v], [])
  );
})();
