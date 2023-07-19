import Docker, { ContainerCreateOptions } from 'dockerode';
import { getContainerStream, removerContainerStream, setContainerStream } from '..';

const docker = new Docker();

const createOptions = {
    Image: 'python:latest', // Specify the base image for the container
    // Cmd: ['python', '-c', ''], // Placeholder command to be replaced later
    OpenStdin: true, // Keep STDIN open even if not attached
};

// Function to run Python code in the container
export async function runPythonCode({containerId, pythonCode, onContainerData}:{containerId: string, pythonCode: string, onContainerData: (data: string) => void}) {
    const container = docker.getContainer(containerId);
    
    const savedStream = getContainerStream(containerId);
    if(savedStream) {
        console.log("found saved stream")
        savedStream.write(`${pythonCode}\n`);
        return
    }


    console.log("creating new excutable stream")
    const stream = await createExcutableStream(container, `${pythonCode}`);
    setContainerStream(containerId, stream);

    // Handle output from the container
    stream.on('data', e => {
        // if(e.toString().includes("===CODE_FINISHED===")) {
        //     console.log("code finished")
        //     stream.end();
        //     removerContainerStream(containerId);
        //     return;
        // }
        onContainerData(e.toString())
    });


    // Wait for the execution to finish
    await new Promise((resolve) => stream.on('end', () => {
        console.log('Execution finished.');
        resolve(null);
    }));

    await container.stop();
    
    // Remove the container
    await container.remove();
}

async function createExcutableStream(container: Docker.Container, pythonCode: string) {
    const exec = await container.exec({
        Cmd: ['python', '-c', pythonCode],
        AttachStdout: true,
        AttachStdin: true,
        AttachStderr: true,
    });

    const stream = await exec.start({ stdin: true, hijack: true, Tty: true });
    return stream;
}

// Function to create and run the Docker container
export async function createAndRunContainer() {
    // Create the container
    const container = await docker.createContainer(createOptions);

    let stream: NodeJS.ReadWriteStream | undefined = undefined;

    container.attach({ stream: true, stdin: true, stdout: true, stderr: true }, (err, attachedStream) => {{
        stream = attachedStream
        if (err) return console.error(err);
    }})

    // Start the container
    await container.start();

    return { container, stream };
}

// // Usage
// const pythonCode = `
//   print('Hello, Python!')
//   `;

// createAndRunContainer()
//     .then(() => console.log('Container execution complete.'))
//     .catch((err) => console.error('Error:', err));
