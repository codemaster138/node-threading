import { performance } from "perf_hooks";
import logUpdate from "log-update";
import chalk from "chalk";

interface BenchmarkReport {
  name: string;
  opsPerSecond: number;
  opCount: number;
  timeMillis: number;
  benchType: "time" | "count";
}

interface Benchmark {
  name: string;
  execute: (args: {
    time?: number;
    ops?: number;
    update: (ops: number, time: number) => void;
  }) => Promise<BenchmarkReport>;
}

/**
 * Create a benchmark
 * @param name Benchmark name
 * @param bench Function to benchmark
 * @param getArgs A function that generates arguments for the benchmark function
 * @param setup Preparations for the benchmark, like setting up long-lasting network connections
 */
export default function benchmark(
  name: string,
  bench: (...args: any[]) => any,
  getArgs?: (...setup: any[]) => any[],
  setup?: () => any[] | Promise<any[]>,
	cleanup?: (...setup: any[]) => void
): Benchmark {
  return {
    name,
    execute: async ({ time, ops, update }) => {
      const _setup = (await setup?.()) || [];
      var opCount = 0;
      const startTime = performance.now();

      if (time) {
        var now = performance.now();
        var lastNow = now;
        while (
          ((() => {
            lastNow = now;
          })() as any) ||
          (now = performance.now()) < startTime
        ) {
          await bench(...(getArgs?.(..._setup) || []));
          opCount += 1;
          if (now - lastNow > 100) update(opCount, now - startTime);
        }
				cleanup?.(..._setup);
        return {
          name: name,
          opsPerSecond: opCount / ((performance.now() - startTime) / 1000),
          opCount: opCount,
          timeMillis: performance.now() - startTime,
          benchType: "time",
        };
      } else if (ops) {
        var lastNow = performance.now();
        while (opCount < ops) {
          await bench(...(getArgs?.(..._setup) || []));
          opCount += 1;
          const now = performance.now();
          if (now - lastNow > 100) {
            update(opCount, now - startTime);
            lastNow = now;
          }
        }
				cleanup?.(..._setup);
        return {
          name: name,
          opsPerSecond: opCount / ((performance.now() - startTime) / 1000),
          opCount: opCount,
          timeMillis: performance.now() - startTime,
          benchType: "count",
        };
      } else throw new Error("Both time and ops empty");
    },
  };
}

export async function runBenchmarks(
  benchmarks: Benchmark[],
  { time, ops, noLive }: { time?: number; ops?: number; noLive?: boolean }
): Promise<BenchmarkReport[]> {
  var logs = benchmarks.reduce<{ [key: string]: any }>(
    (acc, bench) => ({ ...acc, [bench.name]: "Starting..." }),
    {}
  );

  const logUpdateFn = logUpdate.create(process.stdout, { showCursor: true });

  const updateLogs = () => {
    !noLive &&
      logUpdateFn(
        Object.keys(logs)
          .map((log) => `${log}\t\t\t${logs[log]}`)
          .join("\n")
      );
  };

  const createUpdate = (name: string) => (ops: number, time: number) => {
    logs[name] = `${ops} Operations\t${
      ops / (time / 1000)
    } ops/sec\t\t${time}ms`;
    updateLogs();
  };

  updateLogs();

  const reports = await Promise.all(
    benchmarks.map((bench) =>
      bench.execute({ time: time, ops: ops, update: createUpdate(bench.name) })
    )
  );

  logUpdateFn.done();
  return reports;
}

export function printReports(reports: BenchmarkReport[]) {
  const longestName = reports.reduce<number>(
    (a, v) => (v.name.length > a ? v.name.length : a),
    0
  );

  const fastestTime = reports.reduce<BenchmarkReport>(
    (a, v) => (v.timeMillis < a.timeMillis ? v : a),
    {
      opsPerSecond: 0,
      name: "null",
      opCount: 0,
      timeMillis: Infinity,
      benchType: "time",
    }
  );

  const slowestTime = reports.reduce<BenchmarkReport>(
    (a, v) => (v.timeMillis > a.timeMillis ? v : a),
    {
      opsPerSecond: Infinity,
      name: "null",
      opCount: Infinity,
      timeMillis: 0,
      benchType: "time",
    }
  );

  const fastestCount = reports.reduce<BenchmarkReport>(
    (a, v) => (v.opCount > a.opCount ? v : a),
    {
      opsPerSecond: 0,
      name: "null",
      opCount: 0,
      timeMillis: Infinity,
      benchType: "time",
    }
  );

  const slowestCount = reports.reduce<BenchmarkReport>(
    (a, v) => (v.opCount < a.opCount ? v : a),
    {
      opsPerSecond: Infinity,
      name: "null",
      opCount: Infinity,
      timeMillis: 0,
      benchType: "time",
    }
  );

  const fastestPerSec = reports.reduce<BenchmarkReport>(
    (a, v) => (v.opsPerSecond > a.opsPerSecond ? v : a),
    {
      opsPerSecond: 0,
      name: "null",
      opCount: 0,
      timeMillis: Infinity,
      benchType: "time",
    }
  );

  const slowestPerSec = reports.reduce<BenchmarkReport>(
    (a, v) => (v.opsPerSecond < a.opsPerSecond ? v : a),
    {
      opsPerSecond: Infinity,
      name: "null",
      opCount: Infinity,
      timeMillis: 0,
      benchType: "time",
    }
  );

  console.log(chalk`\n{green Benchmark complete!}`);

  reports.forEach((report) => {
    console.log(
      chalk`{yellow ${report.name}:${" ".repeat(
        longestName - report.name.length
      )}}    ${(fastestPerSec.name === report.name
        ? chalk.green
        : slowestPerSec.name === report.name
        ? chalk.red
        : chalk.yellow)(
        report.opsPerSecond
      )} ops/sec\t\t\t${(fastestTime.name === report.name
        ? chalk.green
        : slowestTime.name === report.name
        ? chalk.red
        : chalk.yellow)(
        Math.round(report.timeMillis)
      )}ms\t\t\t${(fastestCount.name === report.name
        ? chalk.green
        : slowestCount.name === report.name
        ? chalk.red
        : chalk.yellow)(report.opCount)} ops total`
    );
  });
}
