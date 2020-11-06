import { workerData, parentPort } from 'worker_threads';

interface Command {
	command: string;
	id: string;
	arguments: any;
}

let endpoint: { [key: string]: (...args: any[]) => any } = {};

const commands: { [key: string]: (args: any) => any } = {
	getExposed: () => {
		return Object.keys(endpoint);
	},
	runMethod: (args) => {
		return endpoint[args.name](...args.params);
	},
	end: () => {
        parentPort?.off('message', handleMessage);
        parentPort?.close();
        process.exit(0);
    },
};

async function handleCommand(cmd: Command) {
	return await commands[cmd.command]?.(cmd.arguments);
}

async function handleMessage(value: any) {
	try {
		let res = await handleCommand(value);

		parentPort?.postMessage({
			res,
			id: value.id,
		});
	} catch (err) {
		parentPort?.postMessage({
			err,
			id: value.id,
		});
	}
}

export function expose(endpoint_: any) {
	endpoint = endpoint_;

	parentPort?.on('message', handleMessage);
}
