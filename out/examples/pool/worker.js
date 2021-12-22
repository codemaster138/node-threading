"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const __1 = require("../..");
__1.expose({
    hardTask() {
        return new Promise((resolve) => {
            setTimeout(() => resolve('Done!'), 3000);
        });
    }
});
