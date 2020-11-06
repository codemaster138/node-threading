"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var farm_1 = __importDefault(require("./farm"));
function createFarm(file, options) {
    var defaults = {
        maxSize: 3,
        idleTime: 5000
    };
    return new farm_1.default(file, __assign(__assign({}, defaults), (options || {})));
}
exports.default = createFarm;
