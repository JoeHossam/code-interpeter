import express from 'express';
import WebSocket from 'ws';
import { createAndRunContainer, runPythonCode } from './utils/Docker';
import internal from 'stream';

const app = express();

app.use(express.static('public'));

const wss = new WebSocket.Server({
    port: 3001,
});

const containerStreams: { [key in string]: internal.Duplex } = {};
export const getContainerStream = (containerId: string) =>
    containerStreams[containerId];
export const saveContainerStream = (
    containerId: string,
    stream: internal.Duplex
) => (containerStreams[containerId] = stream);
export const removeContainerStream = (containerId: string) =>
    delete containerStreams[containerId];

// this callback function is called on every new socket connection
wss.on('connection', (socket) => {
    console.log('Started a new Connection');

    socket.on('message', async (msgBuffer) => {
        const message = JSON.parse(msgBuffer.toString());
        console.log(message);

        if (!message.code) return;

        if (message.id) {
            runPythonCode({
                containerId: message.id,
                pythonCode: message.code,
                onContainerData: (data) => {
                    socket.send(JSON.stringify({ type: 'console', data }));
                },
            });
            return;
        }

        // socket.send(); start
        socket.send(JSON.stringify({ type: 'status', data: 'start' }));

        const container = await createAndRunContainer();

        socket.send(JSON.stringify({ type: 'id', data: container.id }));

        // Run the Python code in the container
        await runPythonCode({
            containerId: container.id,
            pythonCode: message.code,
            onContainerData: (data) => {
                socket.send(JSON.stringify({ type: 'console', data }));
            },
        });

        // send end first then clean containers later
        socket.send(JSON.stringify({ type: 'status', data: 'end' }));

        console.log('closing container', container.id);
        await container.stop();
        await container.remove();
        removeContainerStream(container.id);
    });
});

app.listen(3000, () => {
    console.log('listening on port 3000');
});
