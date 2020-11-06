"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var worker_1 = require("../shared/worker");
var log = require('debug')('subservient:farm');
var WorkerFarm = /** @class */ (function () {
    function WorkerFarm(file, options) {
        var _this = this;
        this.workers = [];
        this.file = file;
        this.options = options;
        this.interval = setInterval(function () {
            _this.workers.forEach(function (w, i) {
                if (w.isOverDue()) {
                    log('killing worker', w.id);
                    w.end().then(function () {
                        _this.workers.splice(i, 1);
                    });
                }
            });
        }, 100);
    }
    WorkerFarm.prototype.awaitFreeWorker = function () {
        var _this = this;
        return new Promise(function (resolve) {
            var h = function (w) {
                resolve(w);
            };
            _this.workers.forEach(function (w) { return w.once('unlock', h); });
        });
    };
    WorkerFarm.prototype._spawn = function () {
        return __awaiter(this, void 0, void 0, function () {
            var worker;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        worker = this.workers.find(function (w) { return w.isIdle(); });
                        if (!!worker) return [3 /*break*/, 3];
                        if (!(this.workers.length < this.options.maxSize)) return [3 /*break*/, 1];
                        worker = new worker_1.WorkerInterface(this.file, this.options.idleTime);
                        this.workers.push(worker);
                        return [3 /*break*/, 3];
                    case 1: return [4 /*yield*/, this.awaitFreeWorker()];
                    case 2:
                        worker = _a.sent();
                        _a.label = 3;
                    case 3: return [2 /*return*/, worker];
                }
            });
        });
    };
    WorkerFarm.prototype.spawn = function () {
        return __awaiter(this, void 0, void 0, function () {
            var worker;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this._spawn()];
                    case 1:
                        worker = _a.sent();
                        _a.label = 2;
                    case 2: return [4 /*yield*/, worker.lock()];
                    case 3:
                        if (!((_a.sent()) === '')) return [3 /*break*/, 5];
                        return [4 /*yield*/, this._spawn()];
                    case 4:
                        worker = _a.sent();
                        return [3 /*break*/, 2];
                    case 5:
                        log('Locked worker', worker.id);
                        return [4 /*yield*/, worker.getInterface()];
                    case 6: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    WorkerFarm.prototype.endAll = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _i, _a, w;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _i = 0, _a = this.workers;
                        _b.label = 1;
                    case 1:
                        if (!(_i < _a.length)) return [3 /*break*/, 4];
                        w = _a[_i];
                        return [4 /*yield*/, w.end()];
                    case 2:
                        _b.sent();
                        _b.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4:
                        this.workers = [];
                        return [2 /*return*/];
                }
            });
        });
    };
    WorkerFarm.prototype.end = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.workers.forEach(function (w) {
                            w.removeAllListeners('unlock');
                        });
                        return [4 /*yield*/, this.endAll()];
                    case 1:
                        _a.sent();
                        clearInterval(this.interval);
                        return [2 /*return*/];
                }
            });
        });
    };
    return WorkerFarm;
}());
exports.default = WorkerFarm;
