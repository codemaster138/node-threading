"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.expose = void 0;
const worker_threads_1 = require("worker_threads");
const log = require("debug")("subservient:worker");
let endpoint = {};
const commands = {
    getExposed: () => {
        return Object.keys(endpoint);
    },
    runMethod: (args) => {
        return endpoint[args.name](...args.params);
    },
    end: () => {
        worker_threads_1.parentPort === null || worker_threads_1.parentPort === void 0 ? void 0 : worker_threads_1.parentPort.off("message", handleMessage);
        worker_threads_1.parentPort === null || worker_threads_1.parentPort === void 0 ? void 0 : worker_threads_1.parentPort.close();
        process.exit(0);
    },
};
async function handleCommand(cmd) {
    var _a;
    log("Received command", cmd);
    return await ((_a = commands[cmd.command]) === null || _a === void 0 ? void 0 : _a.call(commands, cmd.arguments));
}
async function handleMessage(value) {
    try {
        let res = await handleCommand(value);
        worker_threads_1.parentPort === null || worker_threads_1.parentPort === void 0 ? void 0 : worker_threads_1.parentPort.postMessage({
            res,
            id: value.id,
        });
    }
    catch (err) {
        worker_threads_1.parentPort === null || worker_threads_1.parentPort === void 0 ? void 0 : worker_threads_1.parentPort.postMessage({
            err,
            id: value.id,
        });
    }
}
function expose(endpoint_) {
    log("Worker started; exposing endpoint");
    endpoint = endpoint_;
    worker_threads_1.parentPort === null || worker_threads_1.parentPort === void 0 ? void 0 : worker_threads_1.parentPort.on("message", handleMessage);
}
exports.expose = expose;
