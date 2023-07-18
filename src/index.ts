import { randomUUID } from 'crypto';
import express from 'express';
import WebSocket from 'ws';
import { createAndRunContainer, runPythonCode } from './utils/Docker';

const app = express();

app.use(express.static('public'));

const wss = new WebSocket.Server({
    port: 3001,
});

// this callback function is called on every new socket connection
wss.on('connection', (socket) => {
    console.log('Started a new Connection');

    socket.on('message', async (msgBuffer) => {
        // if id exists on message | then the container is already running and the user is sending input from terminal
        // use it in running code,
        // else create a new container and use its id
        const message = JSON.parse(msgBuffer.toString());

        if (!message.code) return;

        const container = await createAndRunContainer(message.code);

        // Run the Python code in the container
        // await runPythonCode(container.id, message.code);

        // await container.exec({
        //     Cmd: ['python', '-c', message.code],
        //     AttachStdout: true,
        //     AttachStderr: true,
        // })

        console.log({ message: msgBuffer });
    });
});

app.listen(3000, () => {
    console.log('listening on port 3000');
});
