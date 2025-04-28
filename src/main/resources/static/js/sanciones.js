document.addEventListener('DOMContentLoaded', function () {
    // --- Selectores de elementos ---
    const btnNuevaSancion = document.getElementById('btn-nueva-sancion');
    const formSancion = document.getElementById('form-sancion'); // El formulario dentro del modal
    const ruUsuarioInput = document.getElementById('ruUsuario'); // Input de RU dentro del modal
    const motivoInput = document.getElementById('motivo'); // Input de Motivo dentro del modal
    const sancionesBody = document.getElementById('sanciones-body'); // Cuerpo de la tabla
    const toastContainer = document.getElementById('toast-container'); // Contenedor de toasts
    const filtroRu = document.getElementById('filtro-ru'); // Input de filtro RU
    const filtroMotivo = document.getElementById('filtro-motivo'); // Input de filtro Motivo
    const filtroFechaInicio = document.getElementById('filtro-fecha-inicio'); // Input de filtro Fecha Inicio
    const filtroFechaFin = document.getElementById('filtro-fecha-fin'); // Input de filtro Fecha Fin
    const filtroEstado = document.getElementById('filtro-estado'); // Select de filtro Estado
    const btnLimpiarFiltros = document.getElementById('btn-limpiar-filtros'); // Botón limpiar filtros
    const usuarioInfoDiv = document.getElementById('usuarioInfoDiv'); // Elemento para mostrar la info del usuario (ahora en el HTML)

    // --- Variables ---
    let buscarUsuarioTimeout; // Para el delay en la búsqueda de usuario
    let sancionesData = []; // Para almacenar los datos de las sanciones cargadas

    // --- Inicializar el Modal de Bootstrap ---
    // Asegúrate de que Bootstrap JS se carga antes que este script
    const modalNuevaSancion = new bootstrap.Modal(document.getElementById('modalNuevaSancion'));


    // === Función para mostrar notificaciones Toast ===
    function showToast(message, type = 'success') {
        if (!toastContainer) return; // Asegurarse de que el contenedor existe

        const toast = document.createElement('div');
        // Clases CSS definidas en prestamos.css o Bootstrap
        // Asegúrate de tener estilos para .toast, .toast.success, .toast.error
        toast.classList.add('toast', type);
        toast.textContent = message;
        toastContainer.appendChild(toast);
        setTimeout(() => {
            toast.remove();
        }, 3000); // El toast desaparece después de 3 segundos
    }

    // === Función para marcar una sanción como cumplida (inactiva) ===
    // Esta función debe estar accesible globalmente si se llama desde onclick en el HTML
    window.marcarCumplida = function(id) {
        fetch(`http://localhost:8083/sanciones/cumplida/${id}`, {
            method: 'PUT'
        })
            .then(response => {
                if (!response.ok) throw new Error('No se pudo actualizar el estado.');
                return response.text(); // O response.json() si tu API devuelve JSON
            })
            .then(() => {
                showToast('Sanción marcada como inactiva.', 'success');
                cargarSanciones(); // Recargar la tabla después de actualizar
            })
            .catch(error => {
                showToast(`Error: ${error.message}`, 'error');
                console.error('Error al marcar sanción como inactiva:', error); // Log de depuración
            });
    };

    // === Función para activar una sanción ===
    // Esta función debe estar accesible globalmente si se llama desde onclick en el HTML
    window.activarSancion = function(id) {
        fetch(`http://localhost:8083/sanciones/activar/${id}`, {
            method: 'PUT'
        })
            .then(response => {
                if (!response.ok) throw new Error('No se pudo actualizar el estado.');
                return response.text(); // O response.json() si tu API devuelve JSON
            })
            .then(() => {
                showToast('Sanción activada.', 'success');
                cargarSanciones(); // Recargar la tabla después de actualizar
            })
            .catch(error => {
                showToast(`Error: ${error.message}`, 'error');
                console.error('Error al activar sanción:', error); // Log de depuración
            });
    };

    // === Función para renderizar la tabla de sanciones ===
    function renderizarTabla(sanciones) {
        sancionesBody.innerHTML = ''; // Limpiar el cuerpo de la tabla
        if (!sanciones || sanciones.length === 0) {
            sancionesBody.innerHTML = '<tr><td colspan="7" class="text-center">No hay sanciones para mostrar.</td></tr>';
            return;
        }

        sanciones.forEach(sancion => {
            const row = `
                <tr>
                    <td>${sancion.idSancion}</td>
                    <td>${sancion.usuario?.nombre ? `${sancion.usuario.nombre} ${sancion.usuario.apellido}` : 'Sin usuario'}</td>
                    <td>${sancion.usuario?.ru || 'N/A'}</td>
                    <td>${sancion.motivoSancion}</td>
                    <td>${sancion.fechaSancion ? new Date(sancion.fechaSancion).toLocaleDateString() : 'Sin fecha'}</td>
                    <td><span class="${sancion.estado === 'activa' ? 'status-active' : 'status-inactive'}">${sancion.estado.charAt(0).toUpperCase() + sancion.estado.slice(1)}</span></td>
                    <td>
                        ${sancion.estado === 'activa' ?
                // Usamos window.marcarCumplida y window.activarSancion porque son globales
                `<button class="btn btn-sm btn-danger" onclick="window.marcarCumplida(${sancion.idSancion})">Inactiva</button>` :
                `<button class="btn btn-sm btn-success" onclick="window.activarSancion(${sancion.idSancion})">Activa</button>`
            }
                    </td>
                </tr>
            `;
            sancionesBody.innerHTML += row; // Añadir la fila al cuerpo de la tabla
        });
    }

    // === Función para cargar todas las sanciones ===
    function cargarSanciones() {
        console.log('Cargando sanciones desde la API...'); // Log al iniciar carga
        fetch('http://localhost:8083/sanciones')
            .then(response => {
                console.log('Respuesta de carga recibida:', response.status); // Log de respuesta de carga
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log('Sanciones cargadas:', data); // Log de los datos cargados
                sancionesData = data; // Almacenar los datos cargados globalmente
                renderizarTabla(sancionesData); // Renderizar la tabla con todos los datos inicialmente
            })
            .catch(error => {
                console.error('Error al cargar sanciones:', error); // Log del error de carga
                showToast('Error al cargar las sanciones.', 'error');
            });
    }

    // === Evento para abrir el modal de nueva sanción ===
    btnNuevaSancion.addEventListener('click', () => {
        modalNuevaSancion.show(); // Muestra el modal
        formSancion.reset(); // Limpia el formulario al abrir el modal
        // Asegurarse de limpiar los campos específicos si reset() no es suficiente por alguna razón
        ruUsuarioInput.value = '';
        motivoInput.value = '';
        usuarioInfoDiv.textContent = ''; // Limpia la info del usuario al abrir
        usuarioInfoDiv.classList.remove('text-success', 'text-danger', 'text-secondary'); // Limpia las clases de estado
        console.log('Modal de nueva sanción abierto y formulario limpiado.'); // Log al abrir
    });

    // === Evento para enviar el formulario de nueva sanción (dentro del modal) ===
    formSancion.addEventListener('submit', function(event) {
        event.preventDefault(); // Prevenir el envío tradicional del formulario

        const ru = ruUsuarioInput.value.trim(); // Obtener el valor del RU
        const motivo = motivoInput.value.trim(); // Obtener el valor del motivo

        if (!ru || !motivo) {
            showToast('Por favor, complete todos los campos.', 'error');
            return; // No enviar si los campos están vacíos
        }

        console.log('Intentando crear sanción para RU:', ru, 'con motivo:', motivo); // Log antes del fetch

        fetch(`http://localhost:8083/sanciones/crear/${ru}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ motivoSancion: motivo }) // Enviar solo el motivo en el body
        })
            .then(response => {
                console.log('Respuesta recibida:', response.status, response.statusText); // Log de la respuesta
                if (response.ok) {
                    console.log('Respuesta OK.');
                    // Si esperas un cuerpo JSON incluso en éxito, déjalo.
                    // Si la API devuelve 200 OK sin cuerpo o con un cuerpo no-JSON, usa response.text()
                    // Basado en tu JS original, parece que no usas el cuerpo de la respuesta de éxito,
                    // así que podríamos usar response.text() o simplemente verificar response.ok
                    return response.text().then(() => true); // Simplemente confirmar que fue exitoso
                } else {
                    console.error('Error en la respuesta HTTP:', response.status, response.statusText); // Log del error HTTP
                    // Intentar leer el mensaje de error del cuerpo de la respuesta
                    return response.json().then(errData => {
                        let errorMessage = errData.message || 'Error al crear la sanción (detalle desconocido).';
                        // Incluir detalles del error HTTP si están disponibles
                        if (response.status) errorMessage += ` (Status: ${response.status})`;
                        console.error('Mensaje de error del servidor:', errData); // Log del mensaje de error del backend
                        throw new Error(errorMessage);
                    }).catch(parseError => {
                        console.error('Error al parsear el mensaje de error del servidor:', parseError); // Log si falla el parseo
                        // Si no se puede parsear JSON, usar un mensaje genérico
                        throw new Error(`Error al crear la sanción. Status: ${response.status}. No se pudo obtener detalle.`);
                    });
                }
            })
            .then(() => { // Este then se ejecuta si el fetch fue response.ok
                console.log('Proceso de guardado exitoso. Recargando tabla, cerrando modal y limpiando formulario.'); // Confirmación antes de acciones
                cargarSanciones(); // Recargar la tabla después de crear
                modalNuevaSancion.hide(); // Ocultar el modal al guardar
                formSancion.reset(); // Limpiar el formulario
                ruUsuarioInput.value = ''; // Asegurarse de limpiar específicos
                motivoInput.value = '';
                usuarioInfoDiv.textContent = ''; // Limpiar info del usuario
                usuarioInfoDiv.classList.remove('text-success', 'text-danger', 'text-secondary'); // Limpiar clases
                showToast('Sanción creada exitosamente.', 'success'); // Mostrar mensaje de éxito
                console.log('Modal oculto y formulario reseteado.'); // Confirmación final
            })
            .catch(error => {
                console.error('Error general en el proceso de guardar sanción:', error); // Log del error general
                showToast(`Error al crear la sanción: ${error.message}`, 'error'); // Mostrar mensaje de error
            });
    });

    // === Lógica para buscar usuario por RU (asociada al input en el modal) ===
    ruUsuarioInput.addEventListener('input', function() {
        const ruIngresado = this.value.trim();
        usuarioInfoDiv.textContent = ''; // Limpiar la información anterior
        usuarioInfoDiv.classList.remove('text-success', 'text-danger', 'text-secondary'); // Limpiar clases de estado
        clearTimeout(buscarUsuarioTimeout); // Cancelar búsqueda anterior si el usuario sigue escribiendo

        if (ruIngresado.length >= 3) { // Buscar después de ingresar al menos 3 caracteres
            usuarioInfoDiv.textContent = 'Buscando usuario...'; // Mensaje de estado
            usuarioInfoDiv.classList.add('text-secondary');
            buscarUsuarioTimeout = setTimeout(() => {
                buscarUsuarioPorRu(ruIngresado);
            }, 500); // Esperar 500ms después de que el usuario deje de escribir
        } else if (ruIngresado.length > 0) {
            usuarioInfoDiv.textContent = 'Ingrese al menos 3 caracteres del RU.';
            usuarioInfoDiv.classList.remove('text-success', 'text-danger');
            usuarioInfoDiv.classList.add('text-secondary'); // Clase secundaria para info/advertencia
        } else {
            usuarioInfoDiv.textContent = ''; // Limpiar si el campo está vacío
            usuarioInfoDiv.classList.remove('text-success', 'text-danger', 'text-secondary');
        }
    });

    function buscarUsuarioPorRu(ru) {
        console.log('Buscando usuario por RU:', ru); // Log de búsqueda de usuario
        // Reemplaza con tu endpoint real para buscar usuarios por RU
        fetch(`http://localhost:8083/usuarios/buscarPorRu/${ru}`)
            .then(response => {
                console.log('Respuesta búsqueda usuario:', response.status); // Log de respuesta
                if (!response.ok) {
                    // Si la respuesta no es OK (ej: 404 Not Found)
                    usuarioInfoDiv.textContent = 'Usuario no encontrado.';
                    usuarioInfoDiv.classList.remove('text-success', 'text-secondary');
                    usuarioInfoDiv.classList.add('text-danger');
                    // No intentar parsear JSON si la respuesta no es OK y no esperamos un cuerpo de error
                    return null;
                }
                // Si la respuesta es OK, intentar parsear el JSON
                return response.json();
            })
            .then(usuario => {
                if (usuario) { // Si se encontró un usuario
                    console.log('Usuario encontrado:', usuario); // Log del usuario encontrado
                    usuarioInfoDiv.textContent = `Nombre: ${usuario.nombre} ${usuario.apellido}`;
                    usuarioInfoDiv.classList.remove('text-danger', 'text-secondary');
                    usuarioInfoDiv.classList.add('text-success');
                }
                // Si response.json() devuelve null (porque la respuesta no fue OK y devolvimos null antes),
                // este bloque else if(usuario) no se ejecuta, lo cual es correcto.
            })
            .catch(error => {
                console.error('Error al buscar usuario:', error); // Log del error de búsqueda
                usuarioInfoDiv.textContent = 'Error al verificar el usuario.';
                usuarioInfoDiv.classList.remove('text-success', 'text-danger', 'text-secondary');
                usuarioInfoDiv.classList.add('text-warning'); // O text-danger, ajusta según preferencia
            });
    }


    // === Funcionalidad de Filtrado ===

    function filtrarSanciones() {
        console.log('Aplicando filtros...'); // Log de filtro
        const ruFilter = filtroRu.value.toLowerCase();
        const motivoFilter = filtroMotivo.value.toLowerCase();
        const fechaInicioFilter = filtroFechaInicio.value; // Formato YYYY-MM-DD del input date
        const fechaFinFilter = filtroFechaFin.value;     // Formato YYYY-MM-DD del input date
        const estadoFilter = filtroEstado.value.toLowerCase();

        const filteredSanciones = sancionesData.filter(sancion => {
            // Filtro por RU (o Nombre/Apellido si el RU no existe)
            const ruMatch = sancion.usuario?.ru?.toString().toLowerCase().includes(ruFilter) || false;
            const nombreCompleto = (sancion.usuario?.nombre?.toLowerCase() + ' ' + sancion.usuario?.apellido?.toLowerCase()).trim();
            // Incluir búsqueda por nombre/apellido solo si el RU no tiene un valor significativo
            const nombreMatch = ruFilter.length > 0 && nombreCompleto.includes(ruFilter); // Busca en nombre completo si se ingresa algo en el filtro RU

            const motivoMatch = sancion.motivoSancion?.toLowerCase().includes(motivoFilter) || false;

            // --- Manejo de fechas para comparación - CORRECCIÓN FINAL ---
            // Parsear la fecha de sanción que viene del backend (formato ISO 8601)
            const fechaSancionObj = sancion.fechaSancion ? new Date(sancion.fechaSancion) : null;

            // Verificar si la fecha de sanción es válida antes de usarla
            const isFechaSancionValid = fechaSancionObj && !isNaN(fechaSancionObj.getTime());

            // Crear objetos Date para los filtros de inicio y fin del rango
            // Es importante crear estos en UTC o manejarlos consistentemente
            // new Date("YYYY-MM-DD") se parsea como UTC 00:00
            // new Date("YYYY-MM-DDTHH:mm:ss") se parsea como hora local
            // Para comparar rangos de día completo, es más seguro trabajar con UTC
            const fechaInicioObj = fechaInicioFilter ? new Date(fechaInicioFilter) : null;
            const fechaFinObj = fechaFinFilter ? new Date(fechaFinFilter) : null;

            // Convertir fechas a inicio del día UTC para comparación consistente
            const fechaSancionUTCStartOfDay = isFechaSancionValid
                ? new Date(Date.UTC(fechaSancionObj.getFullYear(), fechaSancionObj.getMonth(), fechaSancionObj.getDate()))
                : null;

            const fechaInicioUTCStartOfDay = fechaInicioObj && !isNaN(fechaInicioObj.getTime())
                ? new Date(Date.UTC(fechaInicioObj.getFullYear(), fechaInicioObj.getMonth(), fechaInicioObj.getDate()))
                : null;

            // Para el final del rango, usamos el inicio del día *siguiente* en UTC
            const fechaFinUTCNextDayStart = fechaFinObj && !isNaN(fechaFinObj.getTime())
                ? new Date(Date.UTC(fechaFinObj.getFullYear(), fechaFinObj.getMonth(), fechaFinObj.getDate() + 1)) // Sumamos 1 día
                : null;

            // Comparación de fechas
            // La sanción coincide con el filtro de fecha si:
            // 1. La fecha de sanción es válida.
            // 2. No hay fecha de inicio de filtro O la fecha de sanción (inicio del día UTC) es >= la fecha de inicio de filtro (inicio del día UTC).
            // 3. No hay fecha de fin de filtro O la fecha de sanción (inicio del día UTC) es < la fecha de fin de filtro (inicio del día del día siguiente UTC).
            const fechaMatch = isFechaSancionValid &&
                (!fechaInicioUTCStartOfDay || fechaSancionUTCStartOfDay >= fechaInicioUTCStartOfDay) &&
                (!fechaFinUTCNextDayStart || fechaSancionUTCStartOfDay < fechaFinUTCNextDayStart);


            const estadoMatch = !estadoFilter || sancion.estado?.toLowerCase() === estadoFilter;

            // La sanción coincide si al menos RU o Nombre/Apellido coinciden (si se busca por RU),
            // Y el motivo, fechas y estado coinciden
            // Ajuste: si el filtro RU está vacío, solo se aplican los otros filtros
            const ruOrNameFilterApplies = ruFilter.length === 0 || ruMatch || nombreMatch;


            return ruOrNameFilterApplies && motivoMatch && fechaMatch && estadoMatch;
        });
        console.log('Sanciones filtradas:', filteredSanciones); // Log de resultados del filtro
        renderizarTabla(filteredSanciones);
    }

    // Event Listeners para los filtros
    filtroRu.addEventListener('input', filtrarSanciones);
    filtroMotivo.addEventListener('input', filtrarSanciones);
    filtroFechaInicio.addEventListener('change', filtrarSanciones);
    filtroFechaFin.addEventListener('change', filtrarSanciones);
    filtroEstado.addEventListener('change', filtrarSanciones);

    // Event Listener para el botón de limpiar filtros
    btnLimpiarFiltros.addEventListener('click', () => {
        console.log('Limpiando filtros...'); // Log de limpiar filtros
        filtroRu.value = '';
        filtroMotivo.value = '';
        filtroFechaInicio.value = '';
        filtroFechaFin.value = '';
        filtroEstado.value = '';
        cargarSanciones(); // Recargar todas las sanciones
    });

    // === Cargar las sanciones al cargar la página ===
    cargarSanciones();

    // Eliminar la redirección al login ya que el botón del sidebar fue eliminado (comentario original)
}); // Fin del DOMContentLoaded