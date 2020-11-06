import { WorkerInterface } from '../shared/worker';
const log = require('debug')('subservient:pool');

export default class WorkerPool {
	constructor(file: string, size: number) {
		this.file = file;
		this.size = size;

		this.workers = [];
		for (let i = 0; i < size; i++) {
			this.workers.push(new WorkerInterface(file));
		}
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
			worker = await this.awaitFreeWorker();
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
	}

	private workers: WorkerInterface[] = [];
	file: string;
	size: number;
}
