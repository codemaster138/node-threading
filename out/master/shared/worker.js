"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkerInterface = void 0;
const events_1 = require("events");
const worker_threads_1 = require("worker_threads");
const uuid_1 = require("uuid");
const log = require("debug")("subservient:workerMaster");
class WorkerInterface extends events_1.EventEmitter {
    constructor(file, idleTime) {
        super();
        this.lock_ = "";
        this.idleTime = 0;
        this.interface = undefined;
        this.commandQueue = [];
        this.online = false;
        this.idleTime = idleTime || 0;
        this.worker = new worker_threads_1.Worker(file, {
            workerData: {
                idleTime: this.idleTime,
            },
            env: {
                DEBUG: process.env.DEBUG,
            },
        });
        this.lastUnlock = Date.now();
        this.id = uuid_1.v1();
        this.worker.on("message", (value) => this.processMessage(value));
        this.sendCommand("getExposed", {})
            .then((data) => {
            this.interface = data;
            this.emit("interfaceReady");
        })
            .catch((e) => {
            throw e;
        });
    }
    awaitOnline() {
        return new Promise((resolve) => {
            if (this.online)
                return resolve();
            log("Worker offline!");
            this.worker.once("online", () => {
                log("Worker online!");
                this.online = true;
                resolve();
            });
        });
    }
    sendCommand(command, args, opts) {
        return new Promise((resolve, reject) => {
            const id = uuid_1.v1();
            log("queueing command", command, ":", id);
            this.commandQueue.push({ command, id });
            // Sadly unavoidable use of callbacks...
            this.awaitOnline().then(() => {
                log("sending command", command, ":", id);
                this.worker.postMessage({
                    command,
                    id,
                    arguments: args,
                });
                log("sent command", command, ":", id);
                const resolveHandler = (err, msg) => {
                    this.worker.off("error", errorHandler);
                    if (err)
                        reject(err);
                    else
                        resolve(msg);
                };
                const errorHandler = (e) => {
                    console.log("worker threw", e);
                    reject(e);
                    this.off(id + "Resolved", resolveHandler);
                };
                if (opts === null || opts === void 0 ? void 0 : opts.noAwait)
                    return resolve(undefined);
                this.worker.once("error", errorHandler);
                this.once(id + "Resolved", resolveHandler);
            });
        });
    }
    processMessage(msg) {
        log("received", msg);
        let idx = 0;
        const command = this.commandQueue.find((c, i) => {
            if (c.id === msg.id) {
                idx = i;
                return true;
            }
            else
                return false;
        });
        log("task queue", this.commandQueue);
        if (!command)
            return; // Ignore if the message cannot be matched to a command
        this.commandQueue.splice(idx, 1);
        this.emit(command.id + "Resolved", msg.err, msg.res);
    }
    computeInterface() {
        return this.interface
            .map((k) => [
            k,
            (...args) => {
                return new Promise((resolve, reject) => {
                    this.sendCommand("runMethod", { name: k, params: args })
                        .then((data) => {
                        resolve(data);
                        this.unlock(this.lock_);
                    })
                        .catch((e) => {
                        reject(e);
                        this.unlock(this.lock_);
                    });
                });
            },
        ])
            .reduce((a, v) => {
            a[v[0]] = v[1];
            return a;
        }, {});
    }
    getInterface() {
        return new Promise((resolve, reject) => {
            if (this.interface)
                return resolve(this.computeInterface());
            this.once("interfaceReady", () => {
                resolve(this.computeInterface());
            });
        });
    }
    isIdle() {
        return !this.lock_;
    }
    lock() {
        return new Promise((resolve) => {
            this.emit("lock");
            let lock = uuid_1.v1();
            this.lock_ = lock;
            setTimeout(() => {
                if (this.lock_ === lock)
                    return resolve(lock);
                resolve("");
            }, 20);
        });
    }
    unlock(l) {
        if (this.lock_ === l) {
            this.lock_ = "";
            this.lastUnlock = Date.now();
            this.emit("unlock", this);
        }
    }
    isOverDue() {
        return this.idleTime && this.isIdle()
            ? this.lastUnlock + this.idleTime < Date.now()
            : false;
    }
    async end() {
        await this.sendCommand("end", {}, { noAwait: true });
    }
}
exports.WorkerInterface = WorkerInterface;
