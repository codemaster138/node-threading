import EventEmitter from "events";
import { WorkerInterface } from "../shared/worker";
const log = require("debug")("subservient:pool");

export default class WorkerPool extends EventEmitter {
  constructor(file: string, size: number) {
		super();
    this.file = file;
    this.size = size;

    this.workers = [];
    for (let i = 0; i < size; i++) {
			const worker = new WorkerInterface(file);
			worker.on("unlock", () => this.emit("unlock", worker));
      this.workers.push(worker);
    }
  }

  private awaitIdleWorker(): Promise<WorkerInterface> {
		return new Promise<WorkerInterface>((resolve) => {
			this.once("unlock", (worker: WorkerInterface) => resolve(worker));
		});
  }

  private async _spawn() {
    let worker = this.workers.find((w) => w.isIdle());
    if (!worker) {
      worker = await this.awaitIdleWorker();
    }
    return worker;
  }

  async spawn(): Promise<any> {
    let worker = await this._spawn();
    while ((await worker.lock()) === "") worker = await this._spawn();
    log("Locked worker", worker.id);
    return await worker.getInterface();
  }

  async endAll() {
    for (let w of this.workers) {
			w.removeAllListeners();
      await w.end();
    }
    this.workers = [];
  }

  async end() {
    await this.endAll();
  }

  private workers: WorkerInterface[] = [];
  file: string;
  size: number;
}
