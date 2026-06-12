const URL_BACKEND = 'https://chatbot-backend-ww89.onrender.com'

document.addEventListener('DOMContentLoaded', () => {
    let socket = null;

    const chatBox = document.getElementById('chat-box');
    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-button');
    const emojiButton = document.querySelector('.emoji-btn');
    const connectionStatus = document.getElementById('connection-status');
    const iniciarBtn = document.getElementById('iniciarBtn');
    const encerrarBtn = document.getElementById('encerrarBtn');
    const limparBtn = document.getElementById('limparBtn');

    let userSessionId = null;

    function getTime() {
        return new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    }

    function addMessageToChat(sender, text, type = 'normal') {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message');

        const senderLower = sender.toLowerCase();

        if (senderLower === 'user') {
            messageElement.classList.add('user-message');

            const textSpan = document.createElement('span');
            textSpan.innerHTML = marked.parse(text);
            messageElement.appendChild(textSpan);

            const timeDiv = document.createElement('div');
            timeDiv.classList.add('msg-time');
            timeDiv.textContent = getTime();
            messageElement.appendChild(timeDiv);

        } else if (senderLower === 'bot') {
            messageElement.classList.add('bot-message');

            const avatar = document.createElement('div');
            avatar.classList.add('bot-avatar');
            avatar.textContent = '🤖';
            messageElement.appendChild(avatar);

            const body = document.createElement('div');
            body.classList.add('bot-message-body');

            const textSpan = document.createElement('span');
            textSpan.innerHTML = marked.parse(text);
            body.appendChild(textSpan);

            const timeDiv = document.createElement('div');
            timeDiv.classList.add('msg-time');
            timeDiv.textContent = getTime();
            body.appendChild(timeDiv);

            messageElement.appendChild(body);

        } else {
            messageElement.classList.add('status-message');
            if (type === 'error') messageElement.classList.add('error-text');

            const icon = type === 'error' ? '⚠️' : '✨';
            const label = type === 'error' ? 'Erro' : 'Status';

            const senderSpan = document.createElement('strong');
            senderSpan.textContent = `${icon} ${label}: `;
            messageElement.appendChild(senderSpan);

            const textSpan = document.createElement('span');
            textSpan.textContent = text;
            messageElement.appendChild(textSpan);
        }

        chatBox.appendChild(messageElement);
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    function setChatEnabled(enabled) {
        messageInput.disabled = !enabled;
        sendButton.disabled = !enabled;
        if (emojiButton) emojiButton.disabled = !enabled;
    }

    setChatEnabled(false);
    connectionStatus.textContent = '● Desconectado';
    connectionStatus.className = 'status-badge status-offline';
    addMessageToChat('Status', 'Clique em "Iniciar conversa" para começar.', 'status');

    function iniciarConversa() {
        if (socket && socket.connected) return;

        setChatEnabled(false);
        connectionStatus.innerHTML = '<span class="status-dot"></span> Tentando conectar...';
        connectionStatus.className = 'status-badge status-offline';
        addMessageToChat('Status', 'Tentando conectar ao servidor...', 'status');

        socket = io(URL_BACKEND);

        socket.on('connect', () => {
            connectionStatus.innerHTML = '<span class="status-dot"></span> Online e pronto para ajudar!';
            connectionStatus.className = 'status-badge status-online';
            addMessageToChat('Status', 'Conectado ao servidor de chat.', 'status');
            setChatEnabled(true);
        });

        socket.on('connect_error', () => {
            connectionStatus.innerHTML = '<span class="status-dot"></span> Desconectado';
            connectionStatus.className = 'status-badge status-offline';
            addMessageToChat('Erro', 'Não foi possível conectar ao servidor. Verifique se ele está online e tente novamente.', 'error');
            setChatEnabled(false);
        });

        socket.on('disconnect', () => {
            connectionStatus.innerHTML = '<span class="status-dot"></span> Desconectado';
            connectionStatus.className = 'status-badge status-offline';
            addMessageToChat('Status', 'Você foi desconectado.', 'status');
            setChatEnabled(false);
        });

        socket.on('status_conexao', (data) => {
            if (data.session_id) userSessionId = data.session_id;
        });

        socket.on('nova_mensagem', (data) => {
            addMessageToChat(data.remetente, data.texto);
        });

        socket.on('erro', (data) => {
            addMessageToChat('Erro', data.erro, 'error');
        });
    }

    function encerrarConversa() {
        if (socket && socket.connected) {
            socket.disconnect();
            setChatEnabled(false);
            addMessageToChat('Status', 'Conversa encerrada pelo usuário.', 'status');
        }
    }

    function limparTela() {
        chatBox.innerHTML = '';
        addMessageToChat('Status', 'Tela limpa. Pronto para ouvir você!', 'status');
    }

    function sendMessageToServer() {
        const messageText = messageInput.value.trim();
        if (messageText === '') return;

        if (socket && socket.connected) {
            addMessageToChat('user', messageText);
            socket.emit('enviar_mensagem', { mensagem: messageText });
            messageInput.value = '';
            messageInput.focus();
        } else {
            addMessageToChat('Erro', 'Não conectado ao servidor.', 'error');
        }
    }

    iniciarBtn.addEventListener('click', iniciarConversa);
    encerrarBtn.addEventListener('click', encerrarConversa);
    limparBtn.addEventListener('click', limparTela);
    sendButton.addEventListener('click', sendMessageToServer);

    messageInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') sendMessageToServer();
    });
});