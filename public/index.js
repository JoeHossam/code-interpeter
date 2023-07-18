const SOCKET_URL = `ws://localhost:3001`;

const runButton = document.getElementById('run-button');
const codeInput = document.getElementById('code-input');
const outputPanel = document.getElementById('output-panel');

let isCodeRunning = false;

const addToConsole = (text) => {
    outputPanel.textContent += text;
};
const clearConsole = () => {
    outputPanel.textContent = '';
};

const handleSocketMessage = (message) => {
    addToConsole(message);
};

const startSocketConnection = (url) => {
    const socket = new WebSocket(url);

    const sendCodeToServer = (code, id) => {
        const message = { code, id };
        socket.send(JSON.stringify(message));
    };

    socket.addEventListener('open', () => {
        // start runnin the app
        runButton.addEventListener('click', () => {
            sendCodeToServer(codeInput.value);
        });
    });

    socket.addEventListener('message', (e) => handleSocketMessage(e.data));
};

startSocketConnection(SOCKET_URL);
