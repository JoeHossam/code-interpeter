const SOCKET_URL = `ws://localhost:3001`;

const runButton = document.getElementById('run-button');
const runButtonTerminal = document.getElementById('run-button-terminal');
const codeInput = document.getElementById('code-input');
const outputPanel = document.getElementById('terminal');
const outputPanelInput = document.getElementById('terminal-input');

let isCodeRunning = false;

const addToConsole = (text) => {
    outputPanel.textContent += text;
};
const clearConsole = () => {
    outputPanel.textContent = '';
};

const startSocketConnection = (url) => {
    const socket = new WebSocket(url);

    let containerID = null;

    const sendCodeToServer = (code, id) => {
        const message = { code, id };
        socket.send(JSON.stringify(message));
    };

    const handleSocketMessage = (message) => {
        const messageObject = JSON.parse(message);
        console.log(messageObject);
        if(messageObject.type === 'id') {
            containerID = messageObject.data;
        } else {
            addToConsole(messageObject.data);
        }
    };

    socket.addEventListener('open', () => {
        // start runnin the app
        runButton.addEventListener('click', () => {
            sendCodeToServer(codeInput.value, containerID);
        });
        outputPanelInput.addEventListener('keydown', (e) => {
            if(e.key === 'Enter' && !e.metaKey) {
                sendCodeToServer(outputPanelInput.value, containerID);
                outputPanelInput.value = '';
            }
        });
    });

    socket.addEventListener('message', (e) => handleSocketMessage(e.data));
};

startSocketConnection(SOCKET_URL);
