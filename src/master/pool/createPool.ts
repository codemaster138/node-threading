import WorkerPool from './pool';


export default function createPool(file: string, size: number) {
    return new WorkerPool(file, size);
}