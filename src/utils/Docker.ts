import Docker from 'dockerode';
import {
    getContainerStream,
    removeContainerStream,
    saveContainerStream,
} from '..';

const docker = new Docker();

const createOptions = {
    Image: 'python:latest', // Specify the base image for the container
    OpenStdin: true, // Keep STDIN open even if not attached
};

// Function to run Python code in the container
export async function runPythonCode({
    containerId,
    pythonCode,
    onContainerData,
}: {
    containerId: string;
    pythonCode: string;
    onContainerData: (data: string) => void;
}) {
    const container = docker.getContainer(containerId);
    const savedStream = getContainerStream(containerId);

    if (savedStream) {
        console.log('found saved stream');
        savedStream.write(`${pythonCode}\n`);
        return;
    }

    const stream = await createAndStartExcutable(container, pythonCode);
    saveContainerStream(containerId, stream);

    // Handle output from the container
    stream.on('data', (e) => {
        onContainerData(e.toString());
    });

    // Wait for the execution to finish
    await new Promise((resolve) =>
        stream.on('end', () => {
            console.log('Execution finished.');
            resolve(null);
        })
    );
}

// This function craeate an excutable, starts it
// return a stream to communicate with the process
async function createAndStartExcutable(
    container: Docker.Container,
    pythonCode: string
) {
    console.log('creating new excutable stream');

    const exec = await container.exec({
        Cmd: ['python', '-c', pythonCode],
        AttachStdout: true,
        AttachStdin: true,
        AttachStderr: true,
        Tty: true,
    });

    const stream = await exec.start({ stdin: true, hijack: true, Tty: true });

    return stream;
}

// Function to create and run the Docker container
export async function createAndRunContainer() {
    // Create the container
    const container = await docker.createContainer(createOptions);

    // Start the container
    await container.start();

    return container;
}
