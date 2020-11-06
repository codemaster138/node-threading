"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
exports.WorkerInterface = void 0;
var events_1 = require("events");
var worker_threads_1 = require("worker_threads");
var uuid_1 = require("uuid");
var log = require('debug')('subservient:workerMaster');
var WorkerInterface = /** @class */ (function (_super) {
    __extends(WorkerInterface, _super);
    function WorkerInterface(file, idleTime) {
        var _this = _super.call(this) || this;
        _this.lock_ = '';
        _this.idleTime = 0;
        _this.interface = undefined;
        _this.commandQueue = [];
        _this.idleTime = idleTime || 0;
        _this.worker = new worker_threads_1.Worker(file, {
            workerData: {
                idleTime: _this.idleTime,
            },
        });
        _this.lastUnlock = Date.now();
        _this.id = uuid_1.v1();
        _this.worker.on('message', function (value) { return _this.processMessage(value); });
        _this.sendCommand('getExposed', {})
            .then(function (data) {
            _this.interface = data;
            _this.emit('interfaceReady');
        })
            .catch(function (e) {
            throw e;
        });
        return _this;
    }
    WorkerInterface.prototype.sendCommand = function (command, args, opts) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var id = uuid_1.v1();
            log('sending command', command, ':', id);
            _this.commandQueue.push({ command: command, id: id });
            _this.worker.postMessage({
                command: command,
                id: id,
                arguments: args,
            });
            _this.worker.once('error', function (e) {
                console.log('worker threw', e);
            });
            if (opts === null || opts === void 0 ? void 0 : opts.noAwait)
                return resolve();
            _this.once(id + 'Resolved', function (err, msg) {
                if (err)
                    reject(err);
                else
                    resolve(msg);
            });
        });
    };
    WorkerInterface.prototype.processMessage = function (msg) {
        log('received', msg);
        var idx = 0;
        var command = this.commandQueue.find(function (c, i) {
            if (c.id === msg.id) {
                idx = i;
                return true;
            }
            else
                return false;
        });
        log('task queue', this.commandQueue);
        if (!command)
            return; // Ignore if the message cannot be matched to a command
        this.commandQueue.splice(idx, 1);
        this.emit(command.id + 'Resolved', msg.err, msg.res);
    };
    WorkerInterface.prototype.computeInterface = function () {
        var _this = this;
        return this.interface
            .map(function (k) { return [
            k,
            function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                return new Promise(function (resolve, reject) {
                    _this.sendCommand('runMethod', { name: k, params: args })
                        .then(function (data) {
                        resolve(data);
                        _this.unlock(_this.lock_);
                    })
                        .catch(function (e) {
                        reject(e);
                        _this.unlock(_this.lock_);
                    });
                });
            },
        ]; })
            .reduce(function (a, v) {
            a[v[0]] = v[1];
            return a;
        }, {});
    };
    WorkerInterface.prototype.getInterface = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            if (_this.interface)
                return resolve(_this.computeInterface());
            _this.once('interfaceReady', function () {
                resolve(_this.computeInterface());
            });
        });
    };
    WorkerInterface.prototype.isIdle = function () {
        return !this.lock_;
    };
    WorkerInterface.prototype.lock = function () {
        var _this = this;
        return new Promise(function (resolve) {
            _this.emit('lock');
            var lock = uuid_1.v1();
            _this.lock_ = lock;
            setTimeout(function () {
                if (_this.lock_ === lock)
                    return resolve(lock);
                resolve('');
            }, 20);
        });
    };
    WorkerInterface.prototype.unlock = function (l) {
        if (this.lock_ === l) {
            this.lock_ = '';
            this.lastUnlock = Date.now();
            this.emit('unlock', this);
        }
    };
    WorkerInterface.prototype.isOverDue = function () {
        return this.idleTime && this.isIdle() ? this.lastUnlock + this.idleTime > Date.now() : false;
    };
    WorkerInterface.prototype.end = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.sendCommand('end', {}, { noAwait: true })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    return WorkerInterface;
}(events_1.EventEmitter));
exports.WorkerInterface = WorkerInterface;
