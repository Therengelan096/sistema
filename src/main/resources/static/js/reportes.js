document.addEventListener('DOMContentLoaded', () => {
    // --- Referencias a elementos del DOM ---
    const tipoReporteSeleccion = document.getElementById('tipo-reporte-seleccion');
    const reporteGlobalSeleccion = document.getElementById('reporte-global-seleccion');
    const reporteUsuarioSeleccion = document.getElementById('reporte-usuario-seleccion');
    // NUEVA REFERENCIA
    const reporteEstadisticoSeleccion = document.getElementById('reporte-estadistico-seleccion');
    // FIN NUEVA REFERENCIA
    const filtrosGlobales = document.getElementById('filtros-globales');
    const filtrosUsuario = document.getElementById('filtros-usuario');
    const vistaPrevia = document.getElementById('vista-previa');
    const reporteContenido = document.getElementById('reporte-contenido');
    const generarReporteBtn = document.getElementById('generar-reporte');
    const cancelarReporteBtn = document.getElementById('cancelar-reporte');
    const imprimirReporteBtn = document.getElementById('imprimir-reporte');
    // ACTUALIZAR querySelectorAll para incluir el nuevo botón
    const tipoReporteBtns = document.querySelectorAll('.tipo-reporte-btn');
    // FIN ACTUALIZAR
    const ruUsuarioInput = document.getElementById('ru-usuario');
    const usuarioInfoDiv = document.getElementById('usuario-info');
    const reportesUsuarioCheckboxes = document.querySelectorAll('input[name="reportesUsuario"]');
    const reportesGlobalesCheckboxes = document.querySelectorAll('input[name="reportesGlobales"]');
    // NUEVA REFERENCIA
    const reportesEstadisticosCheckboxes = document.querySelectorAll('input[name="reportesEstadisticos"]');
    // FIN NUEVA REFERENCIA
    const laboratorioGlobalSelect = document.getElementById('laboratorio-global');
    const categoriaGlobalSelect = document.getElementById('categoria-global');
    const diasSemanaHorarioSelect = document.getElementById('dias-semana-horario');

    const filtrosHistorialPrestamosDiv = document.getElementById('filtros-historial-prestamos');
    const filtrosSancionesDiv = document.getElementById('filtros-sanciones');
    const historialPrestamosUsuarioCheckbox = document.getElementById('historial-prestamos-usuario');
    const sancionesUsuarioCheckbox = document.getElementById('sanciones-usuario');


    // --- Variables de Estado ---
    let tipoReporteSeleccionado = null; // 'global', 'estadistico', o 'usuario'
    let usuarioSeleccionado = null;
    let reportesSeleccionados = [];
    let filtros = {};
    let reportesData = {};
    // Variable para almacenar instancias de Chart.js y poder destruirlas si es necesario
    let activeCharts = {};


    // --- Funciones de Utilidad ---

    // Ocultar todos los formularios y secciones relevantes
    function ocultarFormularios() {
        reporteGlobalSeleccion.classList.add('hidden');
        reporteUsuarioSeleccion.classList.add('hidden');
        reporteEstadisticoSeleccion.classList.add('hidden'); // OCULTAR NUEVA SECCIÓN
        filtrosGlobales.classList.add('hidden');
        filtrosUsuario.classList.add('hidden');
        vistaPrevia.classList.add('hidden');
        filtrosHistorialPrestamosDiv.classList.add('hidden');
        filtrosSancionesDiv.classList.add('hidden');
    }
    // ocultarFormularios(); // Se llama dentro del listener de los botones tipoReporteBtns al inicio


    // Función para mostrar un mensaje flotante (éxito o error)
    function mostrarMensaje(mensaje, tipo = 'error') {
        const mensajesExistentes = document.querySelectorAll('.mensaje-flotante');
        mensajesExistentes.forEach(msg => msg.remove());

        const mensajeDiv = document.createElement('div');
        mensajeDiv.className = `mensaje-flotante fixed top-4 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded shadow-md z-50 ${tipo === 'error' ? 'bg-red-100 text-red-700 border border-red-400' : 'bg-green-100 text-green-700 border border-green-400'}`;
        mensajeDiv.textContent = mensaje;

        document.body.appendChild(mensajeDiv);

        setTimeout(() => mensajeDiv.remove(), 4000);
    }

    // Función para habilitar/deshabilitar los checkboxes de reportesUsuario
    function toggleReportesUsuarioCheckboxes(disabled) {
        reportesUsuarioCheckboxes.forEach(checkbox => {
            checkbox.disabled = disabled;
            if (disabled) {
                checkbox.checked = false;
            }
        });
        if (disabled) {
            filtrosHistorialPrestamosDiv.classList.add('hidden');
            filtrosSancionesDiv.classList.add('hidden');
            filtrosHistorialPrestamosDiv.querySelectorAll('input, select').forEach(input => input.value = '');
            filtrosSancionesDiv.querySelectorAll('input, select').forEach(input => input.value = '');
        }
    }

    // Función para habilitar/deshabilitar los checkboxes de reportesEstadisticos
    function toggleReportesEstadisticosCheckboxes(disabled) {
        reportesEstadisticosCheckboxes.forEach(checkbox => {
            checkbox.disabled = disabled;
            if (disabled) {
                checkbox.checked = false;
            }
        });
    }


    // Función para cargar los laboratorios en el select global
    function cargarLaboratorios() {
        fetch('/reportes/laboratorios')
            .then(response => {
                if (!response.ok) {
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
                laboratorioGlobalSelect.innerHTML = '<option value="">Todos los Laboratorios</option>';
                if (Array.isArray(data)) {
                    data.forEach(laboratorio => {
                        const option = document.createElement('option');
                        option.value = laboratorio.idLaboratorio;
                        option.textContent = laboratorio.nombre;
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
                mostrarMensaje('Error al cargar laboratorios. ' + error.message, 'error');
                laboratorioGlobalSelect.innerHTML = '<option value="">Error al cargar</option>';
                laboratorioGlobalSelect.disabled = true;
            });
    }

    // Función para cargar las categorías en el select global (o filtradas por laboratorio)
    function cargarCategorias(laboratorioId = null) {
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
                categoriaGlobalSelect.innerHTML = '<option value="">Todas las Categorías</option>';
                if (Array.isArray(data)) {
                    data.forEach(categoria => {
                        const option = document.createElement('option');
                        option.value = categoria.idCategoria;
                        option.textContent = categoria.nombreCategoria;
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
                mostrarMensaje('Error al cargar categorías. ' + error.message, 'error');
                categoriaGlobalSelect.innerHTML = '<option value="">Error al cargar</option>';
                categoriaGlobalSelect.disabled = true;
            })
            .finally(() => {
                categoriaGlobalSelect.disabled = false;
            });
    }

    // Función para destruir gráficos existentes
    function destroyCharts() {
        for (const chartId in activeCharts) {
            if (activeCharts[chartId]) {
                activeCharts[chartId].destroy();
                activeCharts[chartId] = null;
            }
        }
        activeCharts = {}; // Limpiar el objeto de gráficos activos
    }


    // --- Event Listeners ---

    // Event listener para los botones de tipo de reporte (Global/Estadistico/Usuario)
    tipoReporteBtns.forEach(button => {
        button.addEventListener('click', function() {
            tipoReporteSeleccionado = this.dataset.tipo; // 'global', 'estadistico' o 'usuario'
            tipoReporteBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            ocultarFormularios(); // Ocultar todas las secciones al cambiar

            // Limpiar vista previa y destruir gráficos existentes
            vistaPrevia.classList.add('hidden');
            reporteContenido.innerHTML = '';
            destroyCharts(); // Destruir cualquier gráfico antes de mostrar nueva vista previa


            // Desmarcar todos los checkboxes de reportes
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
            // Asegurarse de limpiar la selección múltiple del select de días
            Array.from(diasSemanaHorarioSelect.options).forEach(option => {
                option.selected = false;
            });


            // Restablecer el estado del usuario seleccionado
            usuarioSeleccionado = null;
            ruUsuarioInput.value = '';
            usuarioInfoDiv.textContent = '';


            // Mostrar la sección relevante y los filtros asociados
            if (tipoReporteSeleccionado === 'global') {
                reporteGlobalSeleccion.classList.remove('hidden');
                filtrosGlobales.classList.remove('hidden');
                cargarLaboratorios();
                cargarCategorias();
                toggleReportesUsuarioCheckboxes(true);
                toggleReportesEstadisticosCheckboxes(true); // Deshabilitar checkboxes estadísticos
                // Mostrar el filtro de días de semana si no es el reporte de horario
                diasSemanaHorarioSelect.parentElement.parentElement.classList.remove('hidden');


            } else if (tipoReporteSeleccionado === 'estadistico') { // NUEVO TIPO
                reporteEstadisticoSeleccion.classList.remove('hidden'); // Mostrar sección de selección estadística
                filtrosGlobales.classList.remove('hidden'); // Usar los filtros globales
                cargarLaboratorios();
                cargarCategorias();
                toggleReportesUsuarioCheckboxes(true); // Deshabilitar checkboxes de usuario
                toggleReportesEstadisticosCheckboxes(false); // Habilitar checkboxes estadísticos
                // Mostrar los filtros de fecha, lab, cat, pero ocultar el de días de semana ya que no aplica a estos gráficos
                diasSemanaHorarioSelect.parentElement.parentElement.classList.add('hidden');


            } else if (tipoReporteSeleccionado === 'usuario') {
                reporteUsuarioSeleccion.classList.remove('hidden');
                filtrosUsuario.classList.remove('hidden'); // Mostrar filtros de usuario
                toggleReportesUsuarioCheckboxes(true); // Los checkboxes de usuario están deshabilitados por defecto hasta que se busque un usuario válido
                toggleReportesEstadisticosCheckboxes(true); // Deshabilitar checkboxes estadísticos
                // Ocultar la sección de filtros globales completa, ya que los filtros de usuario son específicos
                filtrosGlobales.classList.add('hidden');

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
        const selectedLabId = this.value;
        categoriaGlobalSelect.innerHTML = '<option value="">Cargando...</option>';
        categoriaGlobalSelect.disabled = true;

        if (selectedLabId) {
            cargarCategorias(parseInt(selectedLabId, 10));
        } else {
            cargarCategorias();
        }
    });


    // Event listeners para checkboxes de reportes de usuario para mostrar/ocultar filtros específicos
    historialPrestamosUsuarioCheckbox.addEventListener('change', function() {
        if (this.checked) {
            filtrosHistorialPrestamosDiv.classList.remove('hidden');
        } else {
            filtrosHistorialPrestamosDiv.classList.add('hidden');
            filtrosHistorialPrestamosDiv.querySelectorAll('input, select').forEach(input => {
                if (input.tagName === 'SELECT') {
                    input.selectedIndex = 0;
                } else {
                    input.value = '';
                }
            });
        }
        validarYToggleGenerarBoton();
    });

    sancionesUsuarioCheckbox.addEventListener('change', function() {
        if (this.checked) {
            filtrosSancionesDiv.classList.remove('hidden');
        } else {
            filtrosSancionesDiv.classList.add('hidden');
            filtrosSancionesDiv.querySelectorAll('input, select').forEach(input => {
                if (input.tagName === 'SELECT') {
                    input.selectedIndex = 0;
                } else {
                    input.value = '';
                }
            });
        }
        validarYToggleGenerarBoton();
    });

    document.getElementById('info-usuario').addEventListener('change', function() {
        validarYToggleGenerarBoton();
    });


    // Event listener para el input de RU de usuario (para buscar y habilitar/deshabilitar checkboxes)
    ruUsuarioInput.addEventListener('input', function() {
        const ru = this.value.trim();
        usuarioSeleccionado = null;
        usuarioInfoDiv.textContent = '';
        toggleReportesUsuarioCheckboxes(true);
        reportesUsuarioCheckboxes.forEach(checkbox => checkbox.checked = false);
        filtrosHistorialPrestamosDiv.classList.add('hidden');
        filtrosSancionesDiv.classList.add('hidden');

        if (ru !== '') {
            fetch(`/usuarios/buscarPorRu/${ru}`) // Revisa esta URL
                .then(response => {
                    if (response.ok) {
                        return response.json();
                    } else if (response.status === 404) {
                        return null;
                    } else {
                        throw new Error('Error inesperado al buscar usuario (' + response.status + ')');
                    }
                })
                .then(data => {
                    usuarioSeleccionado = data;
                    if (usuarioSeleccionado) {
                        usuarioInfoDiv.textContent = `Usuario encontrado: ${data.nombre} ${data.apellido}, RU: ${data.ru}`;
                        toggleReportesUsuarioCheckboxes(false);
                        mostrarMensaje('Usuario encontrado.', 'success');
                    } else {
                        usuarioInfoDiv.textContent = 'Usuario no encontrado';
                        toggleReportesUsuarioCheckboxes(true);
                        mostrarMensaje('Usuario no encontrado con RU ' + ru + '. Por favor, ingrese un RU válido.', 'error');
                    }
                    validarYToggleGenerarBoton();
                })
                .catch(error => {
                    console.error('Error al buscar usuario:', error);
                    usuarioSeleccionado = null;
                    usuarioInfoDiv.textContent = 'Error al buscar usuario';
                    toggleReportesUsuarioCheckboxes(true);
                    mostrarMensaje('Error al buscar usuario. Por favor, inténtelo de nuevo.', 'error');
                    validarYToggleGenerarBoton();
                });
        } else {
            validarYToggleGenerarBoton();
        }
    });

    // Event listeners para los checkboxes de reportes globales
    reportesGlobalesCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', validarYToggleGenerarBoton);
    });

    // NUEVOS Event listeners para los checkboxes de reportes estadísticos
    reportesEstadisticosCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', validarYToggleGenerarBoton);
    });
    // FIN NUEVOS

    // Event listener para el select de días de semana (para validar)
    diasSemanaHorarioSelect.addEventListener('change', validarYToggleGenerarBoton);


    // --- Funciones de Lógica de Reporte ---

    // Función para obtener los reportes seleccionados y filtros
    function obtenerReportesSeleccionadosYFiltros() {
        reportesSeleccionados = [];
        filtros = {}; // Reiniciar filtros

        // Recolectar reportes seleccionados según el tipo
        if (tipoReporteSeleccionado === 'global') {
            reportesGlobalesCheckboxes.forEach(checkbox => {
                if (checkbox.checked) {
                    reportesSeleccionados.push(checkbox.value);
                }
            });
            // Recolectar filtros globales si la sección está visible
            if (!filtrosGlobales.classList.contains('hidden')) {
                filtros = {
                    fechaInicio: document.getElementById('fecha-inicio-global').value || null,
                    fechaFin: document.getElementById('fecha-fin-global').value || null,
                    laboratorio: document.getElementById('laboratorio-global').value || null,
                    categoria: document.getElementById('categoria-global').value || null
                };
                // Recolectar días de semana SOLO si el filtro de días está visible (i.e., es reporte global)
                if (!diasSemanaHorarioSelect.parentElement.parentElement.classList.contains('hidden')) {
                    const selectedDays = Array.from(diasSemanaHorarioSelect.selectedOptions).map(option => option.value);
                    if (selectedDays.length > 0) {
                        filtros.diasSemana = selectedDays;
                    }
                }
            }

        } else if (tipoReporteSeleccionado === 'estadistico') { // NUEVO TIPO
            reportesEstadisticosCheckboxes.forEach(checkbox => {
                if (checkbox.checked) {
                    reportesSeleccionados.push(checkbox.value);
                }
            });
            // Recolectar filtros globales si la sección está visible (los estadísticos usan filtros globales)
            if (!filtrosGlobales.classList.contains('hidden')) {
                filtros = {
                    fechaInicio: document.getElementById('fecha-inicio-global').value || null,
                    fechaFin: document.getElementById('fecha-fin-global').value || null,
                    laboratorio: document.getElementById('laboratorio-global').value || null,
                    categoria: document.getElementById('categoria-global').value || null
                    // El filtro de días de semana no aplica a los reportes estadísticos, no se recolecta aquí
                };
            }

        } else if (tipoReporteSeleccionado === 'usuario') {
            if (usuarioSeleccionado) {
                reportesUsuarioCheckboxes.forEach(checkbox => {
                    if (checkbox.checked) {
                        reportesSeleccionados.push(checkbox.value);
                    }
                });
                if (!filtrosHistorialPrestamosDiv.classList.contains('hidden')) {
                    filtros.estadoPrestamoUsuario = document.getElementById('estado-prestamo').value || null;
                    filtros.fechaInicioPrestamosUsuario = document.getElementById('fecha-inicio-prestamos').value || null;
                    filtros.fechaFinPrestamosUsuario = document.getElementById('fecha-fin-prestamos').value || null;
                }
                if (!filtrosSancionesDiv.classList.contains('hidden')) {
                    filtros.estadoSancionUsuario = document.getElementById('estado-sancion').value || null;
                    filtros.fechaInicioSancionesUsuario = document.getElementById('fecha-inicio-sanciones').value || null;
                    filtros.fechaFinSancionesUsuario = document.getElementById('fecha-fin-sanciones').value || null;
                }
            }
        }

        // Eliminar filtros con valor null o vacío (excepto para filtros de selección múltiple vacíos como diasSemana)
        for (const key in filtros) {
            // Si es un array (como diasSemana) y está vacío, ELIMINAR el filtro
            if (Array.isArray(filtros[key]) && filtros[key].length === 0) {
                delete filtros[key];
            }
            // Si NO es un array y es null o string vacío, ELIMINAR el filtro
            else if (!Array.isArray(filtros[key]) && (filtros[key] === null || filtros[key] === '')) {
                delete filtros[key];
            }
            // Mantener otros valores (incluyendo arrays no vacíos y otros tipos de datos)
        }


        console.log("Reportes seleccionados:", reportesSeleccionados);
        console.log("Filtros recolectados:", filtros);
    }


    // Función para validar la selección de reportes y habilitar/deshabilitar el botón "Generar Reporte"
    function validarYToggleGenerarBoton() {
        obtenerReportesSeleccionadosYFiltros();

        let isValid = false;

        if (tipoReporteSeleccionado === 'global') {
            isValid = reportesSeleccionados.length > 0;
        } else if (tipoReporteSeleccionado === 'estadistico') { // NUEVO TIPO
            isValid = reportesSeleccionados.length > 0; // Solo necesita que se seleccione al menos un reporte estadístico
        } else if (tipoReporteSeleccionado === 'usuario') {
            isValid = usuarioSeleccionado !== null && reportesSeleccionados.length > 0;
        }

        if (isValid) {
            generarReporteBtn.disabled = false;
            generarReporteBtn.classList.remove('bg-gray-500', 'cursor-not-allowed');
            generarReporteBtn.classList.add('bg-indigo-500', 'hover:bg-indigo-700', 'cursor-pointer');
        } else {
            generarReporteBtn.disabled = true;
            generarReporteBtn.classList.add('bg-gray-500', 'cursor-not-allowed');
            generarReporteBtn.classList.remove('bg-indigo-500', 'hover:bg-indigo-700', 'cursor-pointer');
        }

        imprimirReporteBtn.disabled = true;
        imprimirReporteBtn.classList.add('bg-gray-500', 'cursor-not-allowed');
        imprimirReporteBtn.classList.remove('bg-gray-700', 'hover:bg-gray-700', 'cursor-pointer');

        console.log("Validación:", isValid, "Reportes:", reportesSeleccionados, "Usuario seleccionado:", usuarioSeleccionado, "Tipo:", tipoReporteSeleccionado);

        return isValid;
    }


    // Función para generar la vista previa del reporte (AJAX)
    function generarVistaPrevia() {
        obtenerReportesSeleccionadosYFiltros();
        const validationResult = validarYToggleGenerarBoton();

        if (!validationResult) {
            mostrarMensaje('Por favor, revise su selección de reportes y filtros.', 'error');
            return;
        }

        vistaPrevia.classList.remove('hidden');
        reporteContenido.innerHTML = '<p class="text-gray-500 italic">Generando vista previa...</p>';
        destroyCharts(); // Destruir gráficos anteriores antes de generar nuevos

        imprimirReporteBtn.disabled = true;
        imprimirReporteBtn.classList.add('bg-gray-500', 'cursor-not-allowed');
        imprimirReporteBtn.classList.remove('bg-gray-700', 'hover:bg-gray-700', 'cursor-pointer');


        const dataToSend = {
            reportes: reportesSeleccionados,
            filtros: filtros,
            usuarioRu: tipoReporteSeleccionado === 'usuario' && usuarioSeleccionado ? usuarioSeleccionado.ru : null
        };

        console.log("Enviando solicitud al backend:", dataToSend);

        fetch('/reportes/generarReporte', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dataToSend)
        })
            .then(response => {
                if (!response.ok) {
                    return response.text().then(text => {
                        let errorMsg = `Error del servidor (${response.status}): `;
                        try {
                            const errorJson = JSON.parse(text);
                            errorMsg += errorJson.message || errorJson.error || text;
                        } catch (e) {
                            errorMsg += text;
                        }
                        throw new Error(errorMsg);
                    });
                }
                return response.json();
            })
            .then(data => {
                console.log("Datos recibidos del backend:", data);
                reportesData = data;
                mostrarVistaPrevia(data); // Ahora esta función renderiza tablas O gráficos
                mostrarMensaje('Vista previa generada correctamente.', 'success');

                imprimirReporteBtn.disabled = false;
                imprimirReporteBtn.classList.remove('bg-gray-500', 'cursor-not-allowed');
                imprimirReporteBtn.classList.add('bg-gray-700', 'hover:bg-gray-700', 'cursor-pointer');
            })
            .catch(error => {
                console.error('Error al generar vista previa:', error);
                reporteContenido.innerHTML = `<p class="text-red-500">Error al generar reporte: ${error.message}</p>`;
                mostrarMensaje('Error al generar el reporte. Por favor, inténtelo de nuevo.', 'error');
                imprimirReporteBtn.disabled = true;
                imprimirReporteBtn.classList.add('bg-gray-500', 'cursor-not-allowed');
                imprimirReporteBtn.classList.remove('bg-gray-700', 'hover:bg-gray-700', 'cursor-pointer');
            });
    }


    // Función para mostrar la vista previa en el HTML (MODIFICADA para manejar gráficos y depuración)
    function mostrarVistaPrevia(data) {
        let html = '';
        destroyCharts(); // Asegurarse de destruir gráficos anteriores antes de renderizar nuevos

        const userReportOrder = ["infoUsuario", "historialPrestamosUsuario", "sancionesUsuario"];
        const globalReportOrder = [
            "equiposMasPrestados", // Tabla global
            "usuariosMasPrestaron", // Tabla global
            "prestamosPorFecha",
            "mantenimientos",
            "prestamosFechaFecha",
            "administradoresPrestamo",
            "sancionesActivasInactivas",
            "horario-laboratorio"
        ];
        // NUEVO: Orden específico para reportes estadísticos (si aplica)
        // Restablecer a camelCase para que coincida con las claves del backend y los nuevos valores del HTML
        const estadisticoReportOrder = ["equiposMasPrestados", "usuariosMasPrestaron"]; // Claves en el orden deseado para gráficos (en camelCase)


        const reportKeysToRender = [];

        if (tipoReporteSeleccionado === 'usuario') {
            userReportOrder.forEach(key => {
                if (data.hasOwnProperty(key)) {
                    reportKeysToRender.push(key);
                }
            });
        } else if (tipoReporteSeleccionado === 'global') {
            globalReportOrder.forEach(key => {
                if (data.hasOwnProperty(key)) {
                    reportKeysToRender.push(key);
                }
            });
        } else if (tipoReporteSeleccionado === 'estadistico') {
            estadisticoReportOrder.forEach(key => {
                if (data.hasOwnProperty(key) && reportesSeleccionados.includes(key)) {
                    reportKeysToRender.push(key);
                }
            });
        }


        const reporteKeysHTML = {
            "sancionesUsuario": ["idSancion", "motivoSancion", "fechaSancion", "estado"],
            "historialPrestamosUsuario": ["idPrestamo", "fechaPrestamo", "horaPrestamo", "estado", "fechaDevolucionEstimada"],
            "equiposMasPrestados": ["nombre", "cantidadPrestada"],
            "usuariosMasPrestaron": ["nombre", "apellido", "cantidadPrestamos"],
            "prestamosPorFecha": ["idPrestamo", "usuario", "fechaPrestamo", "horaPrestamo", "estado"],
            "mantenimientos": ["idMantenimiento", "equipo", "fechaMantenimiento", "cantidad"],
            "prestamosFechaFecha": ["idPrestamo", "usuario", "fechaPrestamo", "horaPrestamo", "administrador", "estado", "fechaDevolucionEstimada"],
            "administradoresPrestamo": ["administrador", "fechaPrestamo", "horaPrestamo", "usuario"],
            "sancionesActivasInactivas": ["idSancion", "usuario", "motivoSancion", "fechaSancion", "estado"],
            "infoUsuario": null,
            "horario-laboratorio": ["diaSemana", "horaInicio", "horaFin", "ocupado"]
        };


        // --- Iterar sobre las claves de los reportes en el orden definido y renderizar ---
        reportKeysToRender.forEach(reporteKey => {
            const reporte = data[reporteKey];

            if (reporte) {
                html += `<h3 class="text-lg font-semibold text-gray-700 mb-2">${reporte.titulo}</h3>`;

                // *** LOGS DE DEPURACIÓN CLAVE ***
                console.log(`[DEBUG] Procesando reporteKey: ${reporteKey}`);
                console.log(`[DEBUG] reporte.tipo: ${reporte.tipo}, tipoReporteSeleccionado: ${tipoReporteSeleccionado}`);
                console.log(`[DEBUG] reporte.datos: `, reporte.datos); // Verifica también si datos está vacío []
                // *** FIN LOGS DE DEPURACIÓN ***


                // Si el tipo general es ESTADISTICO y el reporte es uno de los que tiene gráfico
                if (tipoReporteSeleccionado === 'estadistico' && (reporteKey === 'equiposMasPrestados' || reporteKey === 'usuariosMasPrestaron')) {
                    console.log(`[DEBUG] Condición 'estadistico' y reporte clave ${reporteKey} CUMPLIDA. Agregando canvas.`);
                    html += `<div class="chart-container"><canvas id="chart-${reporteKey}"></canvas></div>`;

                } else if (reporte.tipo === 'tabla') { // <--- ESTA CONDICIÓN ES LA QUE DEBERÍA CUMPLIRSE PARA TABLAS NORMALES
                    console.log(`[DEBUG] Condición 'reporte.tipo === tabla' CUMPLIDA para ${reporteKey}. Agregando tabla.`);
                    // Renderizar como Tabla
                    const keys = reporteKeysHTML[reporteKey];
                    if (!keys) {
                        console.error(`[DEBUG] Error: No se encontró mapeo de claves para el reporte ${reporteKey} en reporteKeysHTML.`);
                        html += `<p class="text-red-500">Error interno al mostrar reporte de tabla.</p>`;
                        html += '<hr class="my-4">';
                        // No usar 'return' aquí, solo para depuración, para ver si otros reportes fallan igual
                    } else if (!reporte.cabecera || !Array.isArray(reporte.cabecera) || reporte.cabecera.length === 0) {
                        // Añadir un check extra por si falta la cabecera (necesaria para la tabla)
                        console.error(`[DEBUG] Error: Falta la cabecera ('cabecera') para el reporte de tabla ${reporteKey}.`);
                        html += `<p class="text-red-500">Error: Falta información de cabecera para la tabla.</p>`;
                        html += '<hr class="my-4">';
                        // No usar 'return' aquí
                    }
                    else { // Si las claves y cabecera existen, intentar renderizar la tabla
                        html += '<div class="overflow-x-auto">';
                        html += '<table class="min-w-full leading-normal shadow-md rounded-lg overflow-hidden">';
                        html += '<thead class="bg-gray-200 text-gray-700">';
                        html += '<tr>';
                        reporte.cabecera.forEach(headerText => {
                            html += `<th class="px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold uppercase tracking-wider">${headerText}</th>`;
                        });
                        html += '</tr>';
                        html += '</thead>';
                        html += '<tbody class="bg-white">';

                        if (reporte.datos && Array.isArray(reporte.datos) && reporte.datos.length > 0) {
                            console.log(`[DEBUG] Datos encontrados para tabla ${reporteKey}. Iterando sobre filas.`);
                            reporte.datos.forEach(fila => { // fila es un Map/Objeto
                                html += '<tr>';
                                keys.forEach(key => {
                                    const dataValue = fila[key];
                                    let displayValue = dataValue;
                                    let cellClasses = "px-5 py-5 border-b border-gray-200 text-sm";

                                    // Lógica específica de visualización
                                    if (reporteKey === "horario-laboratorio" && key === "ocupado") {
                                        displayValue = dataValue ? 'Ocupado' : 'Disponible';
                                        cellClasses += dataValue ? ' text-red-500 font-bold' : ' text-green-500 font-bold';
                                    }
                                    // Manejo de formato de fecha/hora
                                    else if (typeof dataValue === 'string') {
                                        if (dataValue.includes('T')) {
                                            try {
                                                const date = new Date(dataValue);
                                                if (!isNaN(date.getTime())) {
                                                    if (key.toLowerCase().includes('hora') && key.toLowerCase().includes('fecha')) {
                                                        displayValue = date.toLocaleString();
                                                    } else if (key.toLowerCase().includes('fecha')) {
                                                        displayValue = date.toLocaleDateString();
                                                    } else if (key.toLowerCase().includes('hora')) {
                                                        displayValue = date.toLocaleTimeString();
                                                    } else { displayValue = dataValue; }
                                                } else { displayValue = dataValue; }
                                            } catch (e) {
                                                console.error("Error formatting date/time from string:", dataValue, e);
                                                displayValue = dataValue;
                                            }
                                        } else if (dataValue.match(/^\d{2}:\d{2}(:\d{2})?$/)) { displayValue = dataValue; }
                                        else { displayValue = dataValue; }
                                    } else {
                                        displayValue = dataValue !== null && dataValue !== undefined ? dataValue : '';
                                    }
                                    html += `<td class="${cellClasses}">${displayValue}</td>`;
                                });
                                html += '<tr>'; // *** CORRECCIÓN: Cerrar la etiqueta <tr> correctamente ***
                                // ERROR POTENCIAL: La línea anterior estaba duplicada, generando HTML inválido
                            });
                            html += '</tbody>'; html += '</table>'; html += '</div>';
                            // *** FIN CORRECCIÓN ***

                        } else {
                            console.log(`[DEBUG] Datos vacíos para tabla ${reporteKey}. Agregando mensaje.`);
                            const colSpan = reporte.cabecera && reporte.cabecera.length > 0 ? reporte.cabecera.length : 1;
                            html += `<tr><td class="px-5 py-5 border-b border-gray-200 text-sm text-center italic" colspan="${colSpan}">No se encontraron datos para este reporte.</td></tr>`;
                            // *** CORRECCIÓN: Cerrar la tabla y el div si no hay datos también ***
                            html += '</tbody>'; html += '</table>'; html += '</div>';
                            // *** FIN CORRECCIÓN ***
                        }
                    } // Fin else if (!keys)

                } else if (reporte.tipo === 'lista') {
                    console.log(`[DEBUG] Condición 'reporte.tipo === lista' CUMPLIDA para ${reporteKey}. Agregando lista.`);
                    // Renderizado para tipo 'lista'
                    if (reporte.datos && Array.isArray(reporte.datos) && reporte.datos.length > 0) {
                        html += '<ul class="list-disc list-inside">';
                        reporte.datos.forEach(item => { html += `<li>${item}</li>`; });
                        html += '</ul>';
                    } else { html += '<p class="text-gray-700 italic">No se encontraron datos para este reporte.</p>'; }

                } else if (reporte.tipo === 'texto' || reporte.tipo === 'info-usuario') {
                    console.log(`[DEBUG] Condición 'reporte.tipo === texto' o 'info-usuario' CUMPLIDA para ${reporteKey}. Agregando texto.`);
                    // Renderizado para tipo 'texto' o 'info-usuario'
                    if (reporte.datos) {
                        if (typeof reporte.datos === 'string' && reporte.datos.trim() !== '') {
                            html += `<p class="text-gray-700 whitespace-pre-line">${reporte.datos}</p>`;
                        } else if (typeof reporte.datos === 'object' && reporte.tipo === 'info-usuario') {
                            let infoHtml = '<div class="grid grid-cols-1 md:grid-cols-1 gap-2 text-sm">'; // Grid de 1 columna para info
                            const infoKeys = ["ru", "nombre", "apellido", "ci", "tipoUsuario", "carrera", "telefono", "correo", "materia", "paralelo", "semestre"];
                            infoKeys.forEach(key => {
                                if(reporte.datos.hasOwnProperty(key) && reporte.datos[key] !== null){
                                    let label = key.replace(/([A-Z])/g, ' $1').trim();
                                    label = label.charAt(0).toUpperCase() + label.slice(1);
                                    infoHtml += `<div><span class="font-semibold">${label}:</span> ${reporte.datos[key]}</div>`;
                                }
                            });
                            infoHtml += '</div>';
                            html += infoHtml;
                        }
                        else { html += '<p class="text-gray-700 italic">No se encontró información para este reporte.</p>'; }
                    } else { html += '<p class="text-gray-700 italic">No se encontró información para este reporte.</p>'; }
                } else {
                    console.warn(`[DEBUG] Tipo de reporte desconocido o condición no cumplida para ${reporteKey}. reporte.tipo: ${reporte.tipo}, tipoReporteSeleccionado: ${tipoReporteSeleccionado}`);
                }

                // Añadir una línea separadora
                if (reporteKey !== reportKeysToRender[reportKeysToRender.length - 1]) {
                    html += '<hr class="my-4 border-gray-300">';
                }
            } else {
                console.warn(`[DEBUG] Reporte object es null/undefined para clave: ${reporteKey}`);
            }
        }); // Fin del bucle forEach sobre reportKeysToRender


        // Si no se generó ningún HTML (esto solo pasaría si reportKeysToRender está vacío o todos los reportes son null)
        if (html === '') {
            console.log("[DEBUG] HTML resultante vacío. Mostrando mensaje por defecto.");
            html = '<p class="text-gray-500 italic">No se seleccionaron reportes válidos o no hay datos.</p>';
        }

        // Insertar el HTML generado
        reporteContenido.innerHTML = html;

        // --- Crear gráficos DESPUÉS de insertar el HTML (Lógica CORREGIDA para acceso a propiedades) ---
        if (tipoReporteSeleccionado === 'estadistico') {
            console.log("[DEBUG] Tipo de reporte seleccionado es 'estadistico'. Intentando crear gráficos.");
            reportKeysToRender.forEach(reporteKey => {
                const reporte = data[reporteKey];
                // Solo intentar crear gráfico si es uno de los tipos estadísticos esperados
                if (reporte && (reporteKey === 'equiposMasPrestados' || reporteKey === 'usuariosMasPrestaron')) {
                    const canvasId = `chart-${reporteKey}`;
                    const ctx = document.getElementById(canvasId);
                    console.log(`[DEBUG] Buscando canvas con ID: ${canvasId}. Encontrado ctx: `, ctx);

                    if (ctx) {
                        // Asegurarse de que haya datos para graficar
                        if (reporte.datos && Array.isArray(reporte.datos) && reporte.datos.length > 0) {
                            console.log(`[DEBUG] Datos encontrados para el gráfico ${reporteKey}. Preparando datos para Chart.js`);
                            // Extraer etiquetas y valores de los datos (AHORA item es un OBJETO)
                            const labels = reporte.datos.map(item => {
                                if (reporteKey === 'usuariosMasPrestaron') {
                                    // Usuarios: acceder por CLAVE 'nombre' y 'apellido'
                                    return `${item.nombre || ''} ${item.apellido || ''}`.trim();
                                } else { // equiposMasPrestados
                                    // Equipar: acceder por CLAVE 'nombre'
                                    return item.nombre || 'Equipo Desconocido';
                                }
                            });

                            const values = reporte.datos.map(item => {
                                // Acceder por CLAVE 'cantidadPrestamos' o 'cantidadPrestada'
                                if (reporteKey === 'usuariosMasPrestaron') {
                                    return item.cantidadPrestamos || 0; // Acceder por clave
                                } else { // equiposMasPrestados
                                    return item.cantidadPrestada || 0; // Acceder por clave
                                }
                            });
                            console.log(`[DEBUG] Labels para gráfico ${reporteKey}:`, labels);
                            console.log(`[DEBUG] Values para gráfico ${reporteKey}:`, values);


                            let chartTitle = reporte.titulo;

                            const chartConfig = {
                                type: 'bar',
                                data: {
                                    labels: labels,
                                    datasets: [{
                                        label: 'Cantidad',
                                        data: values,
                                        backgroundColor: [ 'rgba(54, 162, 235, 0.6)', 'rgba(255, 99, 132, 0.6)', 'rgba(255, 159, 64, 0.6)', 'rgba(75, 192, 192, 0.6)', 'rgba(153, 102, 255, 0.6)', 'rgba(201, 203, 207, 0.6)' ],
                                        borderColor: [ 'rgba(54, 162, 235, 1)', 'rgba(255, 99, 132, 1)', 'rgba(255, 159, 64, 1)', 'rgba(75, 192, 192, 1)', 'rgba(153, 102, 255, 1)', 'rgba(201, 203, 207, 1)' ],
                                        borderWidth: 1
                                    }]
                                },
                                options: {
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: {
                                        legend: { display: false },
                                        title: { display: true, text: chartTitle }
                                    },
                                    scales: {
                                        y: {
                                            beginAtZero: true,
                                            ticks: {
                                                stepSize: 1,
                                                callback: function(value) { if (value % 1 === 0) { return value; } }
                                            }
                                        }
                                    }
                                }
                            };

                            activeCharts[reporteKey] = new Chart(ctx, chartConfig);
                            console.log(`[DEBUG] Gráfico creado para ${reporteKey}.`);

                        } else {
                            console.log(`[DEBUG] Datos vacíos para el gráfico ${reporteKey}. Mostrando mensaje.`);
                            const chartContainer = ctx.parentElement;
                            if (chartContainer) {
                                ctx.remove();
                                chartContainer.innerHTML = `<p class="text-gray-700 italic text-center">No se encontraron datos para este reporte estadístico.</p>`;
                            }
                        }
                    } else {
                        console.warn(`[DEBUG] Contexto de canvas no encontrado para ID: ${canvasId}. No se puede crear el gráfico.`);
                    }
                } // Fin if es reporte estadistico esperado
            }); // Fin forEach reportKeysToRender
        } // Fin if tipoReporteSeleccionado === 'estadistico'
        // --- FIN NUEVO: Crear gráficos ---

    }


    // --- Inicialización y Event Listeners de Botones ---

    // Event listener para el botón Generar Reporte
    generarReporteBtn.addEventListener('click', generarVistaPrevia);

    // Event listener para el botón Imprimir Reporte (usa window.print() por defecto)
    imprimirReporteBtn.addEventListener('click', () => {
        if (Object.keys(reportesData).length === 0) {
            mostrarMensaje('Por favor, genere primero la vista previa del reporte.', 'error');
            return;
        }
        // Opcional: Antes de imprimir, puedes intentar renderizar los gráficos como imágenes
        // Esto requiere más código para iterar sobre activeCharts, generar imagen y reemplazar canvas
        // Por ahora, simplemente ocultamos los canvas en el CSS de impresión.

        window.print();
    });

    // Event listener para el botón Cancelar Reporte
    cancelarReporteBtn.addEventListener('click', () => {
        ocultarFormularios();
        tipoReporteBtns.forEach(b => b.classList.remove('active'));
        tipoReporteSeleccionado = null;
        usuarioSeleccionado = null;
        reportesSeleccionados = [];
        filtros = {};
        reportesData = {};
        ruUsuarioInput.value = '';
        usuarioInfoDiv.textContent = '';
        reporteContenido.innerHTML = '';
        destroyCharts(); // Destruir gráficos al cancelar

        document.querySelectorAll('#filtros-globales input, #filtros-globales select, #filtros-usuario input, #filtros-usuario select').forEach(input => {
            if (input.tagName === 'SELECT') {
                input.selectedIndex = 0;
            } else {
                input.value = '';
            }
        });
        Array.from(diasSemanaHorarioSelect.options).forEach(option => {
            option.selected = false;
        });


        document.querySelectorAll('input[type="checkbox"][name^="reportes"]').forEach(checkbox => {
            checkbox.checked = false;
        });

        generarReporteBtn.disabled = true;
        generarReporteBtn.classList.add('bg-gray-500', 'cursor-not-allowed');
        generarReporteBtn.classList.remove('bg-indigo-500', 'hover:bg-indigo-700', 'cursor-pointer');

        imprimirReporteBtn.disabled = true;
        imprimirReporteBtn.classList.add('bg-gray-500', 'cursor-not-allowed');
        imprimirReporteBtn.classList.remove('bg-gray-700', 'hover:bg-gray-700', 'cursor-pointer');

        toggleReportesUsuarioCheckboxes(true);
        toggleReportesEstadisticosCheckboxes(true); // Deshabilitar checkboxes estadísticos

        const mensajesExistentes = document.querySelectorAll('.mensaje-flotante');
        mensajesExistentes.forEach(msg => msg.remove());
    });


    // --- Lógica de Inicialización al Cargar la Página ---
    document.addEventListener('DOMContentLoaded', function() {
        // Deshabilitar botones generar/imprimir al cargar la página
        generarReporteBtn.disabled = true;
        generarReporteBtn.classList.add('bg-gray-500', 'cursor-not-allowed');
        generarReporteBtn.classList.remove('bg-indigo-500', 'hover:bg-indigo-700', 'cursor-pointer');
        imprimirReporteBtn.disabled = true;
        imprimirReporteBtn.classList.add('bg-gray-500', 'cursor-not-allowed');
        imprimirReporteBtn.classList.remove('bg-gray-700', 'hover:bg-gray-700', 'cursor-pointer');

        // Ocultar formularios al inicio
        ocultarFormularios();

        // Asegurarse de que los checkboxes de usuario y estadísticos estén deshabilitados al inicio
        toggleReportesUsuarioCheckboxes(true);
        toggleReportesEstadisticosCheckboxes(true);

        // Añadir event listeners a los checkboxes de reportes globales para validar
        reportesGlobalesCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', validarYToggleGenerarBoton);
        });
        // Añadir event listeners a los checkboxes de reportes estadísticos para validar
        reportesEstadisticosCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', validarYToggleGenerarBoton);
        });
        // Añadir listeners para los checkboxes de usuario para validar (ya estaban, solo confirmación)
        document.getElementById('historial-prestamos-usuario').addEventListener('change', validarYToggleGenerarBoton);
        document.getElementById('sanciones-usuario').addEventListener('change', validarYToggleGenerarBoton);
        document.getElementById('info-usuario').addEventListener('change', validarYToggleGenerarBoton);

        // Añadir listener para el select de días de semana para validar
        diasSemanaHorarioSelect.addEventListener('change', validarYToggleGenerarBoton);


        // NOTA: La carga inicial de laboratorios/categorías ahora ocurre al hacer click
        // en los botones "Reporte Global" o "Reportes Estadísticos".

        // Añadir event listeners a los botones de tipo de reporte (Global/Estadistico/Usuario)
        tipoReporteBtns.forEach(button => {
            button.addEventListener('click', function() {
                // La lógica de selección y visualización se maneja dentro de este listener
                // Ahora se llama a ocultarFormularios, limpiar estados, cargar selects,
                // y mostrar secciones relevantes.
                // No necesitamos llamar a validarYToggleGenerarBoton aquí, ya que los checkboxes
                // deshabilitados al inicio no permiten una selección válida inmediatamente.
                // La validación ocurrirá cuando el usuario seleccione un reporte después.
                tipoReporteSeleccionado = this.dataset.tipo; // Actualizar variable de estado global
                tipoReporteBtns.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                ocultarFormularios();
                vistaPrevia.classList.add('hidden');
                reporteContenido.innerHTML = '';
                destroyCharts(); // Asegurarse de destruir gráficos al cambiar de tipo

                // Limpiar campos de filtro y checkboxes (copiado de la lógica de Cancelar)
                document.querySelectorAll('input[type="checkbox"][name^="reportes"]').forEach(checkbox => { checkbox.checked = false; });
                document.querySelectorAll('#filtros-globales input, #filtros-globales select, #filtros-usuario input, #filtros-usuario select').forEach(input => {
                    if (input.tagName === 'SELECT') { input.selectedIndex = 0; } else { input.value = ''; }
                });
                Array.from(diasSemanaHorarioSelect.options).forEach(option => { option.selected = false; });
                usuarioSeleccionado = null; ruUsuarioInput.value = ''; usuarioInfoDiv.textContent = '';

                // Mostrar sección relevante y filtros, cargar datos si aplica
                if (tipoReporteSeleccionado === 'global') {
                    reporteGlobalSeleccion.classList.remove('hidden');
                    filtrosGlobales.classList.remove('hidden');
                    cargarLaboratorios();
                    cargarCategorias();
                    toggleReportesUsuarioCheckboxes(true);
                    toggleReportesEstadisticosCheckboxes(true);
                    diasSemanaHorarioSelect.parentElement.parentElement.classList.remove('hidden');
                } else if (tipoReporteSeleccionado === 'estadistico') {
                    reporteEstadisticoSeleccion.classList.remove('hidden');
                    filtrosGlobales.classList.remove('hidden');
                    cargarLaboratorios();
                    cargarCategorias();
                    toggleReportesUsuarioCheckboxes(true);
                    toggleReportesEstadisticosCheckboxes(false); // Habilitar solo los estadísticos
                    diasSemanaHorarioSelect.parentElement.parentElement.classList.add('hidden'); // Ocultar filtro de días
                } else if (tipoReporteSeleccionado === 'usuario') {
                    reporteUsuarioSeleccion.classList.remove('hidden');
                    filtrosUsuario.classList.remove('hidden');
                    toggleReportesUsuarioCheckboxes(true); // Deshabilitados hasta buscar RU
                    toggleReportesEstadisticosCheckboxes(true);
                    filtrosGlobales.classList.add('hidden'); // Ocultar filtros globales
                }

                // Deshabilitar botones generar/imprimir
                generarReporteBtn.disabled = true; generarReporteBtn.classList.add('bg-gray-500', 'cursor-not-allowed'); generarReporteBtn.classList.remove('bg-indigo-500', 'hover:bg-indigo-700', 'cursor-pointer');
                imprimirReporteBtn.disabled = true; imprimirReporteBtn.classList.add('bg-gray-500', 'cursor-not-allowed'); imprimirReporteBtn.classList.remove('bg-gray-700', 'hover:bg-gray-700', 'cursor-pointer');

                const mensajesExistentes = document.querySelectorAll('.mensaje-flotante');
                mensajesExistentes.forEach(msg => msg.remove());
            });
        });


    }); // Fin DOMContentLoaded

}); // Fin del listener principal DOMContentLoaded