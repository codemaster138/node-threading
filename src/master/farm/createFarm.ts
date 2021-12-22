import WorkerFarm from "./farm";

export interface FarmOptions {
  maxSize?: number;
  idleTime?: number;
}

export default function createFarm(file: string, options?: FarmOptions) {
  const defaults = {
    maxSize: 3,
    idleTime: 5000,
  };
  return new WorkerFarm(file, { ...defaults, ...(options || {}) });
}
