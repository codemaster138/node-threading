"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var __1 = require("../..");
__1.expose({
    hardTask: function () {
        return new Promise(function (resolve) {
            setTimeout(function () { return resolve('Done!'); }, 3000);
        });
    }
});
