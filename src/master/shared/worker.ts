import { EventEmitter } from "events";
import { Worker } from "worker_threads";
import { v1 as uuidv1 } from "uuid";
const log = require("debug")("subservient:workerMaster");

interface Command {
  command: string;
  id: string;
}

export class WorkerInterface extends EventEmitter {
  constructor(file: string, idleTime?: number) {
    super();
    this.idleTime = idleTime || 0;
    this.worker = new Worker(file, {
      workerData: {
        idleTime: this.idleTime,
      },
      env: {
        DEBUG: process.env.DEBUG,
      },
    });
    this.lastUnlock = Date.now();
    this.id = uuidv1();

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
    return new Promise<void>((resolve) => {
      if (this.online) return resolve();
			log("Worker offline!");
      this.worker.once("online", () => {
				log("Worker online!");
        this.online = true;
        resolve();
      });
    });
  }

  private sendCommand(command: string, args: any, opts?: { noAwait: boolean }) {
    return new Promise<any>((resolve, reject) => {
      const id = uuidv1();
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

        const resolveHandler = (err: any, msg: any) => {
          this.worker.off("error", errorHandler);
          if (err) reject(err);
          else resolve(msg);
        };

        const errorHandler = (e: Error) => {
          console.log("worker threw", e);
          reject(e);
          this.off(id + "Resolved", resolveHandler);
        };
        if (opts?.noAwait) return resolve(undefined);

        this.worker.once("error", errorHandler);

        this.once(id + "Resolved", resolveHandler);
      });
    });
  }

  private processMessage(msg: any) {
    log("received", msg);
    let idx = 0;
    const command = this.commandQueue.find((c, i) => {
      if (c.id === msg.id) {
        idx = i;
        return true;
      } else return false;
    });
    log("task queue", this.commandQueue);
    if (!command) return; // Ignore if the message cannot be matched to a command

    this.commandQueue.splice(idx, 1);
    this.emit(command.id + "Resolved", msg.err, msg.res);
  }

  private computeInterface() {
    return this.interface
      .map((k: string) => [
        k,
        (...args: any[]) => {
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
      .reduce((a: any, v: any) => {
        a[v[0]] = v[1];
        return a;
      }, {});
  }

  getInterface(): Promise<any> {
    return new Promise((resolve, reject) => {
      if (this.interface) return resolve(this.computeInterface());
      this.once("interfaceReady", () => {
        resolve(this.computeInterface());
      });
    });
  }

  isIdle() {
    return !this.lock_;
  }

  lock() {
    return new Promise<string>((resolve) => {
      this.emit("lock");
      let lock = uuidv1();
      this.lock_ = lock;

      setTimeout(() => {
        if (this.lock_ === lock) return resolve(lock);
        resolve("");
      }, 20);
    });
  }

  unlock(l: string) {
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

  end() {
		return new Promise<void>((resolve, reject) => {
			this.sendCommand("end", {}).then(() => {this.online = false; resolve()}).catch(reject);
			setTimeout(() => {
				if (this.online) {
					this.online = false;
					this.worker.terminate();
				}
			}, 3000);
		});
  }

  private lock_: string = "";
  private lastUnlock: number;
  private idleTime: number = 0;
  private worker: Worker;
  private interface: any = undefined;
  private commandQueue: Command[] = [];
  private online: boolean = false;
  id: string;
}
