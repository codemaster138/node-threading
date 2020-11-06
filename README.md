<h1 align="center">Subservient</h1>
<p align="center">
    <a href="https://npmjs.com/package/subservient">
        <img src="https://img.shields.io/npm/v/subservient" />
    </a>
    <a href="https://npmjs.com/package/subservient">
        <img src="https://img.shields.io/npm/dm/subservient" />
    </a>
    <a href="https://npmjs.com/package/subservient">
        <img src="https://img.shields.io/npm/l/subservient" />
    </a>
</p>

<p align="center">
    <b align="center">Multithreading can be easy</b>
</p>

## » Getting Started
- [Install](#»-install)
- [Basic Example](#»-basic-example)
- [Farms](#»-farms)
- [Farms vs. Pools](#»-worker-farms-vs-pools)

## » Install
Install with npm:
```
npm install subservient
```

Install with yarn
```
yarn add subservient
```

## » Basic Example
index.js:
```js
import { createFarm } from 'subservient';

// Create a worker farm
const farm = createFarm('worker.js', {
	maxSize: 1, // Maximum amount of workers
});

(async () => {
    const res = await (await farm.spawn()).hardTask();
    console.log(`Thread returned: ${res}`);
    await farm.end();
})();

```

worker.js
```js
import { expose } from 'subservient/worker';

expose({
    hardTask() {
        return new Promise((resolve) => {
            setTimeout(() => resolve('Done!'), 3000);
        });
    }
});
```

Output:
```plaintext
Worker returned: Done!
```

## » Farms
When a task is called, a Farm looks for an idle worker. If none is found, it creates a new one. After the task is done, it will idle for some time and terminate if no new tasks is received within that time.

### `createFarm(file: PathLike, options: FarmOptions): WorkerFarm`
Create a new worker farm.

Arguments:
- `file` Path to the worker module
- `options` Self-explanatory
    - `maxSize` Max amount of workers in a farm *(default: 3)*
    - `idleTime` Amount of milliseconds that a worker can idle before terminating *(default: 5000)*

### `WorkerFarm.spawn(): Promise<Worker>`
Find an idle worker. If none exists, create one.

### Running a task
A worker has every method exposed by its corresponding worker module. In the example, `expose` call in `worker.js` exposes a function called `hardTask`. Calling that function on the worker returns a `Promise` which resolves when the corresponding worker function returns. If the worker function returns a `Promise`, that promise is awaited before resolving.

## » Worker Farms vs. Pools
Subservient provides two different types of worker groups: **Farms** and **Pools**. A Pool always has a fixed amount of workers, ready to take tasks. A Farm creates new workers as they are needed and destroys them after a fixed amount of idle time.

Starting a task in a Farm takes longer because the worker must first be created, but is also more efficient than a pool because there aren't any unused workers lingering around, occupying resources.

So, use what suits you best. For Example, a server that needs to serve quickly to many users should use a pool because of its smaller delay when starting tasks. On the contrary, a very resource-heavy program should use a farm to save resources when idle.