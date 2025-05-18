document.addEventListener('DOMContentLoaded', () => {
    // --- Referencias a elementos del DOM ---
    const tipoReporteSeleccion = document.getElementById('tipo-reporte-seleccion');
    const reporteGlobalSeleccion = document.getElementById('reporte-global-seleccion');
    const reporteUsuarioSeleccion = document.getElementById('reporte-usuario-seleccion');
    const reporteEstadisticoSeleccion = document.getElementById('reporte-estadistico-seleccion');
    const filtrosGlobales = document.getElementById('filtros-globales'); // Este div ahora solo se usará para reportes globales
    const filtrosUsuario = document.getElementById('filtros-usuario');
    const vistaPrevia = document.getElementById('vista-previa');
    const reporteContenido = document.getElementById('reporte-contenido');
    const generarReporteBtn = document.getElementById('generar-reporte');
    const cancelarReporteBtn = document.getElementById('cancelar-reporte');
    const imprimirReporteBtn = document.getElementById('imprimir-reporte'); // Variable CORRECTA
    const tipoReporteBtns = document.querySelectorAll('.tipo-reporte-btn');
    const ruUsuarioInput = document.getElementById('ru-usuario');
    const usuarioInfoDiv = document.getElementById('usuario-info');
    const reportesUsuarioCheckboxes = document.querySelectorAll('input[name="reportesUsuario"]');
    const reportesGlobalesCheckboxes = document.querySelectorAll('input[name="reportesGlobales"]');
    const reportesEstadisticosCheckboxes = document.querySelectorAll('input[name="reportesEstadisticos"]');

    // Referencias a los NUEVOS divs de filtros específicos para reportes estadísticos
    const filtrosEquiposEstadisticoDiv = document.getElementById('filtros-equipos-mas-prestados-grafico');
    const filtrosUsuariosEstadisticoDiv = document.getElementById('filtros-usuarios-mas-prestaron-grafico');


    // Referencias a los campos de filtro globales (ahora también usados en secciones específicas)
    const fechaInicioGlobalInput = document.getElementById('fecha-inicio-global');
    const fechaFinGlobalInput = document.getElementById('fecha-fin-global');
    const laboratorioGlobalSelect = document.getElementById('laboratorio-global');
    const categoriaGlobalSelect = document.getElementById('categoria-global');
    const diasSemanaHorarioSelect = document.getElementById('dias-semana-horario');

    // Referencias a los campos de filtro específicos de reportes de usuario
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
    let activeCharts = {}; // Variable para almacenar instancias de Chart.js
    let printImages = {}; // Variable para imágenes de gráficos para impresión


    // --- Funciones de Utilidad ---

    // Función para preparar los gráficos para impresión (convertir canvas a imagen)
    function prepararParaImpresion() {
        printImages = {};
        if (tipoReporteSeleccionado === 'estadistico') {
            for (const reporteKey in activeCharts) {
                const chart = activeCharts[reporteKey];
                if (chart && chart.canvas) {
                    try {
                        const imageUrl = chart.canvas.toDataURL('image/png');
                        const imgElement = document.createElement('img');
                        imgElement.src = imageUrl;
                        imgElement.alt = reporteKey + " Chart";
                        imgElement.classList.add('print-chart-image');

                        imgElement.style.maxWidth = '100%';
                        imgElement.style.height = 'auto';

                        printImages[reporteKey] = { img: imgElement, canvas: chart.canvas };
                    } catch (e) { console.error("Error al convertir canvas a imagen para impresión:", reporteKey, e); }
                }
            }
        }
    }

    // Función para mostrar las imágenes (y ocultar canvas) justo antes de imprimir
    function mostrarImagenesParaImpresion() {
        for (const reporteKey in printImages) {
            const item = printImages[reporteKey];
            if (item.img && item.canvas) {
                const canvasParent = item.canvas.parentElement;
                if (canvasParent) {
                    canvasParent.appendChild(item.img);
                }
            }
        }
    }

    // Función para restaurar los canvas (y ocultar imágenes) después de imprimir
    function restaurarDespuesDeImpresion() {
        for (const reporteKey in printImages) {
            const item = printImages[reporteKey];
            if (item.img && item.canvas) {
                if (item.img.parentElement) {
                    item.img.parentElement.removeChild(item.img);
                }
            }
        }
        printImages = {};
    }


    // Ocultar todos los formularios y secciones relevantes
    function ocultarFormularios() {
        // Es crucial que todos estos elementos existan en el HTML con los IDs correctos
        reporteGlobalSeleccion.classList.add('hidden');
        reporteUsuarioSeleccion.classList.add('hidden');
        reporteEstadisticoSeleccion.classList.add('hidden');
        filtrosGlobales.classList.add('hidden'); // Ocultar filtros globales generales
        filtrosUsuario.classList.add('hidden'); // Ocultar filtros de usuario generales
        // Ocultar también las nuevas secciones de filtros específicos estadísticos
        filtrosEquiposEstadisticoDiv.classList.add('hidden');
        filtrosUsuariosEstadisticoDiv.classList.add('hidden');

        vistaPrevia.classList.add('hidden');
        filtrosHistorialPrestamosDiv.classList.add('hidden');
        filtrosSancionesDiv.classList.add('hidden');
    }

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
        reportesUsuarioCheckboxes.forEach(checkbox => { checkbox.disabled = disabled; if (disabled) { checkbox.checked = false; } });
        if (disabled) { // Si se deshabilitan, ocultar filtros asociados y limpiar sus valores
            filtrosHistorialPrestamosDiv.classList.add('hidden');
            filtrosSancionesDiv.classList.add('hidden');
            filtrosHistorialPrestamosDiv.querySelectorAll('input, select').forEach(input => input.value = '');
            filtrosSancionesDiv.querySelectorAll('input, select').forEach(input => input.value = '');
        }
    }

    // Función para habilitar/deshabilitar los checkboxes de reportesEstadisticos
    function toggleReportesEstadisticosCheckboxes(disabled) {
        reportesEstadisticosCheckboxes.forEach(checkbox => { checkbox.disabled = disabled; if (disabled) { checkbox.checked = false; } });
        // Al deshabilitar, también ocultamos sus secciones de filtro específicas y limpiamos valores
        if(disabled) {
            filtrosEquiposEstadisticoDiv.classList.add('hidden');
            filtrosUsuariosEstadisticoDiv.classList.add('hidden');
            // Limpiar campos en los nuevos divs de filtros específicos estadísticos
            filtrosEquiposEstadisticoDiv.querySelectorAll('input, select').forEach(input => { if (input.tagName === 'SELECT') { input.selectedIndex = 0; } else { input.value = ''; } });
            filtrosUsuariosEstadisticoDiv.querySelectorAll('input, select').forEach(input => { if (input.tagName === 'SELECT') { input.selectedIndex = 0; } else { input.value = ''; } });
        }
    }

    // Función para cargar los laboratorios en los selects relevantes
    function cargarLaboratorios() {
        fetch('/reportes/laboratorios')
            .then(response => {
                if (!response.ok) { return response.text().then(text => { let errorMsg = `Error al cargar laboratorios (${response.status}): `; try { const errorJson = JSON.parse(text); errorMsg += errorJson.message || errorJson.error || text; } catch(e) { errorMsg += text; } throw new Error(errorMsg); }); }
                return response.json(); })
            .then(data => {
                // Seleccionar TODOS los selects de laboratorio que necesiten ser poblados
                const laboratorioSelects = document.querySelectorAll('#laboratorio-global, #laboratorio-equipos-est, #laboratorio-usuarios-est');
                laboratorioSelects.forEach(selectElement => {
                    selectElement.innerHTML = '<option value="">Todos los Laboratorios</option>';
                    if (Array.isArray(data)) { data.forEach(laboratorio => { const option = document.createElement('option'); option.value = laboratorio.idLaboratorio; option.textContent = laboratorio.nombre; selectElement.appendChild(option); }); }
                    else { console.error("Datos de laboratorios recibidos no es un array:", data); mostrarMensaje("Error: Formato de datos de laboratorios incorrecto.", 'error'); selectElement.innerHTML = '<option value="">Error al cargar laboratorios</option>'; }
                    selectElement.disabled = false; // Habilitar después de cargar (o si hubo error, mostrar error)
                });
            })
            .catch(error => {
                console.error('Error al cargar laboratorios:', error); mostrarMensaje('Error al cargar laboratorios. ' + error.message, 'error');
                const laboratorioSelects = document.querySelectorAll('#laboratorio-global, #laboratorio-equipos-est, #laboratorio-usuarios-est');
                laboratorioSelects.forEach(selectElement => { selectElement.innerHTML = '<option value="">Error al cargar</option>'; selectElement.disabled = true; });
            });
    }

    // Función para cargar las categorías en los selects relevantes (o filtradas por laboratorio)
    function cargarCategorias(laboratorioId = null) {
        const url = laboratorioId ? `/reportes/categorias?laboratorioId=${laboratorioId}` : '/reportes/categorias';
        fetch(url)
            .then(response => {
                if (!response.ok) { return response.text().then(text => { let errorMsg = `Error al cargar categorías (${response.status}): `; try { const errorJson = JSON.parse(text); errorMsg += errorJson.message || errorJson.error || text; } catch(e) { errorMsg += text; } throw new Error(errorMsg); }); }
                return response.json(); })
            .then(data => {
                // Seleccionar TODOS los selects de categoría que necesiten ser poblados
                const categoriaSelects = document.querySelectorAll('#categoria-global, #categoria-equipos-est, #categoria-usuarios-est');
                categoriaSelects.forEach(selectElement => {
                    selectElement.innerHTML = '<option value="">Todas las Categorías</option>';
                    if (Array.isArray(data)) { data.forEach(categoria => { const option = document.createElement('option'); option.value = categoria.idCategoria; option.textContent = categoria.nombreCategoria; selectElement.appendChild(option); }); }
                    else { console.error("Datos de categorías recibidos no es un array:", data); mostrarMensaje("Error: Formato de datos de categorías incorrecto.", 'error'); selectElement.innerHTML = '<option value="">Error al cargar categorías</option>'; }
                    selectElement.disabled = false; // Habilitar
                });
            })
            .catch(error => {
                console.error('Error al cargar categorías:', error); mostrarMensaje('Error al cargar categorías. ' + error.message, 'error');
                const categoriaSelects = document.querySelectorAll('#categoria-global, #categoria-equipos-est, #categoria-usuarios-est');
                categoriaSelects.forEach(selectElement => { selectElement.innerHTML = '<option value="">Error al cargar</option>'; selectElement.disabled = true; });
            });
    }

    // Función para destruir gráficos existentes
    function destroyCharts() {
        for (const chartId in activeCharts) { if (activeCharts[chartId]) { activeCharts[chartId].destroy(); activeCharts[chartId] = null; } } activeCharts = {};
    }

    // Función para mostrar la vista previa en el HTML (maneja tablas y gráficos)
    function mostrarVistaPrevia(data) {
        let html = ''; destroyCharts();
        const userReportOrder = ["infoUsuario", "historialPrestamosUsuario", "sancionesUsuario"];
        const globalReportOrder = ["equiposMasPrestados", "usuariosMasPrestaron", "prestamosPorFecha", "mantenimientos", "prestamosFechaFecha", "administradoresPrestamo", "sancionesActivasInactivas", "horario-laboratorio"];
        const estadisticoReportOrder = ["equiposMasPrestados", "usuariosMasPrestaron"]; // Claves para gráficos

        const reportKeysToRender = [];
        if (tipoReporteSeleccionado === 'usuario') { userReportOrder.forEach(key => { if (data.hasOwnProperty(key)) { reportKeysToRender.push(key); } }); }
        else if (tipoReporteSeleccionado === 'global') { globalReportOrder.forEach(key => { if (data.hasOwnProperty(key)) { reportKeysToRender.push(key); } }); }
        else if (tipoReporteSeleccionado === 'estadistico') { estadisticoReportOrder.forEach(key => { if (data.hasOwnProperty(key) && reportesSeleccionados.includes(key)) { reportKeysToRender.push(key); } }); }

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


        reportKeysToRender.forEach(reporteKey => {
            const reporte = data[reporteKey];
            if (reporte) {
                html += `<h3 class="text-lg font-semibold text-gray-700 mb-2">${reporte.titulo}</h3>`;
                console.log(`[DEBUG] Procesando reporteKey: ${reporteKey}, Tipo: ${reporte.tipo}`);

                // Renderizado para reportes estadísticos (agrega un canvas)
                if (tipoReporteSeleccionado === 'estadistico' && (reporteKey === 'equiposMasPrestados' || reporteKey === 'usuariosMasPrestaron')) {
                    html += `<div class="chart-container"><canvas id="chart-${reporteKey}"></canvas></div>`;

                } else if (reporte.tipo === 'tabla') { // Renderizado como Tabla
                    const keys = reporteKeysHTML[reporteKey];
                    if (!keys || !reporte.cabecera || !Array.isArray(reporte.cabecera) || reporte.cabecera.length === 0) {
                        html += `<p class="text-red-500">Error: Falta información para la tabla (${reporteKey}).</p>`;
                    } else {
                        html += '<div class="overflow-x-auto"><table class="min-w-full leading-normal shadow-md rounded-lg overflow-hidden"><thead class="bg-gray-200 text-gray-700"><tr>';
                        reporte.cabecera.forEach(headerText => { html += `<th class="px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold uppercase tracking-wider">${headerText}</th>`; });
                        html += '</tr></thead><tbody class="bg-white">';
                        if (reporte.datos && Array.isArray(reporte.datos) && reporte.datos.length > 0) {
                            reporte.datos.forEach(fila => {
                                html += '<tr>';
                                keys.forEach(key => {
                                    const dataValue = fila[key]; let displayValue = dataValue; let cellClasses = "px-5 py-5 border-b border-gray-200 text-sm";
                                    if (reporteKey === "horario-laboratorio" && key === "ocupado") { displayValue = dataValue ? 'Ocupado' : 'Disponible'; cellClasses += dataValue ? ' text-red-500 font-bold' : ' text-green-500 font-bold'; }
                                    else if (dataValue instanceof Date) { displayValue = dataValue.toLocaleString(); }
                                    else if (typeof dataValue === 'string') {
                                        if (dataValue.match(/^\d{4}-\d{2}-\d{2}(T.*)?$/)) {
                                            try { const date = new Date(dataValue); if (!isNaN(date.getTime())) { displayValue = date.toLocaleDateString(); if(dataValue.includes('T')) displayValue += ' ' + date.toLocaleTimeString(); } else { displayValue = dataValue; } } catch (e) { displayValue = dataValue; console.error("Error parsing date string:", dataValue, e); }
                                        } else if (dataValue.match(/^\d{2}:\d{2}(:\d{2})?$/)) { displayValue = dataValue; }
                                        else { displayValue = dataValue; }
                                    }
                                    else { displayValue = dataValue !== null && dataValue !== undefined ? dataValue : ''; }

                                    html += `<td class="${cellClasses}">${displayValue}</td>`;
                                });
                                html += '</tr>';
                            });
                        } else {
                            const colSpan = reporte.cabecera ? reporte.cabecera.length : 1;
                            html += `<tr><td class="px-5 py-5 border-b border-gray-200 text-sm text-center italic" colspan="${colSpan}">No se encontraron datos para este reporte.</td></tr>`;
                        }
                        html += '</tbody></table></div>';
                    }
                } else if (reporte.tipo === 'lista') {
                    if (reporte.datos && Array.isArray(reporte.datos) && reporte.datos.length > 0) { html += '<ul class="list-disc list-inside">'; reporte.datos.forEach(item => { html += `<li>${item}</li>`; }); html += '</ul>'; }
                    else { html += '<p class="text-gray-700 italic">No se encontraron datos para este reporte.</p>'; }
                } else if (reporte.tipo === 'texto' || reporte.tipo === 'info-usuario') {
                    if (reporte.datos) {
                        if (typeof reporte.datos === 'string' && reporte.datos.trim() !== '') { html += `<p class="text-gray-700 whitespace-pre-line">${reporte.datos}</p>`; }
                        else if (typeof reporte.datos === 'object' && reporte.tipo === 'info-usuario') {
                            let infoHtml = '<div class="grid grid-cols-1 md:grid-cols-1 gap-2 text-sm">';
                            const infoKeys = ["ru", "nombre", "apellido", "ci", "tipoUsuario", "carrera", "telefono", "correo", "materia", "paralelo", "semestre"];
                            infoKeys.forEach(key => { if(reporte.datos.hasOwnProperty(key) && reporte.datos[key] !== null){ let label = key.replace(/([A-Z])/g, ' $1').trim(); label = label.charAt(0).toUpperCase() + label.slice(1); infoHtml += `<div><span class="font-semibold">${label}:</span> ${reporte.datos[key]}</div>`; } });
                            infoHtml += '</div>'; html += infoHtml;
                        } else { html += '<p class="text-gray-700 italic">No se encontró información.</p>'; }
                    } else { html += '<p class="text-gray-700 italic">No se encontró información.</p>'; }
                } else { console.warn(`Tipo de reporte desconocido o condición no cumplida para ${reporteKey}.`); }
                if (reporteKey !== reportKeysToRender[reportKeysToRender.length - 1]) { html += '<hr class="my-4 border-gray-300">'; }
            } else { console.warn(`Reporte object es null/undefined para clave: ${reporteKey}`); }
        });

        if (html === '') { html = '<p class="text-gray-500 italic">No se seleccionaron reportes válidos o no hay datos.</p>'; }
        reporteContenido.innerHTML = html;

        if (tipoReporteSeleccionado === 'estadistico') {
            reportKeysToRender.forEach(reporteKey => {
                const reporte = data[reporteKey];
                if (reporte && (reporteKey === 'equiposMasPrestados' || reporteKey === 'usuariosMasPrestaron')) {
                    const canvasId = `chart-${reporteKey}`; const ctx = document.getElementById(canvasId);
                    if (ctx) {
                        if (reporte.datos && Array.isArray(reporte.datos) && reporte.datos.length > 0) {
                            const labels = reporte.datos.map(item => { if (reporteKey === 'usuariosMasPrestaron') { return `${item.nombre || ''} ${item.apellido || ''}`.trim(); } else { return item.nombre || 'Equipo Desconocido'; } });
                            const values = reporte.datos.map(item => { if (reporteKey === 'usuariosMasPrestaron') { return item.cantidadPrestamos || 0; } else { return item.cantidadPrestada || 0; } });
                            let chartTitle = reporte.titulo;
                            const chartConfig = { type: 'bar', data: { labels: labels, datasets: [{ label: 'Cantidad', data: values, backgroundColor: [ 'rgba(54, 162, 235, 0.6)', 'rgba(255, 99, 132, 0.6)', 'rgba(255, 159, 64, 0.6)', 'rgba(75, 192, 192, 0.6)', 'rgba(153, 102, 255, 0.6)', 'rgba(201, 203, 207, 0.6)' ], borderColor: [ 'rgba(54, 162, 235, 1)', 'rgba(255, 99, 132, 1)', 'rgba(255, 159, 64, 1)', 'rgba(75, 192, 192, 1)', 'rgba(153, 102, 255, 1)', 'rgba(201, 203, 207, 1)' ], borderWidth: 1 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, title: { display: true, text: chartTitle } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1, callback: function(value) { if (value % 1 === 0) { return value; } } } } } } };
                            activeCharts[reporteKey] = new Chart(ctx, chartConfig);
                        } else { const chartContainer = ctx.parentElement; if (chartContainer) { ctx.remove(); chartContainer.innerHTML = `<p class="text-gray-700 italic text-center">No se encontraron datos para este reporte estadístico.</p>`; } }
                    } else { console.warn(`Contexto de canvas no encontrado para ID: ${canvasId}.`); }
                }
            });
        }
    }

    // --- Funciones de Lógica de Reporte ---

    // Función para obtener los reportes seleccionados y filtros
    function obtenerReportesSeleccionadosYFiltros() {
        reportesSeleccionados = []; filtros = {}; // Reiniciar

        if (tipoReporteSeleccionado === 'global') {
            reportesGlobalesCheckboxes.forEach(checkbox => { if (checkbox.checked) { reportesSeleccionados.push(checkbox.value); } });
            // Recolectar filtros globales SOLO si la sección global está visible
            if (!filtrosGlobales.classList.contains('hidden')) {
                filtros = {
                    fechaInicio: fechaInicioGlobalInput.value || null, fechaFin: fechaFinGlobalInput.value || null,
                    laboratorio: laboratorioGlobalSelect.value || null, categoria: categoriaGlobalSelect.value || null
                };
                if (diasSemanaHorarioSelect && !diasSemanaHorarioSelect.parentElement.parentElement.classList.contains('hidden')) { // Agregada verificación diasSemanaHorarioSelect
                    const selectedDays = Array.from(diasSemanaHorarioSelect.selectedOptions).map(option => option.value);
                    if (selectedDays.length > 0) { filtros.diasSemana = selectedDays; }
                }
            }
        } else if (tipoReporteSeleccionado === 'estadistico') {
            reportesEstadisticosCheckboxes.forEach(checkbox => { if (checkbox.checked) { reportesSeleccionados.push(checkbox.value); } });
            // Recolectar filtros de secciones ESPECÍFICAS para reportes estadísticos si están visibles
            // Usaremos claves de filtro estándar (fechaInicio, fechaFin, etc.)
            reportesSeleccionados.forEach(reporteKey => {
                let filtroDiv = null;
                let fechaInicioInput = null;
                let fechaFinInput = null;
                let laboratorioSelect = null;
                let categoriaSelect = null;

                if (reporteKey === 'equiposMasPrestados') {
                    filtroDiv = filtrosEquiposEstadisticoDiv;
                    fechaInicioInput = document.getElementById('fecha-inicio-equipos-est');
                    fechaFinInput = document.getElementById('fecha-fin-equipos-est');
                    laboratorioSelect = document.getElementById('laboratorio-equipos-est');
                    categoriaSelect = document.getElementById('categoria-equipos-est');
                } else if (reporteKey === 'usuariosMasPrestaron') {
                    filtroDiv = filtrosUsuariosEstadisticoDiv;
                    fechaInicioInput = document.getElementById('fecha-inicio-usuarios-est');
                    fechaFinInput = document.getElementById('fecha-fin-usuarios-est');
                    laboratorioSelect = document.getElementById('laboratorio-usuarios-est');
                    categoriaSelect = document.getElementById('categoria-usuarios-est');
                }

                if (filtroDiv && !filtroDiv.classList.contains('hidden')) {
                    // --- AÑADIR LOS FILTROS USANDO CLAVES ESTÁNDAR (SIN PREFIJO) ---
                    // Nota: Estamos asumiendo que todos los filtros específicos estadísticos
                    // usan las mismas claves (fechaInicio, fechaFin, laboratorio, categoria).
                    // Si un reporte estadístico tuviera un filtro único (ej. "tipoGrafico"),
                    // tendrías que añadir esa clave aquí también o manejarla de otra forma.
                    if (fechaInicioInput) filtros['fechaInicio'] = fechaInicioInput.value || null;
                    if (fechaFinInput) filtros['fechaFin'] = fechaFinInput.value || null;
                    if (laboratorioSelect) filtros['laboratorio'] = laboratorioSelect.value || null;
                    if (categoriaSelect) filtros['categoria'] = categoriaSelect.value || null;
                    // -------------------------------------------------------------
                }
            });


        } else if (tipoReporteSeleccionado === 'usuario') {
            if (usuarioSeleccionado) {
                reportesUsuarioCheckboxes.forEach(checkbox => { if (checkbox.checked) { reportesSeleccionados.push(checkbox.value); } });
                // Asegurarse de que filtrosUsuario exista y no esté oculto si es necesario para recolectar filtros
                if (filtrosUsuario && !filtrosUsuario.classList.contains('hidden')) { // Agregada verificación filtrosUsuario
                    if (!filtrosHistorialPrestamosDiv.classList.contains('hidden')) { filtros.estadoPrestamoUsuario = document.getElementById('estado-prestamo').value || null; filtros.fechaInicioPrestamosUsuario = document.getElementById('fecha-inicio-prestamos').value || null; filtros.fechaFinPrestamosUsuario = document.getElementById('fecha-fin-prestamos').value || null; }
                    if (!filtrosSancionesDiv.classList.contains('hidden')) { filtros.estadoSancionUsuario = document.getElementById('estado-sancion').value || null; filtros.fechaInicioSancionesUsuario = document.getElementById('fecha-inicio-sanciones').value || null; filtros.fechaFinSancionesUsuario = document.getElementById('fecha-fin-sanciones').value || null; }
                }
            }
        }

        // Eliminar filtros con valor null o vacío
        for (const key in filtros) {
            if (filtros[key] === null || filtros[key] === '') {
                delete filtros[key];
            }
        }

        console.log("Reportes seleccionados:", reportesSeleccionados); console.log("Filtros recolectados:", filtros);
    }

    // Función para validar la selección de reportes y habilitar/deshabilitar el botón "Generar Reporte"
    function validarYToggleGenerarBoton() {
        obtenerReportesSeleccionadosYFiltros();
        let isValid = false;
        if (tipoReporteSeleccionado === 'global') { isValid = reportesSeleccionados.length > 0; }
        else if (tipoReporteSeleccionado === 'estadistico') { isValid = reportesSeleccionados.length > 0; }
        else if (tipoReporteSeleccionado === 'usuario') { isValid = usuarioSeleccionado !== null && reportesSeleccionados.length > 0; }
        if (isValid) { generarReporteBtn.disabled = false; generarReporteBtn.classList.remove('bg-gray-500', 'cursor-not-allowed'); generarReporteBtn.classList.add('bg-indigo-500', 'hover:bg-indigo-700', 'cursor-pointer'); }
        else { generarReporteBtn.disabled = true; generarReporteBtn.classList.add('bg-gray-500', 'cursor-not-allowed'); generarReporteBtn.classList.remove('bg-indigo-500', 'hover:bg-indigo-700', 'cursor-pointer'); }
        imprimirReporteBtn.disabled = true; imprimirReporteBtn.classList.add('bg-gray-500', 'cursor-not-allowed'); imprimirReporteBtn.classList.remove('bg-gray-700', 'hover:bg-gray-700', 'cursor-pointer');
        console.log("Validación:", isValid, "Reportes:", reportesSeleccionados, "Usuario seleccionado:", usuarioSeleccionado, "Tipo:", tipoReporteSeleccionado);
        return isValid;
    }

    // Función para generar la vista previa del reporte (AJAX)
    function generarVistaPrevia() {
        obtenerReportesSeleccionadosYFiltros(); const validationResult = validarYToggleGenerarBoton();
        if (!validationResult) { mostrarMensaje('Por favor, revise su selección de reportes y filtros.', 'error'); return; }
        vistaPrevia.classList.remove('hidden'); reporteContenido.innerHTML = '<p class="text-gray-500 italic">Generando vista previa...</p>'; destroyCharts();
        imprimirReporteBtn.disabled = true; imprimirReporteBtn.classList.add('bg-gray-500', 'cursor-not-allowed'); imprimirReporteBtn.classList.remove('bg-gray-700', 'hover:bg-gray-700', 'cursor-pointer');
        const dataToSend = { reportes: reportesSeleccionados, filtros: filtros, usuarioRu: tipoReporteSeleccionado === 'usuario' && usuarioSeleccionado ? usuarioSeleccionado.ru : null };
        console.log("Enviando solicitud al backend:", dataToSend);
        fetch('/reportes/generarReporte', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dataToSend) })
            .then(response => { if (!response.ok) { return response.text().then(text => { let errorMsg = `Error del servidor (${response.status}): `; try { const errorJson = JSON.parse(text); errorMsg += errorJson.message || errorJson.error || text; } catch(e) { errorMsg += text; } throw new Error(errorMsg); }); } return response.json(); })
            .then(data => {
                console.log("Datos recibidos del backend:", data); reportesData = data; mostrarVistaPrevia(data);
                mostrarMensaje('Vista previa generada correctamente.', 'success');
                imprimirReporteBtn.disabled = false; imprimirReporteBtn.classList.remove('bg-gray-500', 'cursor-not-allowed'); imprimirReporteBtn.classList.add('bg-gray-700', 'hover:bg-gray-700', 'cursor-pointer'); // CORRECTO: imprimirReporteBtn
            })
            .catch(error => {
                console.error('Error al generar vista previa:', error); reporteContenido.innerHTML = `<p class="text-red-500">Error al generar reporte: ${error.message}</p>`;
                mostrarMensaje('Error al generar el reporte. Por favor, inténtelo de nuevo.', 'error');
                imprimirReporteBtn.disabled = true; imprimirReporteBtn.classList.add('bg-gray-500', 'cursor-not-allowed'); imprimirReporteBtn.classList.remove('bg-gray-700', 'hover:bg-gray-700', 'cursor-pointer'); // CORRECTO: imprimirReporteBtn
            });
    }


    // --- Adjunción ÚNICA de Event Listeners al Cargar el DOM ---

    // Event listener para los botones de tipo de reporte (Global/Estadistico/Usuario)
    tipoReporteBtns.forEach(button => {
        button.addEventListener('click', function() {
            tipoReporteSeleccionado = this.dataset.tipo;
            tipoReporteBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            ocultarFormularios(); // Oculta TODAS las secciones de selección y filtro
            vistaPrevia.classList.add('hidden');
            reporteContenido.innerHTML = '';
            destroyCharts();

            // Limpiar campos de filtro (todos, incluyendo los nuevos específicos estadísticos) y checkboxes
            document.querySelectorAll('input[type="checkbox"][name^="reportes"]').forEach(checkbox => { checkbox.checked = false; });
            document.querySelectorAll('#filtros-globales input, #filtros-globales select, #filtros-usuario input, #filtros-usuario select, #filtros-equipos-mas-prestados-grafico input, #filtros-equipos-mas-prestados-grafico select, #filtros-usuarios-mas-prestaron-grafico input, #filtros-usuarios-mas-prestaron-grafico select').forEach(input => {
                if (input.tagName === 'SELECT') { input.selectedIndex = 0; } else { input.value = ''; }
            });
            Array.from(diasSemanaHorarioSelect ? diasSemanaHorarioSelect.options : []).forEach(option => { option.selected = false; }); // Añadida verificación diasSemanaHorarioSelect
            usuarioSeleccionado = null; ruUsuarioInput.value = ''; usuarioInfoDiv.textContent = '';

            // Mostrar sección relevante y sus filtros/elementos asociados
            if (tipoReporteSeleccionado === 'global') {
                reporteGlobalSeleccion.classList.remove('hidden');
                filtrosGlobales.classList.remove('hidden'); // Mostrar el div de filtros globales general
                cargarLaboratorios(); // Cargar selects globales Y ESTADÍSTICOS
                cargarCategorias();   // Cargar selects globales Y ESTADÍSTICOS
                toggleReportesUsuarioCheckboxes(true); // Deshabilitar checkboxes de usuario
                toggleReportesEstadisticosCheckboxes(true); // Deshabilitar checkboxes estadísticos
                if (diasSemanaHorarioSelect && diasSemanaHorarioSelect.parentElement) { // Verificar que existe antes de intentar acceder al padre
                    diasSemanaHorarioSelect.parentElement.parentElement.classList.remove('hidden'); // Mostrar filtro de días si existe
                }

            } else if (tipoReporteSeleccionado === 'estadistico') {
                reporteEstadisticoSeleccion.classList.remove('hidden'); // Mostrar sección de selección estadística
                filtrosGlobales.classList.add('hidden'); // OCULTAR el div de filtros globales general
                cargarLaboratorios(); // Cargar selects globales Y ESTADÍSTICOS
                cargarCategorias();   // Cargar selects globales Y ESTADÍSTICOS
                toggleReportesUsuarioCheckboxes(true); // Deshabilitar checkboxes de usuario
                toggleReportesEstadisticosCheckboxes(false); // Habilitar checkboxes estadísticos

                // Ocultar filtro de días si existe (solo aplica a algunos reportes globales)
                if (diasSemanaHorarioSelect && diasSemanaHorarioSelect.parentElement) {
                    diasSemanaHorarioSelect.parentElement.parentElement.classList.add('hidden');
                }


            } else if (tipoReporteSeleccionado === 'usuario') {
                reporteUsuarioSeleccion.classList.remove('hidden');
                filtrosUsuario.classList.remove('hidden'); // Mostrar filtros de usuario general
                toggleReportesUsuarioCheckboxes(true); // Deshabilitados hasta buscar RU
                toggleReportesEstadisticosCheckboxes(true);
                filtrosGlobales.classList.add('hidden'); // Ocultar filtros globales general
                // Ocultar filtro de días si existe
                if (diasSemanaHorarioSelect && diasSemanaHorarioSelect.parentElement) {
                    diasSemanaHorarioSelect.parentElement.parentElement.classList.add('hidden');
                }
            }

            // Deshabilitar botones generar/imprimir
            generarReporteBtn.disabled = true; generarReporteBtn.classList.add('bg-gray-500', 'cursor-not-allowed'); generarReporteBtn.classList.remove('bg-indigo-500', 'hover:bg-indigo-700', 'cursor-pointer');
            imprimirReporteBtn.disabled = true; imprimirReporteBtn.classList.add('bg-gray-500', 'cursor-not-allowed'); imprimirReporteBtn.classList.remove('bg-gray-700', 'hover:bg-gray-700', 'cursor-pointer');

            const mensajesExistentes = document.querySelectorAll('.mensaje-flotante'); mensajesExistentes.forEach(msg => msg.remove());
        });
    });

    // Event listener para el botón Generar Reporte (Asegurarse de que solo esté aquí)
    generarReporteBtn.addEventListener('click', generarVistaPrevia);

    // Event listener para el botón Imprimir Reporte (Asegurarse de que solo esté aquí)
    imprimirReporteBtn.addEventListener('click', () => {
        if (Object.keys(reportesData).length === 0) {
            mostrarMensaje('Por favor, genere primero la vista previa del reporte.', 'error');
            return;
        }
        // Lógica para preparar gráficos como imágenes ANTES de imprimir
        prepararParaImpresion();
        mostrarImagenesParaImpresion();

        // Usamos setTimeout 0 para permitir que el DOM se actualice antes de imprimir
        setTimeout(() => {
            console.log(">>> Llamando a window.print() <<<"); // Log de depuración
            window.print();
            // Restaurar DOM después de imprimir (window.print() es bloqueante)
            restaurarDespuesDeImpresion();
        }, 0);
    });

    // Event listener para el botón Cancelar Reporte (Asegurarse de que solo esté aquí)
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
        destroyCharts();

        // Limpiar campos de filtro (todos) y checkboxes (todos)
        document.querySelectorAll('input[type="checkbox"][name^="reportes"]').forEach(checkbox => { checkbox.checked = false; });
        document.querySelectorAll('#filtros-globales input, #filtros-globales select, #filtros-usuario input, #filtros-usuario select, #filtros-equipos-mas-prestados-grafico input, #filtros-equipos-mas-prestados-grafico select, #filtros-usuarios-mas-prestaron-grafico input, #filtros-usuarios-mas-prestaron-grafico select').forEach(input => {
            if (input.tagName === 'SELECT') { input.selectedIndex = 0; } else { input.value = ''; }
        });
        Array.from(diasSemanaHorarioSelect ? diasSemanaHorarioSelect.options : []).forEach(option => { option.selected = false; }); // Añadida verificación
        toggleReportesUsuarioCheckboxes(true);
        toggleReportesEstadisticosCheckboxes(true);

        const mensajesExistentes = document.querySelectorAll('.mensaje-flotante'); mensajesExistentes.forEach(msg => msg.remove());
    });


    // Event listener para el cambio en el selector de laboratorio global para filtrar categorías
    // (Este listener solo afecta al selector #categoria-global. Si necesitas filtrar categorías
    // en los selectores de las secciones estadísticas específicas, necesitarías listeners adicionales
    // para cada uno, o modificar cargarCategorias para manejarlo)
    if(laboratorioGlobalSelect) { // Verificar que el elemento existe
        laboratorioGlobalSelect.addEventListener('change', function() {
            const selectedLabId = this.value;
            if(categoriaGlobalSelect) { // Verificar que el elemento existe
                categoriaGlobalSelect.innerHTML = '<option value="">Cargando...</option>';
                categoriaGlobalSelect.disabled = true;
            }
            if (selectedLabId) { cargarCategorias(parseInt(selectedLabId, 10)); } else { cargarCategorias(); }
        });
    }


    // --- Event listeners para los checkboxes de reportes ---

    // Event listeners para los checkboxes de reportes globales para validar
    reportesGlobalesCheckboxes.forEach(checkbox => { checkbox.addEventListener('change', validarYToggleGenerarBoton); });

    // Event listeners para los checkboxes de reportes estadísticos (para mostrar/ocultar sus filtros específicos)
    reportesEstadisticosCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const reporteKey = this.value; // 'equiposMasPrestados' o 'usuariosMasPrestaron'
            let filtroDiv = null;

            if (reporteKey === 'equiposMasPrestados') {
                filtroDiv = filtrosEquiposEstadisticoDiv;
            } else if (reporteKey === 'usuariosMasPrestaron') {
                filtroDiv = filtrosUsuariosEstadisticoDiv;
            }

            if (filtroDiv) {
                if (this.checked) {
                    filtroDiv.classList.remove('hidden'); // Mostrar sección de filtro específica
                    // Opcional: Limpiar los campos de este filtro específico al mostrarlo
                    filtroDiv.querySelectorAll('input, select').forEach(input => { if (input.tagName === 'SELECT') { input.selectedIndex = 0; } else { input.value = ''; } });
                    // Opcional: Si necesitas cargar laboratorios/categorias solo en los selects de este div
                    // puedes llamar aquí a cargarLaboratorios() y cargarCategorias(). Pero la función
                    // cargarLaboratorios/Categorias actual puebla todos los selects relevantes,
                    // así que si se llama al seleccionar el tipo estadístico, ya deberían estar cargados.

                } else {
                    filtroDiv.classList.add('hidden'); // Ocultar sección de filtro específica
                    // Limpiar los campos al ocultar
                    filtroDiv.querySelectorAll('input, select').forEach(input => {
                        if (input.tagName === 'SELECT') { input.selectedIndex = 0; } else { input.value = ''; }
                    });
                }
            }
            validarYToggleGenerarBoton(); // Validar después de cambiar la selección
        });
    });

    // Event listeners para checkboxes de reportes de usuario (para mostrar/ocultar filtros específicos y validar)
    if(historialPrestamosUsuarioCheckbox) { // Verificar que el elemento existe
        historialPrestamosUsuarioCheckbox.addEventListener('change', function() {
            if (this.checked) { if(filtrosHistorialPrestamosDiv) filtrosHistorialPrestamosDiv.classList.remove('hidden'); }
            else { if(filtrosHistorialPrestamosDiv) filtrosHistorialPrestamosDiv.classList.add('hidden'); filtrosHistorialPrestamosDiv.querySelectorAll('input, select').forEach(input => { if (input.tagName === 'SELECT') { input.selectedIndex = 0; } else { input.value = ''; } }); }
            validarYToggleGenerarBoton();
        });
    }

    if(sancionesUsuarioCheckbox) { // Verificar que el elemento existe
        sancionesUsuarioCheckbox.addEventListener('change', function() {
            if (this.checked) { if(filtrosSancionesDiv) filtrosSancionesDiv.classList.remove('hidden'); }
            else { if(filtrosSancionesDiv) filtrosSancionesDiv.classList.add('hidden'); filtrosSancionesDiv.querySelectorAll('input, select').forEach(input => { if (input.tagName === 'SELECT') { input.selectedIndex = 0; } else { input.value = ''; } }); }
            validarYToggleGenerarBoton();
        });
    }

    const infoUsuarioCheckbox = document.getElementById('info-usuario'); // Obtener referencia también para este
    if(infoUsuarioCheckbox) {
        infoUsuarioCheckbox.addEventListener('change', validarYToggleGenerarBoton);
    }


    // Event listener para el input de RU de usuario (para buscar y habilitar/deshabilitar checkboxes y validar)
    if(ruUsuarioInput) { // Verificar que el elemento existe
        ruUsuarioInput.addEventListener('input', function() {
            const ru = this.value.trim(); usuarioSeleccionado = null; if(usuarioInfoDiv) usuarioInfoDiv.textContent = ''; // Verificar usuarioInfoDiv
            toggleReportesUsuarioCheckboxes(true); reportesUsuarioCheckboxes.forEach(checkbox => checkbox.checked = false);
            if(filtrosHistorialPrestamosDiv) filtrosHistorialPrestamosDiv.classList.add('hidden'); // Verificar
            if(filtrosSancionesDiv) filtrosSancionesDiv.classList.add('hidden'); // Verificar

            if (ru !== '') {
                fetch(`/usuarios/buscarPorRu/${ru}`)
                    .then(response => { if (response.ok) { return response.json(); } else if (response.status === 404) { return null; } else { throw new Error('Error inesperado al buscar usuario (' + response.status + ')'); } })
                    .then(data => {
                        usuarioSeleccionado = data;
                        if (usuarioSeleccionado) { if(usuarioInfoDiv) usuarioInfoDiv.textContent = `Usuario encontrado: ${data.nombre} ${data.apellido}, RU: ${data.ru}`; toggleReportesUsuarioCheckboxes(false); mostrarMensaje('Usuario encontrado.', 'success'); }
                        else { if(usuarioInfoDiv) usuarioInfoDiv.textContent = 'Usuario no encontrado'; toggleReportesUsuarioCheckboxes(true); mostrarMensaje('Usuario no encontrado con RU ' + ru + '. Por favor, ingrese un RU válido.', 'error'); }
                        validarYToggleGenerarBoton();
                    })
                    .catch(error => { console.error('Error al buscar usuario:', error); usuarioSeleccionado = null; if(usuarioInfoDiv) usuarioInfoDiv.textContent = 'Error al buscar usuario'; toggleReportesUsuarioCheckboxes(true); mostrarMensaje('Error al buscar usuario. Por favor, inténtelo de nuevo.', 'error'); validarYToggleGenerarBoton(); });
            } else { validarYToggleGenerarBoton(); }
        });
    }


    // Event listener para el select de días de semana (para validar) - Este solo aplica a reportes globales
    if(diasSemanaHorarioSelect) { // Verificar que el elemento existe
        diasSemanaHorarioSelect.addEventListener('change', validarYToggleGenerarBoton);
    }


    // --- Lógica de Inicialización al Cargar la Página ---

    // Deshabilitar botones generar/imprimir al cargar la página
    if(generarReporteBtn) { // Verificar que los botones existen antes de usarlos
        generarReporteBtn.disabled = true; generarReporteBtn.classList.add('bg-gray-500', 'cursor-not-allowed'); generarReporteBtn.classList.remove('bg-indigo-500', 'hover:bg-indigo-700', 'cursor-pointer');
    }
    if(imprimirReporteBtn) { // Verificar
        imprimirReporteBtn.disabled = true; imprimirReporteBtn.classList.add('bg-gray-500', 'cursor-not-allowed'); imprimirReporteBtn.classList.remove('bg-gray-700', 'hover:bg-gray-700', 'cursor-pointer');
    }


    // Ocultar formularios y vista previa al inicio
    // Esto requiere que todos los elementos existan, por eso es crucial verificar IDs.
    ocultarFormularios(); // Si un elemento no existe, este llamará al error.

    // Asegurarse de que la vista previa esté oculta al inicio
    if(vistaPrevia) vistaPrevia.classList.add('hidden'); // Verificar

    // Asegurarse de que los checkboxes de usuario y estadísticos estén deshabilitados al inicio
    toggleReportesUsuarioCheckboxes(true); // Esto también ocultará y limpiará los filtros de usuario
    toggleReportesEstadisticosCheckboxes(true); // Esto también ocultará y limpiará los nuevos filtros específicos estadísticos


    // Limpiar campos de filtro (todos) y checkboxes (todos) al inicio
    document.querySelectorAll('input[type="checkbox"][name^="reportes"]').forEach(checkbox => { checkbox.checked = false; });
    // Seleccionar todos los campos de entrada y selectores relevantes en todas las secciones de filtro
    document.querySelectorAll('#filtros-globales input, #filtros-globales select, #filtros-usuario input, #filtros-usuario select, #filtros-equipos-mas-prestados-grafico input, #filtros-equipos-mas-prestados-grafico select, #filtros-usuarios-mas-prestaron-grafico input, #filtros-usuarios-mas-prestaron-grafico select').forEach(input => {
        if (input.tagName === 'SELECT') { input.selectedIndex = 0; } else { input.value = ''; }
    });

    Array.from(diasSemanaHorarioSelect ? diasSemanaHorarioSelect.options : []).forEach(option => { option.selected = false; }); // Añadida verificación
    if(ruUsuarioInput) ruUsuarioInput.value = ''; // Verificar
    if(usuarioInfoDiv) usuarioInfoDiv.textContent = ''; // Verificar


}); // Fin del único listener DOMContentLoaded