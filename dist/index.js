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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.removerContainerStream = exports.setContainerStream = exports.getContainerStream = void 0;
const express_1 = __importDefault(require("express"));
const ws_1 = __importDefault(require("ws"));
const Docker_1 = require("./utils/Docker");
const app = (0, express_1.default)();
app.use(express_1.default.static('public'));
const wss = new ws_1.default.Server({
    port: 3001,
});
const containerStreams = {};
const getContainerStream = (containerId) => containerStreams[containerId];
exports.getContainerStream = getContainerStream;
const setContainerStream = (containerId, stream) => containerStreams[containerId] = stream;
exports.setContainerStream = setContainerStream;
const removerContainerStream = (containerId) => delete containerStreams[containerId];
exports.removerContainerStream = removerContainerStream;
// this callback function is called on every new socket connection
wss.on('connection', (socket) => {
    console.log('Started a new Connection');
    socket.on('message', (msgBuffer) => __awaiter(void 0, void 0, void 0, function* () {
        // if id exists on message | then the container is already running and the user is sending input from terminal
        // use it in running code,
        // else create a new container and use its id
        const message = JSON.parse(msgBuffer.toString());
        console.log(message);
        if (!message.code)
            return;
        if (message.id) {
            (0, Docker_1.runPythonCode)({
                containerId: message.id,
                pythonCode: message.code,
                onContainerData: (data) => {
                    socket.send(JSON.stringify({ type: 'console', data }));
                }
            });
            return;
        }
        // socket.send(); start
        const { container, stream } = yield (0, Docker_1.createAndRunContainer)();
        socket.send(JSON.stringify({ type: 'id', data: container.id }));
        // Run the Python code in the container
        yield (0, Docker_1.runPythonCode)({
            containerId: container.id,
            pythonCode: message.code,
            onContainerData: (data) => {
                socket.send(JSON.stringify({ type: 'console', data }));
            }
        });
        // socket.send(); end
    }));
});
app.listen(3000, () => {
    console.log('listening on port 3000');
});
