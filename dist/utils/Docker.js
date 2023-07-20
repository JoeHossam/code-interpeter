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
exports.createAndRunContainer = exports.runPythonCode = void 0;
const dockerode_1 = __importDefault(require("dockerode"));
const __1 = require("..");
const docker = new dockerode_1.default();
const createOptions = {
    Image: 'python:latest',
    OpenStdin: true, // Keep STDIN open even if not attached
};
// Function to run Python code in the container
function runPythonCode({ containerId, pythonCode, onContainerData, }) {
    return __awaiter(this, void 0, void 0, function* () {
        const container = docker.getContainer(containerId);
        const savedStream = (0, __1.getContainerStream)(containerId);
        if (savedStream) {
            console.log('found saved stream');
            savedStream.write(`${pythonCode}\n`);
            return;
        }
        const stream = yield createAndStartExcutable(container, pythonCode);
        (0, __1.saveContainerStream)(containerId, stream);
        // Handle output from the container
        stream.on('data', (e) => {
            onContainerData(e.toString());
        });
        // Wait for the execution to finish
        yield new Promise((resolve) => stream.on('end', () => {
            console.log('Execution finished.');
            resolve(null);
        }));
    });
}
exports.runPythonCode = runPythonCode;
// This function craeate an excutable, starts it
// return a stream to communicate with the process
function createAndStartExcutable(container, pythonCode) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('creating new excutable stream');
        const exec = yield container.exec({
            Cmd: ['python', '-c', pythonCode],
            AttachStdout: true,
            AttachStdin: true,
            AttachStderr: true,
        });
        const stream = yield exec.start({ stdin: true, hijack: true, Tty: true });
        return stream;
    });
}
// Function to create and run the Docker container
function createAndRunContainer() {
    return __awaiter(this, void 0, void 0, function* () {
        // Create the container
        const container = yield docker.createContainer(createOptions);
        // Start the container
        yield container.start();
        return container;
    });
}
exports.createAndRunContainer = createAndRunContainer;
