"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.printReports = exports.runBenchmarks = void 0;
const perf_hooks_1 = require("perf_hooks");
const log_update_1 = __importDefault(require("log-update"));
const chalk_1 = __importDefault(require("chalk"));
/**
 * Create a benchmark
 * @param name Benchmark name
 * @param bench Function to benchmark
 * @param getArgs A function that generates arguments for the benchmark function
 * @param setup Preparations for the benchmark, like setting up long-lasting network connections
 */
function benchmark(name, bench, getArgs, setup, cleanup) {
    return {
        name,
        execute: async ({ time, ops, update }) => {
            const _setup = (await (setup === null || setup === void 0 ? void 0 : setup())) || [];
            var opCount = 0;
            const startTime = perf_hooks_1.performance.now();
            if (time) {
                var now = perf_hooks_1.performance.now();
                var lastNow = now;
                while ((() => {
                    lastNow = now;
                })() ||
                    (now = perf_hooks_1.performance.now()) < startTime) {
                    await bench(...((getArgs === null || getArgs === void 0 ? void 0 : getArgs(..._setup)) || []));
                    opCount += 1;
                    if (now - lastNow > 100)
                        update(opCount, now - startTime);
                }
                cleanup === null || cleanup === void 0 ? void 0 : cleanup(..._setup);
                return {
                    name: name,
                    opsPerSecond: opCount / ((perf_hooks_1.performance.now() - startTime) / 1000),
                    opCount: opCount,
                    timeMillis: perf_hooks_1.performance.now() - startTime,
                    benchType: "time",
                };
            }
            else if (ops) {
                var lastNow = perf_hooks_1.performance.now();
                while (opCount < ops) {
                    await bench(...((getArgs === null || getArgs === void 0 ? void 0 : getArgs(..._setup)) || []));
                    opCount += 1;
                    const now = perf_hooks_1.performance.now();
                    if (now - lastNow > 100) {
                        update(opCount, now - startTime);
                        lastNow = now;
                    }
                }
                cleanup === null || cleanup === void 0 ? void 0 : cleanup(..._setup);
                return {
                    name: name,
                    opsPerSecond: opCount / ((perf_hooks_1.performance.now() - startTime) / 1000),
                    opCount: opCount,
                    timeMillis: perf_hooks_1.performance.now() - startTime,
                    benchType: "count",
                };
            }
            else
                throw new Error("Both time and ops empty");
        },
    };
}
exports.default = benchmark;
async function runBenchmarks(benchmarks, { time, ops, noLive }) {
    var logs = benchmarks.reduce((acc, bench) => ({ ...acc, [bench.name]: "Starting..." }), {});
    const logUpdateFn = log_update_1.default.create(process.stdout, { showCursor: true });
    const updateLogs = () => {
        !noLive &&
            logUpdateFn(Object.keys(logs)
                .map((log) => `${log}\t\t\t${logs[log]}`)
                .join("\n"));
    };
    const createUpdate = (name) => (ops, time) => {
        logs[name] = `${ops} Operations\t${ops / (time / 1000)} ops/sec\t\t${time}ms`;
        updateLogs();
    };
    updateLogs();
    const reports = await Promise.all(benchmarks.map((bench) => bench.execute({ time: time, ops: ops, update: createUpdate(bench.name) })));
    logUpdateFn.done();
    return reports;
}
exports.runBenchmarks = runBenchmarks;
function printReports(reports) {
    const longestName = reports.reduce((a, v) => (v.name.length > a ? v.name.length : a), 0);
    const fastestTime = reports.reduce((a, v) => (v.timeMillis < a.timeMillis ? v : a), {
        opsPerSecond: 0,
        name: "null",
        opCount: 0,
        timeMillis: Infinity,
        benchType: "time",
    });
    const slowestTime = reports.reduce((a, v) => (v.timeMillis > a.timeMillis ? v : a), {
        opsPerSecond: Infinity,
        name: "null",
        opCount: Infinity,
        timeMillis: 0,
        benchType: "time",
    });
    const fastestCount = reports.reduce((a, v) => (v.opCount > a.opCount ? v : a), {
        opsPerSecond: 0,
        name: "null",
        opCount: 0,
        timeMillis: Infinity,
        benchType: "time",
    });
    const slowestCount = reports.reduce((a, v) => (v.opCount < a.opCount ? v : a), {
        opsPerSecond: Infinity,
        name: "null",
        opCount: Infinity,
        timeMillis: 0,
        benchType: "time",
    });
    const fastestPerSec = reports.reduce((a, v) => (v.opsPerSecond > a.opsPerSecond ? v : a), {
        opsPerSecond: 0,
        name: "null",
        opCount: 0,
        timeMillis: Infinity,
        benchType: "time",
    });
    const slowestPerSec = reports.reduce((a, v) => (v.opsPerSecond < a.opsPerSecond ? v : a), {
        opsPerSecond: Infinity,
        name: "null",
        opCount: Infinity,
        timeMillis: 0,
        benchType: "time",
    });
    console.log(chalk_1.default `\n{green Benchmark complete!}`);
    reports.forEach((report) => {
        console.log(chalk_1.default `{yellow ${report.name}:${" ".repeat(longestName - report.name.length)}}    ${(fastestPerSec.name === report.name
            ? chalk_1.default.green
            : slowestPerSec.name === report.name
                ? chalk_1.default.red
                : chalk_1.default.yellow)(report.opsPerSecond)} ops/sec\t\t\t${(fastestTime.name === report.name
            ? chalk_1.default.green
            : slowestTime.name === report.name
                ? chalk_1.default.red
                : chalk_1.default.yellow)(Math.round(report.timeMillis))}ms\t\t\t${(fastestCount.name === report.name
            ? chalk_1.default.green
            : slowestCount.name === report.name
                ? chalk_1.default.red
                : chalk_1.default.yellow)(report.opCount)} ops total`);
    });
}
exports.printReports = printReports;
