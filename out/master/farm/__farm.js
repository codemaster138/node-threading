"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const worker_1 = require("../shared/worker");
const log = require("debug")("subservient:farm");
class WorkerFarm {
    constructor(file, options) {
        this.workers = [];
        this.file = file;
        this.options = options;
        this.interval = setInterval(() => {
            this.workers.forEach((w, i) => {
                if (w.isOverDue()) {
                    log("killing worker", w.id);
                    w.end().then(() => {
                        this.workers.splice(i, 1);
                    });
                }
            });
        }, 100);
    }
    awaitFreeWorker() {
        return new Promise((resolve) => {
            const h = (w) => {
                resolve(w);
                this.workers.forEach(worker => worker.removeListener("unlock", h));
            };
            this.workers.forEach((w) => w.once("unlock", h));
        });
    }
    async _spawn() {
        let worker = this.workers.find((w) => w.isIdle());
        if (!worker) {
            if (this.workers.length < this.options.maxSize) {
                worker = new worker_1.WorkerInterface(this.file, this.options.idleTime);
                this.workers.push(worker);
                // Wait for the worker to become ready
                await worker.getInterface();
            }
            else {
                worker = await this.awaitFreeWorker();
            }
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
        clearInterval(this.interval);
    }
}
exports.default = WorkerFarm;
