"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = __importDefault(require("events"));
const worker_1 = require("../shared/worker");
const log = require("debug")("subservient:farm");
class Farm extends events_1.default {
    constructor(file, options) {
        super();
        this.workers = [];
        this.file = file;
        this.options = options;
        this.interval = setInterval(() => {
            this.workers.forEach((w, i) => {
                if (w.isOverDue()) {
                    log("Killing worker", w.id);
                    w.end().then(() => {
                        delete this.workers[i]; // Hopefully helps the GC
                        this.workers.splice(i, 1);
                    });
                }
            });
        }, 200);
    }
    awaitIdleWorker() {
        return new Promise((resolve) => {
            this.once("unlock", (worker) => resolve(worker));
        });
    }
    async _spawn() {
        const worker = this.workers.find((v) => v.isIdle());
        if (worker)
            return worker;
        if (this.workers.length < this.options.maxSize) {
            const worker = new worker_1.WorkerInterface(this.file, this.options.idleTime);
            worker.on("unlock", () => {
                this.emit("unlock", worker);
            });
            this.workers.push(worker);
            return worker;
        }
        return await this.awaitIdleWorker();
    }
    async spawn() {
        let worker = await this._spawn();
        while ((await worker.lock()) === "")
            worker = await this._spawn();
        return await worker.getInterface();
    }
    async endAll() {
        this.workers.forEach((w) => {
            w.removeAllListeners();
            w.end();
        });
    }
    async end() {
        this.endAll();
        clearInterval(this.interval);
    }
}
exports.default = Farm;
