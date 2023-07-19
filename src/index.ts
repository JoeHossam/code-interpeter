import { randomUUID } from 'crypto';
import express from 'express';
import WebSocket from 'ws';
import { createAndRunContainer, runPythonCode } from './utils/Docker';
import internal from 'stream';

const app = express();

app.use(express.static('public'));

const wss = new WebSocket.Server({
    port: 3001,
});

const containerStreams: {[key in string]: internal.Duplex} = {}
export const getContainerStream = (containerId: string) => containerStreams[containerId];
export const setContainerStream = (containerId: string, stream: internal.Duplex) => containerStreams[containerId] = stream;
export const removerContainerStream = (containerId: string) => delete containerStreams[containerId];

// this callback function is called on every new socket connection
wss.on('connection', (socket) => {
    console.log('Started a new Connection');

    socket.on('message', async (msgBuffer) => {
        // if id exists on message | then the container is already running and the user is sending input from terminal
        // use it in running code,
        // else create a new container and use its id
        const message = JSON.parse(msgBuffer.toString());
        console.log(message);

        if (!message.code) return;

        if(message.id) {
            runPythonCode({
                containerId: message.id,
                pythonCode: message.code,
                onContainerData: (data) => {
                    socket.send(JSON.stringify({type: 'console', data}));
                }
            });
            return;
        }

        // socket.send(); start
        const {container, stream} = await createAndRunContainer();

        socket.send(JSON.stringify({type: 'id', data: container.id}));

        // Run the Python code in the container
        await runPythonCode({
            containerId: container.id,
            pythonCode: message.code,
            onContainerData: (data) => {
                socket.send(JSON.stringify({type: 'console', data}));
            }
        });

        // socket.send(); end
    });
});

app.listen(3000, () => {
    console.log('listening on port 3000');
});
