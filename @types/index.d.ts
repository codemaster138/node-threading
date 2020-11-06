declare module 'subservient';

export namespace subservient {
    interface FarmOptions {
        maxSize?: number;
        idleTime?: number;
    }

    interface StrictFarmOptions {
        maxSize: number;
        idleTime: number;
    }

    class WorkerFarm {
        constructor(file: string, options: StrictFarmOptions)

        async spawn(): any
        async end(): void
    }

    class WorkerPool extends WorkerFarm {
        constructor(file: string, size: number)
    }
}

export function createFarm(file: string, options?: subservient.FarmOptions): subservient.WorkerFarm;
export function createPool(file: string, size: number): subservient.WorkerPool;