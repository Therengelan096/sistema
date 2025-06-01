document.addEventListener('DOMContentLoaded', function() {
    const toggleBtn = document.getElementById('chatbot-toggle');
    const windowDiv = document.getElementById('chatbot-window');
    const messagesDiv = document.getElementById('chatbot-messages');
    const input = document.getElementById('chatbot-input');
    const sendBtn = document.getElementById('chatbot-send');
    const minimizeBtn = document.getElementById('chatbot-minimize');
    const header = document.getElementById('chatbot-header');
    let isDragging = false, offsetX = 0, offsetY = 0;
// ---comandos disponibles:---

    const adminCommands = {
        '/prestamos-pendientes': 'Ver préstamos pendientes',
        '/prestamos-retrasados': 'Ver préstamos retrasados',
        '/usuarios-frecuentes': 'Ver usuarios con más préstamos',
        '/equipos-solicitados': 'Ver equipos más solicitados',
        '/equipos': 'Gestión de equipos',
        '/prestamos': 'Información sobre préstamos',
        '/devoluciones': 'Proceso de devoluciones',
        '/sanciones': 'Información sobre sanciones',
        '/usuarios': 'Gestión de usuarios',
        '/contacto': 'Información de contacto',
        '/ayuda': 'Mostrar esta ayuda'

    };
    // Manejar el cambio en el select
    document.getElementById('commandSelect')?.addEventListener('change', function() {
        const input = document.getElementById('chatInput');
        if (input && this.value) {
            input.value = this.value;
            input.focus();
        }
    });

    // --- FUNCIONES DE FORMATEO ---
    function formatearRespuestaPrestamos(datos, tipo) {
        if (!datos || datos.length === 0) {
            return `No hay préstamos ${tipo} para mostrar.`;
        }
        let respuesta = `📋 ${datos.length} préstamos ${tipo}:\n\n`;
        datos.forEach(p => {
            respuesta += `🔹 ID: ${p.idPrestamo}\n`;
            respuesta += `👤 Usuario: ${p.usuario.nombre} ${p.usuario.apellido}\n`;
            respuesta += `📦 Equipos: ${formatearEquiposPrestados(p.detallesPrestamo)}\n`;
            respuesta += `📅 Fecha: ${new Date(p.fechaPrestamo).toLocaleDateString()}\n`;
            respuesta += `⏰ Hora: ${p.horaPrestamo}\n`;
            respuesta += `───────────────\n`;
        });
        return respuesta;
    }

    function formatearEquiposPrestados(detalles) {
        return detalles.map(d =>
            `${d.equipo.nombre} (${d.cantidad})`
        ).join(', ');
    }

    // --- FUNCIONES DE UI ---
    function addMessage(text, fromUser = false) {
        const msg = document.createElement('div');
        msg.className = 'chatbot-msg ' + (fromUser ? 'user' : 'bot');
        msg.innerHTML = `<span class="chatbot-bubble">${text.replace(/\n/g, '<br>')}</span>`;
        messagesDiv.appendChild(msg);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }

    // --- FUNCIÓN PRINCIPAL DE RESPUESTA ---
    async function getBotResponse(userText) {
        const comando = userText.trim().toLowerCase();

        switch(comando) {
            case '/prestamos-pendientes':
            case '/prestamos-retrasados':
                const datos = await consultarSistema(comando.substring(1));
                return formatearRespuestaPrestamos(datos, comando.split('-')[1]);


            case '/ayuda':
                return 'Comandos disponibles:\n\n' +
                    Object.entries(adminCommands)
                        .map(([cmd, desc]) => `${cmd} - ${desc}`)
                        .join('\n');

            default:
                return 'Comando no reconocido. Usa /ayuda para ver los comandos disponibles.';
        }
    }
    async function consultarSistema(tipo, parametros = {}) {
        try {
            let url = '';
            switch(tipo) {
                case 'prestamos-pendientes':
                    url = '/prestamos?estado=pendiente';  // Ajustado
                    break;
                case 'prestamos-retrasados':
                    url = '/prestamos?estado=retrasado';  // Ajustado
                    break;
                case 'prestamos-hoy':
                    const today = new Date().toISOString().split('T')[0];
                    url = `/prestamos?fecha=${today}`;    // Ajustado
                    break;
                case 'estado-equipos':
                    url = '/prestamos/estado';            // Ajustado
                    break;
                default:
                    throw new Error('Tipo de consulta no válido');
            }

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            // Filtrar los préstamos según el tipo
            if (tipo.includes('prestamos-')) {
                return data.filter(prestamo => {
                    switch(tipo) {
                        case 'prestamos-pendientes':
                            return prestamo.estado === 'pendiente';
                        case 'prestamos-retrasados':
                            return prestamo.estado === 'retrasado';
                        case 'prestamos-hoy':
                            const prestamoDate = new Date(prestamo.fechaPrestamo).toISOString().split('T')[0];
                            const today = new Date().toISOString().split('T')[0];
                            return prestamoDate === today;
                        default:
                            return true;
                    }
                });
            }

            return data;
        } catch (error) {
            console.error('Error en consulta:', error);
            return null;
        }

    }

    // --- EVENTOS ---
    // Drag & Drop
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

    // Eventos de UI
    toggleBtn.onclick = () => {
        windowDiv.style.display = windowDiv.style.display === 'none' ? 'flex' : 'none';
        if (windowDiv.style.display === 'flex' && messagesDiv.innerHTML.trim() === '') {
            showWelcome();
        }
    };

    minimizeBtn.onclick = () => windowDiv.style.display = 'none';

    sendBtn.onclick = async () => {
        const userText = input.value.trim();
        if (!userText) return;

        // Deshabilitar el botón mientras procesa
        sendBtn.disabled = true;
        input.disabled = true;

        try {
            // Mostrar el mensaje del usuario
            addMessage(userText, true);

            // Obtener y mostrar la respuesta
            const response = await getBotResponse(userText);
            addMessage(response);

            // Limpiar el input
            input.value = '';
        } catch (error) {
            console.error('Error:', error);
            addMessage('Lo siento, ocurrió un error al procesar tu solicitud.');
        } finally {
            // Re-habilitar los controles
            sendBtn.disabled = false;
            input.disabled = false;
            input.focus();
        }
    };


    input.addEventListener('keydown', async function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendBtn.click();
        }
    });

    // --- INICIALIZACIÓN ---
    const suggestionContainer = document.getElementById('chatbot-suggestions');

    // Verificar si el contenedor existe antes de crear las sugerencias
    if (suggestionContainer) {
        const suggestedCommands = ['/prestamos-pendientes', '/prestamos-retrasados','/usuarios-frecuentes','/equipos-solicitados'];
        suggestedCommands.forEach(cmd => {
            const button = document.createElement('button');
            button.className = 'suggestion-chip';
            button.textContent = adminCommands[cmd];
            button.dataset.command = cmd;
            button.onclick = () => {
                input.value = cmd;
                sendBtn.click();
            };
            suggestionContainer.appendChild(button);
        });
    }
    showWelcome();

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

    // Mostrar/ocultar IMPORTANTE
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

    async function getBotResponse(userText) {
        const txt = userText.trim().toLowerCase();

        // Primero procesamos los comandos de ayuda estática
        switch(txt) {
            case '/equipos':
                return 'Gestión de Equipos:\n- Para agregar un equipo: Ve a "Equipos" y haz clic en "Nuevo Equipo". Completa los campos requeridos y guarda.\n- Para editar: Haz clic en el ícono de lápiz junto al equipo que deseas modificar.\n- Para ver detalles: Haz clic en el nombre del equipo.';
            case '/prestamos':
                return 'Préstamos:\n1. Ve a la sección "Préstamos".\n2. Haz clic en "Nuevo Préstamo".\n3. Selecciona el equipo y usuario.\n4. Indica la fecha y hora.\n5. Confirma el préstamo.';
            case '/devoluciones':
                return 'Devoluciones:\n1. Ve a "Devoluciones".\n2. Busca el préstamo activo.\n3. Haz clic en "Devolver".\n4. Confirma la devolución y revisa el estado del equipo.';
            case '/sanciones':
                return 'Sanciones:\n1. Las sanciones se aplican por retrasos o daños.\n2. Ve a la interfaz de sanciones.\n3. Haz click en nueva sancion.\n4. Busca al usuario que se le asignara la sancion.\n5. Agrega el motivo y guarda la sancion.';
            case '/usuarios':
                return 'Gestión de Usuarios:\n- Para agregar: Ve a "Usuarios" y haz clic en "Nuevo Usuario".\n- Para editar: Haz clic en el ícono de lápiz.';
            case '/contacto':
                return 'Para contactar soporte, usa el enlace "Contáctanos" en el pie de página o escribe a soporte@laboratorio.edu.';
            case '/ayuda':
                return 'Comandos disponibles:\n\n' +
                    Object.entries(adminCommands)
                        .map(([cmd, desc]) => `${cmd} - ${desc}`)
                        .join('\n');
        }

        // Si no es un comando de ayuda estática, procesamos los comandos dinámicos
        try {
            switch(txt) {
                case '/prestamos-pendientes':
                    const pendientes = await consultarSistema('prestamos-pendientes');
                    return formatearRespuestaPrestamos(pendientes, 'pendientes');

                case '/prestamos-retrasados':
                    const retrasados = await consultarSistema('prestamos-retrasados');
                    return formatearRespuestaPrestamos(retrasados, 'retrasados');
                case '/usuarios-frecuentes':
                    const responseUsuarios = await fetch('/prestamos/estadisticas/usuarios-frecuentes');
                    if (!responseUsuarios.ok) {
                        throw new Error('Error al obtener datos de usuarios frecuentes');
                    }
                    const usuariosFrecuentes = await responseUsuarios.json();
                    let respuestaUsuarios = '👥 Top usuarios con más préstamos:\n\n';

                    // Verificar si usuariosFrecuentes es un array
                    if (Array.isArray(usuariosFrecuentes)) {
                        usuariosFrecuentes.forEach((usuario, index) => {
                            const nombreCompleto = usuario.nombre +
                                (usuario.apellido ? ' ' + usuario.apellido : '');
                            respuestaUsuarios += `${index + 1}. ${nombreCompleto}\n`;
                            respuestaUsuarios += `   📚 Préstamos: ${usuario.cantidad}\n`;
                            respuestaUsuarios += `───────────────\n`;
                        });
                    } else {
                        respuestaUsuarios += 'No hay datos disponibles.';
                    }
                    return respuestaUsuarios;

                case '/equipos-solicitados':
                    const responseEquipos = await fetch('/prestamos/estadisticas/equipos-solicitados');
                    if (!responseEquipos.ok) {
                        throw new Error('Error al obtener datos de equipos solicitados');
                    }
                    const equiposSolicitados = await responseEquipos.json();
                    let respuestaEquipos = '📱 Equipos más solicitados:\n\n';

                    // Verificar si equiposSolicitados es un array
                    if (Array.isArray(equiposSolicitados)) {
                        equiposSolicitados.forEach((equipo, index) => {
                            respuestaEquipos += `${index + 1}. ${equipo.nombre}\n`;
                            respuestaEquipos += `   🔄 Solicitudes: ${equipo.cantidad}\n`;
                            respuestaEquipos += `───────────────\n`;
                        });
                    } else {
                        respuestaEquipos += 'No hay datos disponibles.';
                    }
                    return respuestaEquipos;



                default:
                    return 'Comando no reconocido. Usa /ayuda para ver los comandos disponibles.';
            }
        } catch (error) {
            console.error('Error al procesar el comando:', error);
            return 'Hubo un error al procesar tu solicitud. Por favor, intenta nuevamente.';
        }
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

    sendBtn.onclick = async () => {
        const userText = input.value.trim();
        if (!userText) return;

        // Deshabilitar el botón mientras procesa
        sendBtn.disabled = true;
        input.disabled = true;

        try {
            // Mostrar el mensaje del usuario
            addMessage(userText, true);

            // Obtener y mostrar la respuesta
            const response = await getBotResponse(userText);
            addMessage(response);

            // Limpiar el input
            input.value = '';
        } catch (error) {
            console.error('Error:', error);
            addMessage('Lo siento, ocurrió un error al procesar tu solicitud.');
        } finally {
            // Re-habilitar los controles
            sendBtn.disabled = false;
            input.disabled = false;
            input.focus();
        }
    };

// También actualizar el evento del Enter
    input.addEventListener('keydown', async function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendBtn.click();
        }
    });
});