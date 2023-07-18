import Docker, { ContainerCreateOptions } from 'dockerode';

const docker = new Docker();

const createOptions = {
    Image: 'python:latest', // Specify the base image for the container
    Cmd: ['python', '-c'], // Placeholder command to be replaced later
};

// Function to run Python code in the container
export async function runPythonCode(containerId: string, pythonCode: string) {
    const container = docker.getContainer(containerId);

    console.log('container from the Docker file => ', container);

    const exec = await container.exec({
        Cmd: ['python', '-c', pythonCode],
        AttachStdout: true,
        AttachStderr: true,
    });

    const stream = await exec.start({});

    // Handle output from the container
    stream.on('data', (chunk) => {
        console.log(chunk.toString());
    });

    // Wait for the execution to finish
    await new Promise((resolve) => stream.on('end', resolve));

    // Remove the container
    await container.remove();
}

// Function to create and run the Docker container
export async function createAndRunContainer(code: string) {
    // Create the container
    const container = await docker.createContainer({
        ...createOptions,
        Cmd: [...createOptions.Cmd, code],
    });

    // Start the container
    await container.start();

    return container;
}

// // Usage
// const pythonCode = `
//   print('Hello, Python!')
//   `;

// createAndRunContainer()
//     .then(() => console.log('Container execution complete.'))
//     .catch((err) => console.error('Error:', err));
