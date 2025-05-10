document.addEventListener('DOMContentLoaded', () => {
    // --- Referencias a elementos del DOM ---
    const tipoReporteSeleccion = document.getElementById('tipo-reporte-seleccion');
    const reporteGlobalSeleccion = document.getElementById('reporte-global-seleccion');
    const reporteUsuarioSeleccion = document.getElementById('reporte-usuario-seleccion');
    const filtrosGlobales = document.getElementById('filtros-globales');
    const filtrosUsuario = document.getElementById('filtros-usuario');
    const vistaPrevia = document.getElementById('vista-previa');
    const reporteContenido = document.getElementById('reporte-contenido');
    const generarReporteBtn = document.getElementById('generar-reporte');
    const cancelarReporteBtn = document.getElementById('cancelar-reporte');
    const imprimirReporteBtn = document.getElementById('imprimir-reporte');
    const tipoReporteBtns = document.querySelectorAll('.tipo-reporte-btn');
    const ruUsuarioInput = document.getElementById('ru-usuario');
    const usuarioInfoDiv = document.getElementById('usuario-info');
    const reportesUsuarioCheckboxes = document.querySelectorAll('input[name="reportesUsuario"]');
    const reportesGlobalesCheckboxes = document.querySelectorAll('input[name="reportesGlobales"]');
    const laboratorioGlobalSelect = document.getElementById('laboratorio-global');
    const categoriaGlobalSelect = document.getElementById('categoria-global');
    // Referencia al nuevo selector de días de semana para horario
    const diasSemanaHorarioSelect = document.getElementById('dias-semana-horario');

    // Referencias a las secciones de filtros de usuario específicas
    const filtrosHistorialPrestamosDiv = document.getElementById('filtros-historial-prestamos');
    const filtrosSancionesDiv = document.getElementById('filtros-sanciones');
    const historialPrestamosUsuarioCheckbox = document.getElementById('historial-prestamos-usuario');
    const sancionesUsuarioCheckbox = document.getElementById('sanciones-usuario');


    // --- Variables de Estado ---
    let tipoReporteSeleccionado = null;
    let usuarioSeleccionado = null; // Almacena la info del usuario buscado
    let reportesSeleccionados = []; // Nombres clave de los reportes a generar
    let filtros = {}; // Mapa de filtros a enviar al backend
    let reportesData = {}; // Almacena la respuesta completa del backend para la vista previa/impresión


    // --- Funciones de Utilidad ---

    // Ocultar todos los formularios y secciones relevantes
    function ocultarFormularios() {
        reporteGlobalSeleccion.classList.add('hidden');
        reporteUsuarioSeleccion.classList.add('hidden');
        filtrosGlobales.classList.add('hidden');
        filtrosUsuario.classList.add('hidden');
        vistaPrevia.classList.add('hidden');
        // Asegurarse de ocultar también los filtros específicos de usuario
        filtrosHistorialPrestamosDiv.classList.add('hidden');
        filtrosSancionesDiv.classList.add('hidden');
    }
    ocultarFormularios(); // Ocultar al cargar la página


    // Función para mostrar un mensaje flotante (éxito o error)
    function mostrarMensaje(mensaje, tipo = 'error') {
        // Eliminar mensajes anteriores para evitar acumulación
        const mensajesExistentes = document.querySelectorAll('.mensaje-flotante');
        mensajesExistentes.forEach(msg => msg.remove());

        // Crear el elemento del mensaje
        const mensajeDiv = document.createElement('div');
        // Usar clases para posicionamiento fijo, centrado y estilos basados en el tipo
        mensajeDiv.className = `mensaje-flotante fixed top-4 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded shadow-md z-50 ${tipo === 'error' ? 'bg-red-100 text-red-700 border border-red-400' : 'bg-green-100 text-green-700 border border-green-400'}`;
        mensajeDiv.textContent = mensaje;

        // Añadir al cuerpo del documento
        document.body.appendChild(mensajeDiv);

        // Eliminar el mensaje después de 4 segundos
        setTimeout(() => mensajeDiv.remove(), 4000);
    }

    // Función para habilitar/deshabilitar los checkboxes de reportesUsuario
    function toggleReportesUsuarioCheckboxes(disabled) {
        reportesUsuarioCheckboxes.forEach(checkbox => {
            checkbox.disabled = disabled;
            if (disabled) {
                checkbox.checked = false; // Desmarcar si se deshabilita
            }
        });
        // Ocultar filtros específicos de usuario si se deshabilitan los checkboxes
        if (disabled) {
            filtrosHistorialPrestamosDiv.classList.add('hidden');
            filtrosSancionesDiv.classList.add('hidden');
            // Limpiar campos de filtros específicos de usuario
            filtrosHistorialPrestamosDiv.querySelectorAll('input, select').forEach(input => input.value = '');
            filtrosSancionesDiv.querySelectorAll('input, select').forEach(input => input.value = '');
        }
    }

    // Función para cargar los laboratorios en el select global
    function cargarLaboratorios() {
        // URL del endpoint en tu ReporteController para obtener laboratorios
        fetch('/reportes/laboratorios')
            .then(response => {
                if (!response.ok) {
                    // Leer el cuerpo de la respuesta para un error más detallado
                    return response.text().then(text => {
                        let errorMsg = `Error al cargar laboratorios (${response.status}): `;
                        try {
                            const errorJson = JSON.parse(text);
                            errorMsg += errorJson.message || errorJson.error || text;
                        } catch(e) {
                            errorMsg += text;
                        }
                        throw new Error(errorMsg);
                    });
                }
                return response.json();
            })
            .then(data => {
                // Limpiar el selector y añadir la opción por defecto
                laboratorioGlobalSelect.innerHTML = '<option value="">Todos los Laboratorios</option>';
                // Asegúrate de que 'data' sea un array y que los objetos laboratorio tengan idLaboratorio y nombre
                if (Array.isArray(data)) {
                    data.forEach(laboratorio => {
                        const option = document.createElement('option');
                        // *** IMPORTANTE ***: Ajusta estas propiedades (.idLaboratorio, .nombre)
                        // según los nombres exactos de las propiedades en el objeto Laboratorio que retorna tu backend.
                        option.value = laboratorio.idLaboratorio; // El valor es el ID
                        option.textContent = laboratorio.nombre; // El texto visible
                        laboratorioGlobalSelect.appendChild(option);
                    });
                } else {
                    console.error("Datos de laboratorios recibidos no es un array:", data);
                    laboratorioGlobalSelect.innerHTML = '<option value="">Error al cargar laboratorios</option>';
                    mostrarMensaje("Error: Formato de datos de laboratorios incorrecto.", 'error');
                }
            })
            .catch(error => {
                console.error('Error al cargar laboratorios:', error);
                mostrarMensaje('Error al cargar laboratorios. ' + error.message, 'error'); // Mostrar mensaje de error de fetch
                laboratorioGlobalSelect.innerHTML = '<option value="">Error al cargar</option>';
                laboratorioGlobalSelect.disabled = true; // Deshabilitar si falla la carga
            });
    }

    // Función para cargar las categorías en el select global (o filtradas por laboratorio)
    function cargarCategorias(laboratorioId = null) {
        // URL del endpoint en tu ReporteController para obtener categorías
        // Añade el parámetro laboratorioId si se especifica
        const url = laboratorioId ? `/reportes/categorias?laboratorioId=${laboratorioId}` : '/reportes/categorias';

        fetch(url)
            .then(response => {
                if (!response.ok) {
                    return response.text().then(text => {
                        let errorMsg = `Error al cargar categorías (${response.status}): `;
                        try {
                            const errorJson = JSON.parse(text);
                            errorMsg += errorJson.message || errorJson.error || text;
                        } catch(e) {
                            errorMsg += text;
                        }
                        throw new Error(errorMsg);
                    });
                }
                return response.json();
            })
            .then(data => {
                // Limpiar el selector y añadir la opción por defecto
                categoriaGlobalSelect.innerHTML = '<option value="">Todas las Categorías</option>';
                if (Array.isArray(data)) {
                    data.forEach(categoria => {
                        const option = document.createElement('option');
                        // *** IMPORTANTE ***: Ajusta estas propiedades (.idCategoria, .nombreCategoria)
                        // según los nombres exactos de las propiedades en el objeto CategoriaEquipo que retorna tu backend.
                        option.value = categoria.idCategoria; // El valor es el ID
                        option.textContent = categoria.nombreCategoria; // El texto visible
                        categoriaGlobalSelect.appendChild(option);
                    });
                } else {
                    console.error("Datos de categorías recibidos no es un array:", data);
                    categoriaGlobalSelect.innerHTML = '<option value="">Error al cargar categorías</option>';
                    mostrarMensaje("Error: Formato de datos de categorías incorrecto.", 'error');
                }
            })
            .catch(error => {
                console.error('Error al cargar categorías:', error);
                mostrarMensaje('Error al cargar categorías. ' + error.message, 'error'); // Mostrar mensaje de error de fetch
                categoriaGlobalSelect.innerHTML = '<option value="">Error al cargar</option>';
                categoriaGlobalSelect.disabled = true; // Deshabilitar si falla la carga
            })
            .finally(() => {
                categoriaGlobalSelect.disabled = false; // Re-habilitar selector siempre al finalizar, incluso si hubo error (para que el usuario pueda reintentar)
            });
    }


    // --- Event Listeners ---

    // Event listener para los botones de tipo de reporte (Global/Usuario)
    tipoReporteBtns.forEach(button => {
        button.addEventListener('click', function() {
            tipoReporteSeleccionado = this.dataset.tipo; // 'global' o 'usuario'
            // Eliminar clase 'active' de todos y añadirla al seleccionado
            tipoReporteBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            // Ocultar todas las secciones y limpiar vista previa al cambiar de tipo
            ocultarFormularios();
            vistaPrevia.classList.add('hidden');
            reporteContenido.innerHTML = ''; // Limpiar vista previa anterior

            // Desmarcar todos los checkboxes de reportes (ambos tipos)
            document.querySelectorAll('input[type="checkbox"][name^="reportes"]').forEach(checkbox => {
                checkbox.checked = false;
            });

            // Limpiar campos de filtro (ambos sets)
            document.querySelectorAll('#filtros-globales input, #filtros-globales select, #filtros-usuario input, #filtros-usuario select').forEach(input => {
                if (input.tagName === 'SELECT') {
                    input.selectedIndex = 0; // Reset selects to first option
                } else {
                    input.value = ''; // Clear input fields
                }
            });

            // Restablecer el estado del usuario seleccionado
            usuarioSeleccionado = null;
            ruUsuarioInput.value = '';
            usuarioInfoDiv.textContent = '';


            // Mostrar la sección relevante y los filtros asociados
            if (tipoReporteSeleccionado === 'global') {
                reporteGlobalSeleccion.classList.remove('hidden');
                filtrosGlobales.classList.remove('hidden');
                // Cargar opciones para los select de filtros globales
                cargarLaboratorios();
                cargarCategorias(); // Cargar todas las categorías inicialmente
                // Deshabilitar checkboxes de usuario si no es reporte de usuario
                toggleReportesUsuarioCheckboxes(true);
            } else if (tipoReporteSeleccionado === 'usuario') {
                reporteUsuarioSeleccion.classList.remove('hidden');
                filtrosUsuario.classList.remove('hidden');
                // Los checkboxes de usuario están deshabilitados por defecto hasta que se busque un usuario válido
                toggleReportesUsuarioCheckboxes(true); // Asegurarse de que estén deshabilitados inicialmente
            }

            // Deshabilitar botones generar/imprimir hasta que haya selecciones válidas
            generarReporteBtn.disabled = true;
            generarReporteBtn.classList.add('bg-gray-500', 'cursor-not-allowed');
            generarReporteBtn.classList.remove('bg-indigo-500', 'hover:bg-indigo-700', 'cursor-pointer');
            imprimirReporteBtn.disabled = true;
            imprimirReporteBtn.classList.add('bg-gray-500', 'cursor-not-allowed');
            imprimirReporteBtn.classList.remove('bg-gray-700', 'hover:bg-gray-700', 'cursor-pointer');

            // Eliminar mensajes flotantes
            const mensajesExistentes = document.querySelectorAll('.mensaje-flotante');
            mensajesExistentes.forEach(msg => msg.remove());
        });
    });

    // Event listener para el cambio en el selector de laboratorio global para filtrar categorías
    laboratorioGlobalSelect.addEventListener('change', function() {
        const selectedLabId = this.value; // Obtiene el ID del laboratorio seleccionado (será string)
        // Limpiar y deshabilitar selector de categoría mientras carga
        categoriaGlobalSelect.innerHTML = '<option value="">Cargando...</option>';
        categoriaGlobalSelect.disabled = true;

        if (selectedLabId) {
            // Convertir el valor a número si tu backend lo espera como Integer
            cargarCategorias(parseInt(selectedLabId, 10)); // Cargar categorías filtradas por laboratorio
        } else {
            cargarCategorias(); // Cargar todas las categorías si "Todos los Laboratorios" está seleccionado (value es "")
        }
        // El re-habilitar se hace en el finally de cargarCategorias
    });


    // Event listeners para checkboxes de reportes de usuario para mostrar/ocultar filtros específicos
    historialPrestamosUsuarioCheckbox.addEventListener('change', function() {
        if (this.checked) {
            filtrosHistorialPrestamosDiv.classList.remove('hidden');
        } else {
            filtrosHistorialPrestamosDiv.classList.add('hidden');
            // Limpiar filtros específicos al ocultar
            filtrosHistorialPrestamosDiv.querySelectorAll('input, select').forEach(input => {
                if (input.tagName === 'SELECT') {
                    input.selectedIndex = 0;
                } else {
                    input.value = '';
                }
            });
        }
        // Re-validar selección para habilitar/deshabilitar el botón generar
        validarYToggleGenerarBoton();
    });

    sancionesUsuarioCheckbox.addEventListener('change', function() {
        if (this.checked) {
            filtrosSancionesDiv.classList.remove('hidden');
        } else {
            filtrosSancionesDiv.classList.add('hidden');
            // Limpiar filtros específicos al ocultar
            filtrosSancionesDiv.querySelectorAll('input, select').forEach(input => {
                if (input.tagName === 'SELECT') {
                    input.selectedIndex = 0;
                } else {
                    input.value = '';
                }
            });
        }
        // Re-validar selección para habilitar/deshabilitar el botón generar
        validarYToggleGenerarBoton();
    });

    // Event listener para el checkbox de Información del Usuario (no tiene filtros específicos)
    document.getElementById('info-usuario').addEventListener('change', function() {
        // Re-validar selección para habilitar/deshabilitar el botón generar
        validarYToggleGenerarBoton();
    });


    // Event listener para el input de RU de usuario (para buscar y habilitar/deshabilitar checkboxes)
    ruUsuarioInput.addEventListener('input', function() {
        const ru = this.value.trim();
        // Limpiar info y deshabilitar checkboxes si el RU está vacío o cambia
        usuarioSeleccionado = null; // Limpiar usuario seleccionado
        usuarioInfoDiv.textContent = ''; // Limpiar info mostrada
        toggleReportesUsuarioCheckboxes(true); // Deshabilitar checkboxes de reportes de usuario
        // Desmarcar también los checkboxes de reportes de usuario al cambiar el RU
        reportesUsuarioCheckboxes.forEach(checkbox => checkbox.checked = false);
        // Asegurarse de que las secciones de filtros específicos se oculten
        filtrosHistorialPrestamosDiv.classList.add('hidden');
        filtrosSancionesDiv.classList.add('hidden');


        // Si hay un RU, intentar buscar el usuario
        if (ru !== '') {
            // Endpoint para buscar usuario por RU (AJUSTA ESTA URL si es diferente en tu proyecto)
            fetch(`/usuarios/buscarPorRu/${ru}`)
                .then(response => {
                    if (response.ok) {
                        return response.json(); // Si se encuentra, devuelve los datos del usuario
                    } else if (response.status === 404) {
                        return null; // Si no se encuentra (404), devuelve null
                    } else {
                        // Para otros errores HTTP, lanzar una excepción
                        throw new Error('Error inesperado al buscar usuario (' + response.status + ')');
                    }
                })
                .then(data => {
                    usuarioSeleccionado = data; // Almacena el objeto usuario si se encontró (o null)
                    if (usuarioSeleccionado) {
                        // Mostrar info del usuario encontrado
                        usuarioInfoDiv.textContent = `Usuario encontrado: ${data.nombre} ${data.apellido}, RU: ${data.ru}`;
                        toggleReportesUsuarioCheckboxes(false); // Habilitar checkboxes de reportes de usuario
                        mostrarMensaje('Usuario encontrado.', 'success');
                    } else {
                        // Si no se encontró usuario
                        usuarioInfoDiv.textContent = 'Usuario no encontrado';
                        toggleReportesUsuarioCheckboxes(true); // Mantener deshabilitados
                        mostrarMensaje('Usuario no encontrado con RU ' + ru + '. Por favor, ingrese un RU válido.', 'error');
                    }
                    // Re-validar selección para habilitar/deshabilitar el botón generar después de buscar usuario
                    validarYToggleGenerarBoton();
                })
                .catch(error => {
                    console.error('Error al buscar usuario:', error);
                    usuarioSeleccionado = null; // Asegurarse de que sea null en caso de error de fetch
                    usuarioInfoDiv.textContent = 'Error al buscar usuario'; // Mostrar mensaje de error de fetch
                    toggleReportesUsuarioCheckboxes(true); // Mantener deshabilitados
                    mostrarMensaje('Error al buscar usuario. Por favor, inténtelo de nuevo.', 'error');
                    // Re-validar selección en caso de error
                    validarYToggleGenerarBoton();
                });
        } else {
            // Si el RU está vacío, deshabilitar y re-validar
            validarYToggleGenerarBoton();
        }
    });

    // Event listeners para los checkboxes de reportes globales (para habilitar/deshabilitar el botón generar)
    reportesGlobalesCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', validarYToggleGenerarBoton);
    });


    // --- Funciones de Lógica de Reporte ---

    // Función para obtener los reportes seleccionados y filtros
    function obtenerReportesSeleccionadosYFiltros() {
        reportesSeleccionados = [];
        filtros = {}; // Reiniciar filtros

        // Recolectar reportes seleccionados y filtros según el tipo
        if (tipoReporteSeleccionado === 'global') {
            reportesGlobalesCheckboxes.forEach(checkbox => {
                if (checkbox.checked) {
                    reportesSeleccionados.push(checkbox.value);
                }
            });
            // Recolectar filtros globales si la sección está visible
            if (!filtrosGlobales.classList.contains('hidden')) {
                filtros = {
                    // Solo incluir filtros si tienen valor (usando .value || null)
                    fechaInicio: document.getElementById('fecha-inicio-global').value || null,
                    fechaFin: document.getElementById('fecha-fin-global').value || null,
                    laboratorio: document.getElementById('laboratorio-global').value || null, // Envía el ID del laboratorio
                    categoria: document.getElementById('categoria-global').value || null // Envía el ID de la categoría
                };
                // --- NUEVO: Recolectar días de semana seleccionados para reporte de horario ---
                // SOLO si el reporte de horario está seleccionado, recogemos este filtro.
                // Opcional: Podrías recogerlo siempre si quieres que el backend lo use para otros reportes globales también.
                // Pero para este caso, solo lo necesita el reporte de horario.
                // Aunque, es más simple en el backend recibir el filtro si está presente, independientemente de qué reportes se pidieron.
                // Vamos a recogerlo siempre si el campo está visible.

                const selectedDays = Array.from(diasSemanaHorarioSelect.selectedOptions).map(option => option.value);
                if (selectedDays.length > 0) {
                    filtros.diasSemana = selectedDays; // Añade el array de strings de días al objeto filtros
                }
                // --- FIN NUEVO ---
            }

        } else if (tipoReporteSeleccionado === 'usuario') {
            // Solo recolectar reportes de usuario si hay un usuario seleccionado
            if (usuarioSeleccionado) {
                reportesUsuarioCheckboxes.forEach(checkbox => {
                    if (checkbox.checked) {
                        reportesSeleccionados.push(checkbox.value);
                    }
                });
                // Recolectar filtros específicos de usuario solo si las secciones están visibles
                if (!filtrosHistorialPrestamosDiv.classList.contains('hidden')) {
                    filtros.estadoPrestamoUsuario = document.getElementById('estado-prestamo').value || null; // Clave debe coincidir con backend
                    filtros.fechaInicioPrestamosUsuario = document.getElementById('fecha-inicio-prestamos').value || null; // Clave debe coincidir
                    filtros.fechaFinPrestamosUsuario = document.getElementById('fecha-fin-prestamos').value || null; // Clave debe coincidir
                }
                if (!filtrosSancionesDiv.classList.contains('hidden')) {
                    filtros.estadoSancionUsuario = document.getElementById('estado-sancion').value || null; // Clave debe coincidir
                    filtros.fechaInicioSancionesUsuario = document.getElementById('fecha-inicio-sanciones').value || null; // Clave debe coincidir
                    filtros.fechaFinSancionesUsuario = document.getElementById('fecha-fin-sanciones').value || null; // Clave debe coincidir
                }
            }
        }

        // Eliminar filtros con valor null o vacío para no enviarlos al backend si no se usaron
        for (const key in filtros) {
            if (filtros.hasOwnProperty(key) && (filtros[key] === null || filtros[key] === '')) {
                delete filtros[key];
            }
        }

        console.log("Reportes seleccionados:", reportesSeleccionados); // Log
        console.log("Filtros recolectados:", filtros); // Log
    }

    // Función para validar la selección de reportes y habilitar/deshabilitar el botón "Generar Reporte"
    function validarYToggleGenerarBoton() {
        obtenerReportesSeleccionadosYFiltros(); // Recolectar selecciones y filtros primero

        // --- DEBUG LOGS (MANTENLOS POR AHORA SI QUIERES, PERO ESTA ES LA ZONA) ---
        console.log("--- DEBUG VALIDACION ---");
        console.log("tipoReporteSeleccionado:", tipoReporteSeleccionado);
        console.log("reportesSeleccionados:", reportesSeleccionados);
        console.log("reportesSeleccionados.length:", reportesSeleccionados.length);
        if (tipoReporteSeleccionado === 'usuario') {
            console.log("usuarioSeleccionado:", usuarioSeleccionado);
            console.log("usuarioSeleccionado !== null:", usuarioSeleccionado !== null);
        }
        console.log("------------------------");
        // console.log("Validación final (isValid):", isValid); // Este log ya no es tan necesario aquí, pero no molesta.
        // --- FIN DEBUG LOGS ---


        let isValid = false; // <-- isValid se declara y se inicializa aquí

        if (tipoReporteSeleccionado === 'global') {
            isValid = reportesSeleccionados.length > 0;
        } else if (tipoReporteSeleccionado === 'usuario') {
            isValid = usuarioSeleccionado !== null && reportesSeleccionados.length > 0;
        }

        // Habilitar o deshabilitar el botón generar usando isValid
        if (isValid) {
            generarReporteBtn.disabled = false;
            generarReporteBtn.classList.remove('bg-gray-500', 'cursor-not-allowed');
            generarReporteBtn.classList.add('bg-indigo-500', 'hover:bg-indigo-700', 'cursor-pointer');
        } else {
            generarReporteBtn.disabled = true;
            generarReporteBtn.classList.add('bg-gray-500', 'cursor-not-allowed');
            generarReporteBtn.classList.remove('bg-indigo-500', 'hover:bg-indigo-700', 'cursor-pointer');
        }
        // Deshabilitar imprimir siempre que no se haya generado aún
        imprimirReporteBtn.disabled = true;
        imprimirReporteBtn.classList.add('bg-gray-500', 'cursor-not-allowed');
        imprimirReporteBtn.classList.remove('bg-gray-700', 'hover:bg-gray-700', 'cursor-pointer');

        console.log("Validación:", isValid, "Reportes:", reportesSeleccionados, "Usuario seleccionado:", usuarioSeleccionado); // Manten este log para verificar

        // --- ¡AÑADE ESTA LÍNEA! ---
        return isValid;
        // --- FIN LÍNEA A AÑADIR ---
    }


    // Función para generar la vista previa del reporte (AJAX)
    function generarVistaPrevia() {
        // Asegurarse de tener las últimas selecciones/filtros
        obtenerReportesSeleccionadosYFiltros();

        // --- AÑADE ESTOS LOGS AQUÍ ---
        console.log("--- INICIO generarVistaPrevia ---");
        const validationResult = validarYToggleGenerarBoton(); // Llama a la función de validación
        console.log("Resultado de validarYToggleGenerarBoton():", validationResult); // Loggea el resultado EXACTO
        console.log("---------------------------------");
        // --- FIN LOGS ---


        // Si la validación falla, mostrar mensaje y detener
        // La condición es TRUE si validationResult es FALSE (porque !false es true)
        if (!validationResult) {
            mostrarMensaje('Por favor, revise su selección de reportes y filtros.', 'error');
            return; // Sale de la función
        }

        // Si la validación pasa (validationResult es TRUE), continuar con la petición
        // Mostrar la sección de vista previa y el mensaje de carga
        vistaPrevia.classList.remove('hidden');
        reporteContenido.innerHTML = '<p class="text-gray-500 italic">Generando vista previa...</p>';
        // Deshabilitar botón imprimir mientras se genera
        imprimirReporteBtn.disabled = true;
        imprimirReporteBtn.classList.add('bg-gray-500', 'cursor-not-allowed');
        imprimirReporteBtn.classList.remove('bg-gray-700', 'hover:bg-gray-700', 'cursor-pointer');


        // Preparar los datos para enviar al backend
        const dataToSend = {
            // tipoReporte: tipoReporteSeleccionado, // No usado en backend ReporteController.generarReporte
            reportes: reportesSeleccionados, // Lista de nombres clave de los reportes
            filtros: filtros, // Mapa de filtros recolectados
            usuarioRu: tipoReporteSeleccionado === 'usuario' && usuarioSeleccionado ? usuarioSeleccionado.ru : null // Enviar RU solo si es reporte de usuario y hay usuario seleccionado
        };

        console.log("Enviando solicitud al backend:", dataToSend); // Log para depuración

        // Realizar la petición POST al endpoint general de generación de reportes
        fetch('/reportes/generarReporte', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dataToSend) // Envía el objeto con reportes y filtros
        })
            .then(response => {
                if (!response.ok) {
                    // Si la respuesta no es OK (ej. 400, 500), leer el cuerpo para obtener el mensaje de error
                    return response.text().then(text => {
                        let errorMsg = `Error del servidor (${response.status}): `;
                        try {
                            const errorJson = JSON.parse(text); // Intentar parsear JSON si el backend envía JSON de error
                            errorMsg += errorJson.message || errorJson.error || text; // Usar mensaje del JSON o texto plano
                        } catch (e) {
                            errorMsg += text; // Si falla el parseo, usar el texto completo de la respuesta
                        }
                        throw new Error(errorMsg); // Lanzar un error para que lo capture el .catch()
                    });
                }
                return response.json(); // Si la respuesta es OK, parsear el cuerpo como JSON
            })
            .then(data => {
                console.log("Datos recibidos del backend:", data); // Log de los datos recibidos
                reportesData = data; // Almacena los datos completos recibidos del backend
                mostrarVistaPrevia(data); // Llamar a la función para renderizar la vista previa
                mostrarMensaje('Vista previa generada correctamente.', 'success');

                // Habilitar botón imprimir si se generó exitosamente
                imprimirReporteBtn.disabled = false;
                imprimirReporteBtn.classList.remove('bg-gray-500', 'cursor-not-allowed');
                imprimirReporteBtn.classList.add('bg-gray-700', 'hover:bg-gray-700', 'cursor-pointer');
            })
            .catch(error => {
                // Manejar cualquier error que ocurra durante la petición o el procesamiento
                console.error('Error al generar vista previa:', error);
                reporteContenido.innerHTML = `<p class="text-red-500">Error al generar reporte: ${error.message}</p>`; // Mostrar mensaje de error en la vista previa
                mostrarMensaje('Error al generar el reporte. Por favor, inténtelo de nuevo.', 'error'); // Mostrar mensaje flotante
                // Mantener deshabilitado el botón imprimir en caso de error
                imprimirReporteBtn.disabled = true;
                imprimirReporteBtn.classList.add('bg-gray-500', 'cursor-not-allowed');
                imprimirReporteBtn.classList.remove('bg-gray-700', 'hover:bg-gray-700', 'cursor-pointer');
            });
    }
    // ... (resto del código JS)

    // Función para mostrar la vista previa en el HTML
    function mostrarVistaPrevia(data) {
        let html = ''; // Variable para construir el HTML de la vista previa

        // --- Lógica para definir el orden de visualización de los reportes ---
        // Define el orden deseado para los reportes de usuario y globales.
        // Los reportes se mostrarán en la vista previa en este orden si están presentes en los datos recibidos.
        const userReportOrder = ["infoUsuario", "historialPrestamosUsuario", "sancionesUsuario"];
        // Orden deseado para reportes globales (puedes ajustar este orden)
        const globalReportOrder = ["equiposMasPrestados", "usuariosMasPrestaron", "prestamosPorFecha", "mantenimientos", "prestamosFechaFecha", "administradoresPrestamo", "sancionesActivasInactivas", "horario-laboratorio"]; // *** AÑADIR la clave del reporte de horario ***

        // Construye un array con las claves de los reportes en el orden deseado
        const reportKeysInOrder = [];

        // Primero añadir reportes de usuario en el orden definido, SÍ existen en los datos recibidos
        userReportOrder.forEach(key => {
            if (data.hasOwnProperty(key)) { // Verifica si el reporte con esta clave existe en los datos recibidos
                reportKeysInOrder.push(key);
            }
        });

        // Luego añadir reportes globales (si los hay) en el orden definido
        globalReportOrder.forEach(key => {
            if (data.hasOwnProperty(key)) {
                reportKeysInOrder.push(key);
            }
        });

        // Si hay otros reportes no contemplados en los arrays anteriores, añadirlos al final (poco probable con tu estructura)
        Object.keys(data).forEach(key => {
            if (!reportKeysInOrder.includes(key)) {
                reportKeysInOrder.push(key);
            }
        });

        // --- Fin de la lógica para definir el orden ---


        // Define un mapeo de la clave del reporte (del backend) a las claves de los datos dentro de cada fila/objeto
        // y el ORDEN en que deben mostrarse en la tabla HTML.
        // ESTO DEBE COINCIDIR EXACTAMENTE CON LAS CLAVES Y EL ORDEN EN QUE PONES LOS .put("clave", valor)
        // EN LOS MÉTODOS generarReporte... EN TU ReporteController.java
        const reporteKeysHTML = {
            "sancionesUsuario": ["idSancion", "motivoSancion", "fechaSancion", "estado"],
            "historialPrestamosUsuario": ["idPrestamo", "fechaPrestamo", "horaPrestamo", "estado", "fechaDevolucionEstimada"],
            "equiposMasPrestados": ["nombre", "cantidadPrestada"],
            "usuariosMasPrestaron": ["nombre", "apellido", "cantidadPrestamos"], // <-- ¡Esta línea debe estar EXACTAMENTE así!
            "prestamosPorFecha": ["idPrestamo", "usuario", "fechaPrestamo", "horaPrestamo", "estado"],
            "mantenimientos": ["idMantenimiento", "equipo", "fechaMantenimiento", "cantidad"], // Ajustado según tu último snippet (sin detalles)
            "prestamosFechaFecha": ["idPrestamo", "usuario", "fechaPrestamo", "horaPrestamo", "administrador", "estado", "fechaDevolucionEstimada"], // Ajustado según tu último snippet
            "administradoresPrestamo": ["administrador", "fechaPrestamo", "horaPrestamo", "usuario"], // Ajustado
            "sancionesActivasInactivas": ["idSancion", "usuario", "motivoSancion", "fechaSancion", "estado"], // Ajustado para listar
            "infoUsuario": null, // Reporte tipo texto, no tiene claves de tabla
            "horario-laboratorio": ["diaSemana", "horaInicio", "horaFin", "ocupado"] // *** AÑADIR: Claves para el reporte de horario ***
            // Agrega aquí los demás reportes de tabla si tienes más y sus claves de datos correspondientes
        };


        // --- Iterar sobre las claves de los reportes en el orden definido y renderizar ---
        reportKeysInOrder.forEach(reporteKey => {
            const reporte = data[reporteKey]; // Obtiene el objeto reporte completo (titulo, tipo, cabecera, datos)

            // Si el reporte con esta clave existe en los datos recibidos
            if (reporte) {
                // Añadir el título del reporte
                html += `<h3 class="text-lg font-semibold text-gray-700 mb-2">${reporte.titulo}</h3>`;

                // --- Renderizado según el tipo de reporte ---
                if (reporte.tipo === 'tabla') {
                    // Obtiene las claves de los datos esperadas para este reporte específico
                    const keys = reporteKeysHTML[reporteKey];
                    if (!keys) {
                        console.error(`Error: No se encontró mapeo de claves para el reporte ${reporteKey} en mostrarVistaPrevia.`);
                        html += `<p class="text-red-500">Error interno al mostrar reporte de tabla.</p>`;
                        html += '<hr class="my-4">';
                        return; // Usar return en forEach para pasar al siguiente elemento del reportKeysInOrder
                    }

                    // Contenedor para scroll horizontal si la tabla es muy ancha
                    html += '<div class="overflow-x-auto">';
                    // Iniciar la estructura de la tabla (usando clases Tailwind/CSS personalizado para estilo)
                    html += '<table class="min-w-full leading-normal shadow-md rounded-lg overflow-hidden">';
                    html += '<thead class="bg-gray-200 text-gray-700">';
                    html += '<tr>';
                    // Itera a través de las cabeceras recibidas del backend para mostrarlas
                    reporte.cabecera.forEach(headerText => {
                        html += `<th class="px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold uppercase tracking-wider">${headerText}</th>`;
                    });
                    html += '</tr>';
                    html += '</thead>';
                    html += '<tbody class="bg-white">';

                    // Verifica si hay datos en la tabla antes de iterar sobre ellos
                    if (reporte.datos && Array.isArray(reporte.datos) && reporte.datos.length > 0) {
                        // Itera sobre cada fila de datos (cada 'fila' es un Map/Objeto)
                        reporte.datos.forEach(fila => {
                            html += '<tr>';
                            // Itera a través de las claves esperadas (definidas en reporteKeysHTML)
                            // para acceder a los datos en el Map 'fila' en el orden correcto
                            keys.forEach(key => {
                                // Accede al valor usando la clave actual
                                const dataValue = fila[key];
                                let displayValue = dataValue;
                                let cellClasses = "px-5 py-5 border-b border-gray-200 text-sm"; // Clases base para la celda

                                // --- Lógica específica de visualización para ciertos campos o reportes ---

                                // Manejo especial para el campo 'ocupado' en el reporte de horario
                                if (reporteKey === "horario-laboratorio" && key === "ocupado") {
                                    displayValue = dataValue ? 'Ocupado' : 'Disponible';
                                    // Opcional: Añadir clases de color basadas en el estado de ocupación
                                    cellClasses += dataValue ? ' text-red-500 font-bold' : ' text-green-500 font-bold';
                                }
                                // Manejo de formato de fecha/hora para otros campos (si vienen como strings con 'T' o solo hora "HH:mm:ss")
                                else if (typeof dataValue === 'string') {
                                    if (dataValue.includes('T')) { // Si parece un timestamp ISO 8601
                                        try {
                                            const date = new Date(dataValue);
                                            if (!isNaN(date.getTime())) {
                                                // Formatear la fecha/hora según el nombre de la clave o el contexto
                                                if (key.toLowerCase().includes('hora') && key.toLowerCase().includes('fecha')) {
                                                    displayValue = date.toLocaleString(); // Ej: "5/2/2025, 8:26:56 AM"
                                                } else if (key.toLowerCase().includes('fecha')) {
                                                    displayValue = date.toLocaleDateString(); // Ej: "5/2/2025"
                                                } else if (key.toLowerCase().includes('hora')) {
                                                    // Formatear solo la hora. Asegúrate de que el backend envíe timestamps si quieres esto.
                                                    // Si el backend envía solo "HH:mm:ss" como string, la siguiente condición lo maneja.
                                                    displayValue = date.toLocaleTimeString(); // Ej: "8:26:56 AM"
                                                } else {
                                                    displayValue = dataValue; // Otros campos string, usar tal cual
                                                }
                                            } else {
                                                displayValue = dataValue; // No es una fecha válida, usar el string original
                                            }
                                        } catch (e) {
                                            console.error("Error formatting date/time from string:", dataValue, e);
                                            displayValue = dataValue; // Si falla el formato, muestra el valor original
                                        }
                                    } else if (dataValue.match(/^\d{2}:\d{2}(:\d{2})?$/)) {
                                        // Si el string es solo una hora (ej. "08:00:00" o "08:00")
                                        displayValue = dataValue;
                                    } else {
                                        // Otros strings, usar tal cual
                                        displayValue = dataValue;
                                    }
                                } else {
                                    // Para todos los demás tipos de datos (números, booleanos que no son 'ocupado', etc.), usar el valor directamente
                                    displayValue = dataValue !== null && dataValue !== undefined ? dataValue : ''; // Asegurar que null/undefined se muestren como vacío
                                }

                                // --- Fin Lógica específica ---


                                // Añadir la celda a la fila
                                html += `<td class="${cellClasses}">${displayValue}</td>`;
                            });
                            html += '</tr>';
                        });
                    } else {
                        // Mostrar un mensaje si la tabla está vacía
                        const colSpan = reporte.cabecera && reporte.cabecera.length > 0 ? reporte.cabecera.length : 1; // Colspan basado en # de cabeceras
                        html += `<tr><td class="px-5 py-5 border-b border-gray-200 text-sm text-center italic" colspan="${colSpan}">No se encontraron datos para este reporte.</td></tr>`;
                    }

                    html += '</tbody>';
                    html += '</table>';
                    html += '</div>'; // Cerrar overflow-x-auto

                } else if (reporte.tipo === 'lista') {
                    // Renderizado para tipo 'lista' (asume reporte.datos es un array de strings/primitivos)
                    if (reporte.datos && Array.isArray(reporte.datos) && reporte.datos.length > 0) {
                        html += '<ul class="list-disc list-inside">';
                        reporte.datos.forEach(item => {
                            html += `<li>${item}</li>`;
                        });
                        html += '</ul>';
                    } else {
                        html += '<p class="text-gray-700 italic">No se encontraron datos para este reporte.</p>';
                    }
                }  else if (reporte.tipo === 'texto' || reporte.tipo === 'info-usuario') {
                    // Renderizado para tipo 'texto' o 'info-usuario' (asume reporte.datos es un string o un objeto para info-usuario)
                    if (reporte.datos) {
                        // Si es info-usuario, el backend envía un objeto, no un string, pero tu frontend espera un string (StringBuilder)
                        // Si el backend envía el StringBuilder.toString(), esto funcionará.
                        if (typeof reporte.datos === 'string' && reporte.datos.trim() !== '') {
                            // Usar whitespace-pre-line para respetar saltos de línea (\n)
                            html += `<p class="text-gray-700 whitespace-pre-line">${reporte.datos}</p>`;
                        } else if (typeof reporte.datos === 'object' && reporte.tipo === 'info-usuario') {
                            // Si el backend cambió a enviar un objeto para info-usuario, puedes renderizarlo aquí
                            let infoHtml = '<div class="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">';
                            // Iterar sobre las claves del objeto de info de usuario (ej: ru, nombre, apellido, etc.)
                            // NOTA: Las claves aquí deben coincidir con las puestas en el Map en generarReporteInfoUsuario
                            const infoKeys = ["ru", "nombre", "apellido", "ci", "tipoUsuario", "carrera", "telefono", "correo", "materia", "paralelo", "semestre"]; // Orden deseado
                            infoKeys.forEach(key => {
                                if(reporte.datos.hasOwnProperty(key) && reporte.datos[key] !== null){
                                    let label = key.replace(/([A-Z])/g, ' $1').trim(); // Convierte camelCase a "Camel Case"
                                    label = label.charAt(0).toUpperCase() + label.slice(1); // Capitaliza la primera letra
                                    infoHtml += `<div><span class="font-semibold">${label}:</span> ${reporte.datos[key]}</div>`;
                                }
                            });
                            infoHtml += '</div>';
                            html += infoHtml;

                        }
                        else {
                            html += '<p class="text-gray-700 italic">No se encontró información para este reporte.</p>';
                        }
                    } else {
                        html += '<p class="text-gray-700 italic">No se encontró información para este reporte.</p>';
                    }
                }
                // Añadir una línea separadora después de cada reporte (excepto el último)
                if (reporteKey !== reportKeysInOrder[reportKeysInOrder.length - 1]) {
                    html += '<hr class="my-4 border-gray-300">';
                }
            } // Fin if (reporte)
        }); // Fin del bucle forEach sobre reportKeysInOrder

        // Si no se generó ningún HTML (ej. no se seleccionaron reportes o no hubo datos), mostrar mensaje
        if (html === '') {
            html = '<p class="text-gray-500 italic">No se seleccionaron reportes válidos o no hay datos.</p>';
        }


        reporteContenido.innerHTML = html; // Insertar el HTML generado en el div de vista previa
    }


    // --- Inicialización y Event Listeners de Botones ---

    // Event listener para el botón Generar Reporte
    generarReporteBtn.addEventListener('click', generarVistaPrevia);

    // Event listener para el botón Imprimir Reporte (usa window.print() por defecto)
    imprimirReporteBtn.addEventListener('click', () => {
        // Verificar si hay datos de reporte generados antes de imprimir
        if (Object.keys(reportesData).length === 0) {
            mostrarMensaje('Por favor, genere primero la vista previa del reporte.', 'error');
            return;
        }
        window.print(); // Abre la ventana de impresión del navegador
    });

    // Event listener para el botón Cancelar Reporte
    cancelarReporteBtn.addEventListener('click', () => {
        // Restablecer todo el estado de la página y ocultar secciones
        ocultarFormularios();
        tipoReporteBtns.forEach(b => b.classList.remove('active')); // Desactivar botones de tipo
        tipoReporteSeleccionado = null; // Reset variable de estado
        usuarioSeleccionado = null; // Reset usuario
        reportesSeleccionados = []; // Limpiar lista de reportes seleccionados
        filtros = {}; // Limpiar filtros
        reportesData = {}; // Limpiar datos del reporte generado
        ruUsuarioInput.value = ''; // Limpiar campo RU
        usuarioInfoDiv.textContent = ''; // Limpiar info usuario
        reporteContenido.innerHTML = ''; // Limpiar área de vista previa

        // Limpiar campos de filtro globales y de usuario
        document.querySelectorAll('#filtros-globales input, #filtros-globales select, #filtros-usuario input, #filtros-usuario select').forEach(input => {
            if (input.tagName === 'SELECT') {
                input.selectedIndex = 0;
            } else {
                input.value = '';
            }
        });

        // Desmarcar todos los checkboxes de reportes globales y de usuario
        document.querySelectorAll('input[type="checkbox"][name^="reportes"]').forEach(checkbox => {
            checkbox.checked = false;
        });

        // Deshabilitar botones generar/imprimir
        generarReporteBtn.disabled = true;
        generarReporteBtn.classList.add('bg-gray-500', 'cursor-not-allowed');
        generarReporteBtn.classList.remove('bg-indigo-500', 'hover:bg-indigo-700', 'cursor-pointer');

        imprimirReporteBtn.disabled = true;
        imprimirReporteBtn.classList.add('bg-gray-500', 'cursor-not-allowed');
        imprimirReporteBtn.classList.remove('bg-gray-700', 'hover:bg-gray-700', 'cursor-pointer');

        // Asegurarse de que los checkboxes de usuario estén deshabilitados
        toggleReportesUsuarioCheckboxes(true);

        // Eliminar mensajes flotantes
        const mensajesExistentes = document.querySelectorAll('.mensaje-flotante');
        mensajesExistentes.forEach(msg => msg.remove());
    });


    // --- Lógica de Inicialización al Cargar la Página ---
    document.addEventListener('DOMContentLoaded', function() {
        // Deshabilitar botones generar/imprimir al cargar la página
        generarReporteBtn.disabled = true;
        generarReporteBtn.classList.add('bg-gray-500', 'cursor-not-allowed');
        generarReporteBtn.classList.remove('bg-indigo-500', 'hover:bg-indigo-700', 'cursor-pointer'); // Asegurar clases correctas
        imprimirReporteBtn.disabled = true;
        imprimirReporteBtn.classList.add('bg-gray-500', 'cursor-not-allowed');
        imprimirReporteBtn.classList.remove('bg-gray-700', 'hover:bg-gray-700', 'cursor-pointer'); // Asegurar clases correctas

        // Ocultar formularios al inicio
        ocultarFormularios();

        // Inicializar la carga de laboratorios y categorías para los filtros globales
        // Se cargarán cuando el usuario seleccione "Reporte Global"
        // cargarLaboratorios(); // Ya se llama al seleccionar el tipo "global"
        // cargarCategorias();  // Ya se llama al seleccionar el tipo "global"

        // Asegurarse de que los checkboxes de usuario estén deshabilitados al inicio
        toggleReportesUsuarioCheckboxes(true);

        // Añadir event listeners a los checkboxes de reportes globales para validar y habilitar/deshabilitar el botón generar
        reportesGlobalesCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', validarYToggleGenerarBoton);
        });
        // Los event listeners para los checkboxes de usuario ya llaman a validarYToggleGenerarBoton
        // (historialPrestamosUsuarioCheckbox y sancionesUsuarioCheckbox).
        // Añadir también el listener para el checkbox de info-usuario
        document.getElementById('info-usuario').addEventListener('change', validarYToggleGenerarBoton);


    }); // Fin DOMContentLoaded


    // NOTE: La función generarPDF() que usaba jspdf no está conectada a ningún botón.
    // Si necesitas exportar a PDF, considera usar jspdf-autotable y conectarla a un nuevo botón.
    // Si solo necesitas imprimir la vista previa HTML, el botón "Imprimir Reporte" ya lo hace con window.print().

}); // Fin del listener principal DOMContentLoaded