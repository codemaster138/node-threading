import { expose } from '../../worker';

expose({
    hardTask() {
        return new Promise((resolve) => {
            setTimeout(() => resolve('Done!'), 3000);
        });
    }
});