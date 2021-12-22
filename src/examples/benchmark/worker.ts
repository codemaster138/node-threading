import { expose } from "../..";

expose({
  async hardTask(workerCount: number, offset: number, values: number[]) {
		var res = [];
		for (let i = offset; i < values.length; i += workerCount) {
			let x = 1;
			for (let j = 0; j < 100; j++) { x += values[i] }
			res.push(x);
		}
		return res;
  },
});
