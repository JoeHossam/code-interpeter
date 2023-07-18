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
const docker = new dockerode_1.default();
const createOptions = {
    Image: 'python:latest',
    Cmd: ['python', '-c'], // Placeholder command to be replaced later
};
// Function to run Python code in the container
function runPythonCode(containerId, pythonCode) {
    return __awaiter(this, void 0, void 0, function* () {
        const container = docker.getContainer(containerId);
        console.log('container from the Docker file => ', container);
        const exec = yield container.exec({
            Cmd: ['python', '-c', pythonCode],
            AttachStdout: true,
            AttachStderr: true,
        });
        const stream = yield exec.start({});
        // Handle output from the container
        stream.on('data', (chunk) => {
            console.log(chunk.toString());
        });
        // Wait for the execution to finish
        yield new Promise((resolve) => stream.on('end', resolve));
        // Remove the container
        yield container.remove();
    });
}
exports.runPythonCode = runPythonCode;
// Function to create and run the Docker container
function createAndRunContainer(code) {
    return __awaiter(this, void 0, void 0, function* () {
        // Create the container
        const container = yield docker.createContainer(Object.assign(Object.assign({}, createOptions), { Cmd: [...createOptions.Cmd, code] }));
        // Start the container
        yield container.start();
        return container;
    });
}
exports.createAndRunContainer = createAndRunContainer;
// // Usage
// const pythonCode = `
//   print('Hello, Python!')
//   `;
// createAndRunContainer()
//     .then(() => console.log('Container execution complete.'))
//     .catch((err) => console.error('Error:', err));
