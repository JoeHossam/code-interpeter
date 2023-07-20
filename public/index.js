const SOCKET_URL = `ws://localhost:3001`;

const runButton = document.getElementById('run-button');
const clearButton = document.getElementById('clear-console-button');
const codeInput = document.getElementById('code-input');
const outputPanel = document.getElementById('output');
const outputPanelInput = document.getElementById('terminal-input-same-line');
// document.designMode = 'on';

let isCodeRunning = false;

const setIsCodeRunning = (val) => {
    if (val) {
        isCodeRunning = true;
        runButton.classList.add('disabled');
        clearButton.classList.add('disabled');
        return;
    }
    isCodeRunning = false;
    runButton.classList.remove('disabled');
    clearButton.classList.remove('disabled');
};

const addToConsole = (text) => {
    outputPanel.textContent += text;
    outputPanel.appendChild(outputPanelInput);
};
const clearConsole = () => {
    outputPanel.textContent = '';
    outputPanel.appendChild(outputPanelInput);
};

const startSocketConnection = (url) => {
    const socket = new WebSocket(url);

    let containerID = null;
    setIsCodeRunning(false);

    const sendCodeToServer = (code, id) => {
        const message = { code, id };
        socket.send(JSON.stringify(message));
    };

    const handleSocketMessage = (message) => {
        const { type, data } = JSON.parse(message);

        console.log({ type, data });

        if (type === 'id') {
            containerID = data;
        } else if (type === 'console') {
            addToConsole(data);
        } else if (type === 'status') {
            if (data === 'end') {
                setIsCodeRunning(false);
                containerID = null;
            } else {
                setIsCodeRunning(true);
            }
        }
        // TODO: handle when code excution is done (set is code running false)
    };

    socket.addEventListener('open', () => {
        // start runnin the app
        runButton.addEventListener('click', () => {
            if (isCodeRunning) return;
            setIsCodeRunning(true);
            clearConsole();
            sendCodeToServer(codeInput.value, containerID);
        });

        clearButton.addEventListener('click', () => {
            if (isCodeRunning) return;
            clearConsole();
        });

        outputPanelInput.addEventListener('keydown', (e) => {
            if (!isCodeRunning) {
                e.preventDefault();
                return;
            }
            if (e.key === 'Enter' && !e.metaKey) {
                sendCodeToServer(outputPanelInput.textContent, containerID);
                addToConsole('\n');
                outputPanelInput.textContent = '';
            }
        });
    });

    socket.addEventListener('message', (e) => handleSocketMessage(e.data));

    socket.onerror = (e) => {
        socket.close();
        startSocketConnection(SOCKET_URL);
    };
};

startSocketConnection(SOCKET_URL);
