"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var worker_1 = require("../../worker");
worker_1.expose({
    hardTask: function () {
        return new Promise(function (resolve) {
            setTimeout(function () { return resolve('Done!'); }, 3000);
        });
    }
});
