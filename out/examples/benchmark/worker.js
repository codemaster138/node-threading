"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const __1 = require("../..");
__1.expose({
    async hardTask(workerCount, offset, values) {
        var res = [];
        for (let i = offset; i < values.length; i += workerCount) {
            let x = 1;
            for (let j = 0; j < 100; j++) {
                x += values[i];
            }
            res.push(x);
        }
        return res;
    },
});
