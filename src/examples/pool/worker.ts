import { expose } from '../..';

expose({
    hardTask() {
        return new Promise((resolve) => {
            setTimeout(() => resolve('Done!'), 3000);
        });
    }
});