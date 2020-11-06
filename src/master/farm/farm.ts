import { WorkerInterface } from '../shared/worker';
const log = require('debug')('subservient:farm');

interface StrictFarmOptions {
	maxSize: number;
	idleTime: number;
}

export default class WorkerFarm {
	constructor(file: string, options: StrictFarmOptions) {
		this.file = file;
		this.options = options;

		this.interval = setInterval(() => {
			this.workers.forEach((w, i) => {
				if (w.isOverDue()) {
					log('killing worker', w.id);
					w.end().then(() => {
						this.workers.splice(i, 1);
					});
				}
			});
		}, 100);
	}

	private awaitFreeWorker(): Promise<WorkerInterface> {
		return new Promise((resolve) => {
			const h = (w: WorkerInterface) => {
				resolve(w);
			};
			this.workers.forEach((w) => w.once('unlock', h));
		});
	}

	private async _spawn() {
		let worker = this.workers.find((w) => w.isIdle());
		if (!worker) {
			if (this.workers.length < this.options.maxSize) {
				worker = new WorkerInterface(this.file, this.options.idleTime);
				this.workers.push(worker);
			} else {
				worker = await this.awaitFreeWorker();
			}
		}
		return worker;
	}

	async spawn(): Promise<any> {
		let worker = await this._spawn();
		while ((await worker.lock()) === '') worker = await this._spawn();
		log('Locked worker', worker.id);
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
			w.removeAllListeners('unlock');
		});
		await this.endAll();
		clearInterval(this.interval);
	}

	private workers: WorkerInterface[] = [];
	file: string;
	interval: NodeJS.Timeout;
	options: StrictFarmOptions;
}
