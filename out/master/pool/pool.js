"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const worker_1 = require("../shared/worker");
const log = require("debug")("subservient:pool");
class WorkerPool {
    constructor(file, size) {
        this.workers = [];
        this.file = file;
        this.size = size;
        this.workers = [];
        for (let i = 0; i < size; i++) {
            this.workers.push(new worker_1.WorkerInterface(file));
        }
    }
    awaitFreeWorker() {
        return new Promise((resolve) => {
            const h = (w) => {
                resolve(w);
            };
            this.workers.forEach((w) => w.once("unlock", h));
        });
    }
    async _spawn() {
        let worker = this.workers.find((w) => w.isIdle());
        if (!worker) {
            worker = await this.awaitFreeWorker();
        }
        return worker;
    }
    async spawn() {
        let worker = await this._spawn();
        while ((await worker.lock()) === "")
            worker = await this._spawn();
        log("Locked worker", worker.id);
        return await worker.getInterface();
    }
    async endAll() {
        for (let w of this.workers) {
            await w.end();
        }
        this.workers = [];
    }
    async end() {
        this.workers.forEach((w) => {
            w.removeAllListeners("unlock");
        });
        await this.endAll();
    }
}
exports.default = WorkerPool;
