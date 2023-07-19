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
    // Cmd: ['python', '-c', ''], // Placeholder command to be replaced later
    OpenStdin: true, // Keep STDIN open even if not attached
};
// Function to run Python code in the container
function runPythonCode({ containerId, pythonCode, onContainerData }) {
    return __awaiter(this, void 0, void 0, function* () {
        const container = docker.getContainer(containerId);
        const savedStream = (0, __1.getContainerStream)(containerId);
        if (savedStream) {
            console.log("found saved stream");
            savedStream.write(`${pythonCode}\n`);
            return;
        }
        console.log("creating new excutable stream");
        const stream = yield createExcutableStream(container, `${pythonCode}`);
        (0, __1.setContainerStream)(containerId, stream);
        // Handle output from the container
        stream.on('data', e => {
            // if(e.toString().includes("===CODE_FINISHED===")) {
            //     console.log("code finished")
            //     stream.end();
            //     removerContainerStream(containerId);
            //     return;
            // }
            onContainerData(e.toString());
        });
        // Wait for the execution to finish
        yield new Promise((resolve) => stream.on('end', () => {
            console.log('Execution finished.');
            resolve(null);
        }));
        yield container.stop();
        // Remove the container
        yield container.remove();
    });
}
exports.runPythonCode = runPythonCode;
function createExcutableStream(container, pythonCode) {
    return __awaiter(this, void 0, void 0, function* () {
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
        let stream = undefined;
        container.attach({ stream: true, stdin: true, stdout: true, stderr: true }, (err, attachedStream) => {
            {
                stream = attachedStream;
                if (err)
                    return console.error(err);
            }
        });
        // Start the container
        yield container.start();
        return { container, stream };
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
