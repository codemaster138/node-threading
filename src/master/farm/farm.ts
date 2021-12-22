import EventEmitter from "events";
import { WorkerInterface } from "../shared/worker";
const log = require("debug")("subservient:farm");

interface StrictFarmOptions {
  maxSize: number;
  idleTime: number;
}

export default class Farm extends EventEmitter {
  constructor(file: string, options: StrictFarmOptions) {
    super();
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
    return new Promise<WorkerInterface>((resolve) => {
      this.once("unlock", (worker: WorkerInterface) => resolve(worker));
    });
  }

  async _spawn(): Promise<WorkerInterface> {
    const worker = this.workers.find((v) => v.isIdle());
    if (worker) return worker;
    if (this.workers.length < this.options.maxSize) {
      const worker = new WorkerInterface(this.file, this.options.idleTime);
      worker.on("unlock", () => {
        this.emit("unlock", worker);
      });
      this.workers.push(worker);
      return worker;
    }
    return await this.awaitIdleWorker();
  }

  async spawn(): Promise<any> {
    let worker = await this._spawn();
    while ((await worker.lock()) === "") worker = await this._spawn();
    return await worker.getInterface();
  }

  async endAll() {
    await Promise.all(
      this.workers.map((w) => {
        w.removeAllListeners();
        return w.end();
      })
    );
  }

  async end() {
    await this.endAll();
    clearInterval(this.interval);
  }

  file: string;
  options: StrictFarmOptions;
  interval: NodeJS.Timer;
  workers: WorkerInterface[] = [];
}
