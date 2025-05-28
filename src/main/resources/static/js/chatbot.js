document.addEventListener('DOMContentLoaded', function() {
    const toggleBtn = document.getElementById('chatbot-toggle');
    const windowDiv = document.getElementById('chatbot-window');
    const messagesDiv = document.getElementById('chatbot-messages');
    const input = document.getElementById('chatbot-input');
    const sendBtn = document.getElementById('chatbot-send');
    const minimizeBtn = document.getElementById('chatbot-minimize');
    const header = document.getElementById('chatbot-header');
    let isDragging = false, offsetX = 0, offsetY = 0;

    // Drag & drop
    header.addEventListener('mousedown', function(e) {
        isDragging = true;
        const rect = windowDiv.getBoundingClientRect();
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;
        document.body.style.userSelect = 'none';
    });
    document.addEventListener('mousemove', function(e) {
        if (isDragging) {
            let x = e.clientX - offsetX;
            let y = e.clientY - offsetY;
            // Limita para que no se meta en el sidebar
            x = Math.max(70, Math.min(window.innerWidth - windowDiv.offsetWidth, x));
            y = Math.max(10, Math.min(window.innerHeight - windowDiv.offsetHeight, y));
            windowDiv.style.left = x + 'px';
            windowDiv.style.top = y + 'px';
            windowDiv.style.right = 'auto';
            windowDiv.style.bottom = 'auto';
            windowDiv.style.position = 'fixed';
        }
    });
    document.addEventListener('mouseup', function() {
        isDragging = false;
        document.body.style.userSelect = '';
    });

    // Mostrar/ocultar
    toggleBtn.onclick = () => {
        windowDiv.style.display = windowDiv.style.display === 'none' ? 'flex' : 'none';
        if (windowDiv.style.display === 'flex' && messagesDiv.innerHTML.trim() === '') {
            showWelcome();
        }
    };
    minimizeBtn.onclick = () => windowDiv.style.display = 'none';

    function addMessage(text, fromUser = false) {
        const msg = document.createElement('div');
        msg.className = 'chatbot-msg ' + (fromUser ? 'user' : 'bot');
        msg.innerHTML = `<span class="chatbot-bubble">${text.replace(/\n/g, '<br>')}</span>`;
        messagesDiv.appendChild(msg);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }

    function showWelcome() {
        addMessage('¡Hola! Soy tu asistente del sistema de control de laboratorio. Usa los siguientes comandos para aprender sobre el sistema:', false);
        addMessage('Comandos disponibles:<br>' +
            '<b>/registro</b> - ¿Cómo registrarse?<br>' +
            '<b>/equipos</b> - Gestión de equipos<br>' +
            '<b>/prestamos</b> - Solicitar o ver préstamos<br>' +
            '<b>/devoluciones</b> - Devolver equipos<br>' +
            '<b>/sanciones</b> - Información sobre sanciones<br>' +
            '<b>/usuarios</b> - Gestión de usuarios<br>' +
            '<b>/contacto</b> - Contactar soporte<br>' +
            'O escribe tu pregunta.', false);
    }

    function getBotResponse(userText) {
        const txt = userText.trim().toLowerCase();
        // ... (igual que antes, puedes ampliar aquí)
        if (txt === '/registro') {
            return 'Para registrarte:\n1. Ve a la sección de "Usuarios".\n2. Haz clic en "Registrar nuevo usuario".\n3. Completa el formulario con tus datos.\n4. Haz clic en "Guardar".\n\nRecuerda usar un correo institucional válido.';
        }
        if (txt === '/equipos') {
            return 'Gestión de Equipos:\n- Para agregar un equipo: Ve a "Equipos" y haz clic en "Nuevo Equipo". Completa los campos requeridos y guarda.\n- Para editar: Haz clic en el ícono de lápiz junto al equipo que deseas modificar.\n- Para ver detalles: Haz clic en el nombre del equipo.';
        }
        if (txt === '/prestamos') {
            return 'Préstamos:\n1. Ve a la sección "Préstamos".\n2. Haz clic en "Nuevo Préstamo".\n3. Selecciona el equipo y usuario.\n4. Indica la fecha y hora.\n5. Confirma el préstamo.';
        }
        if (txt === '/devoluciones') {
            return 'Devoluciones:\n1. Ve a "Devoluciones".\n2. Busca el préstamo activo.\n3. Haz clic en "Devolver".\n4. Confirma la devolución y revisa el estado del equipo.';
        }
        if (txt === '/sanciones') {
            return 'Sanciones:\n- Las sanciones se aplican por retrasos o daños.\n- Puedes ver tus sanciones en tu perfil.\n- Si tienes dudas, contacta a un administrador.';
        }
        if (txt === '/usuarios') {
            return 'Gestión de Usuarios:\n- Para agregar: Ve a "Usuarios" y haz clic en "Nuevo Usuario".\n- Para editar: Haz clic en el ícono de lápiz.\n- Para eliminar: Haz clic en el ícono de papelera.';
        }
        if (txt === '/contacto') {
            return 'Para contactar soporte, usa el enlace "Contáctanos" en el pie de página o escribe a soporte@laboratorio.edu.';
        }
        // ... (más respuestas como antes)
        return 'No entendí tu consulta. Usa un comando como <b>/equipos</b> o describe tu duda sobre el sistema.';
    }

    sendBtn.onclick = () => {
        const userText = input.value.trim();
        if (!userText) return;
        addMessage(userText, true);
        setTimeout(() => addMessage(getBotResponse(userText)), 400);
        input.value = '';
    };
    input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') sendBtn.click();
    });

    // Mostrar bienvenida al cargar
    showWelcome();
});