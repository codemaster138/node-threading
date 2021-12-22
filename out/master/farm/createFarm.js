"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const farm_1 = __importDefault(require("./farm"));
function createFarm(file, options) {
    const defaults = {
        maxSize: 3,
        idleTime: 5000,
    };
    return new farm_1.default(file, { ...defaults, ...(options || {}) });
}
exports.default = createFarm;
