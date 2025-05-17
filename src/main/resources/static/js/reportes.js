document.addEventListener('DOMContentLoaded', () => {
    // --- Referencias a elementos del DOM ---
    const tipoReporteSeleccion = document.getElementById('tipo-reporte-seleccion');
    const reporteGlobalSeleccion = document.getElementById('reporte-global-seleccion');
    const reporteUsuarioSeleccion = document.getElementById('reporte-usuario-seleccion');
    const reporteEstadisticoSeleccion = document.getElementById('reporte-estadistico-seleccion'); // Referencia NUEVA
    const filtrosGlobales = document.getElementById('filtros-globales');
    const filtrosUsuario = document.getElementById('filtros-usuario');
    const vistaPrevia = document.getElementById('vista-previa');
    const reporteContenido = document.getElementById('reporte-contenido');
    const generarReporteBtn = document.getElementById('generar-reporte');
    const cancelarReporteBtn = document.getElementById('cancelar-reporte');
    const imprimirReporteBtn = document.getElementById('imprimir-reporte');
    const tipoReporteBtns = document.querySelectorAll('.tipo-reporte-btn'); // Actualizado para incluir el nuevo botón
    const ruUsuarioInput = document.getElementById('ru-usuario');
    const usuarioInfoDiv = document.getElementById('usuario-info');
    const reportesUsuarioCheckboxes = document.querySelectorAll('input[name="reportesUsuario"]');
    const reportesGlobalesCheckboxes = document.querySelectorAll('input[name="reportesGlobales"]');
    const reportesEstadisticosCheckboxes = document.querySelectorAll('input[name="reportesEstadisticos"]'); // Referencia NUEVA
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
    let activeCharts = {}; // Variable para almacenar instancias de Chart.js
    let printImages = {}; // Variable para imágenes de gráficos para impresión


    // --- Funciones de Utilidad ---

    // Función para preparar los gráficos para impresión (convertir canvas a imagen)
    function prepararParaImpresion() {
        printImages = {}; // Limpiar imágenes de impresiones anteriores

        if (tipoReporteSeleccionado === 'estadistico') {
            for (const reporteKey in activeCharts) {
                const chart = activeCharts[reporteKey];
                if (chart && chart.canvas) {
                    try {
                        const imageUrl = chart.canvas.toDataURL('image/png'); // Obtener la URL de la imagen del canvas
                        const imgElement = document.createElement('img'); // Crear elemento de imagen
                        imgElement.src = imageUrl;
                        imgElement.alt = reporteKey + " Chart";
                        imgElement.classList.add('print-chart-image'); // Clase para controlar visibilidad en CSS

                        // Ajustar estilos de la imagen para impresión
                        imgElement.style.maxWidth = '100%';
                        imgElement.style.height = 'auto';

                        printImages[reporteKey] = { img: imgElement, canvas: chart.canvas }; // Guardar imagen y referencia al canvas
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
                    // Reemplazar temporalmente el canvas por la imagen en el DOM
                    // Nota: Esto asume que la imagen se va a insertar en el mismo lugar que el canvas.
                    // Asegurarse de que el canvas esté oculto en la impresión CSS (@media print { canvas { display: none !important; } })
                    canvasParent.appendChild(item.img); // Agregar la imagen al padre del canvas
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
                    item.img.parentElement.removeChild(item.img); // Remover la imagen
                }
                // Asegurarse de que el canvas vuelva a su estado normal si fue modificado (no necesario si solo usas @media print)
            }
        }
        printImages = {}; // Limpiar las imágenes generadas
    }


    // Ocultar todos los formularios y secciones relevantes
    function ocultarFormularios() {
        reporteGlobalSeleccion.classList.add('hidden');
        reporteUsuarioSeleccion.classList.add('hidden');
        reporteEstadisticoSeleccion.classList.add('hidden');
        filtrosGlobales.classList.add('hidden');
        filtrosUsuario.classList.add('hidden');
        vistaPrevia.classList.add('hidden');
        filtrosHistorialPrestamosDiv.classList.add('hidden');
        filtrosSancionesDiv.classList.add('hidden');
    }

    // Función para mostrar un mensaje flotante (éxito o error)
    function mostrarMensaje(mensaje, tipo = 'error') {
        const mensajesExistentes = document.querySelectorAll('.mensaje-flotante');
        mensajesExistentes.forEach(msg => msg.remove()); // Eliminar mensajes existentes
        const mensajeDiv = document.createElement('div');
        mensajeDiv.className = `mensaje-flotante fixed top-4 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded shadow-md z-50 ${tipo === 'error' ? 'bg-red-100 text-red-700 border border-red-400' : 'bg-green-100 text-green-700 border border-green-400'}`;
        mensajeDiv.textContent = mensaje;
        document.body.appendChild(mensajeDiv);
        setTimeout(() => mensajeDiv.remove(), 4000); // Eliminar mensaje después de 4 segundos
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
    }

    // Función para cargar los laboratorios en el select global
    function cargarLaboratorios() {
        fetch('/reportes/laboratorios')
            .then(response => {
                if (!response.ok) { return response.text().then(text => { let errorMsg = `Error al cargar laboratorios (${response.status}): `; try { const errorJson = JSON.parse(text); errorMsg += errorJson.message || errorJson.error || text; } catch(e) { errorMsg += text; } throw new Error(errorMsg); }); }
                return response.json(); })
            .then(data => {
                laboratorioGlobalSelect.innerHTML = '<option value="">Todos los Laboratorios</option>';
                if (Array.isArray(data)) { data.forEach(laboratorio => { const option = document.createElement('option'); option.value = laboratorio.idLaboratorio; option.textContent = laboratorio.nombre; laboratorioGlobalSelect.appendChild(option); }); }
                else { console.error("Datos de laboratorios recibidos no es un array:", data); mostrarMensaje("Error: Formato de datos de laboratorios incorrecto.", 'error'); laboratorioGlobalSelect.innerHTML = '<option value="">Error al cargar laboratorios</option>'; } })
            .catch(error => { console.error('Error al cargar laboratorios:', error); mostrarMensaje('Error al cargar laboratorios. ' + error.message, 'error'); laboratorioGlobalSelect.innerHTML = '<option value="">Error al cargar</option>'; laboratorioGlobalSelect.disabled = true; });
    }

    // Función para cargar las categorías en el select global (o filtradas por laboratorio)
    function cargarCategorias(laboratorioId = null) {
        const url = laboratorioId ? `/reportes/categorias?laboratorioId=${laboratorioId}` : '/reportes/categorias';
        fetch(url)
            .then(response => {
                if (!response.ok) { return response.text().then(text => { let errorMsg = `Error al cargar categorías (${response.status}): `; try { const errorJson = JSON.parse(text); errorMsg += errorJson.message || errorJson.error || text; } catch(e) { errorMsg += text; } throw new Error(errorMsg); }); }
                return response.json(); })
            .then(data => {
                categoriaGlobalSelect.innerHTML = '<option value="">Todas las Categorías</option>';
                if (Array.isArray(data)) { data.forEach(categoria => { const option = document.createElement('option'); option.value = categoria.idCategoria; option.textContent = categoria.nombreCategoria; categoriaGlobalSelect.appendChild(option); }); }
                else { console.error("Datos de categorías recibidos no es un array:", data); mostrarMensaje("Error: Formato de datos de categorías incorrecto.", 'error'); categoriaGlobalSelect.innerHTML = '<option value="">Error al cargar categorías</option>'; } })
            .catch(error => { console.error('Error al cargar categorías:', error); mostrarMensaje('Error al cargar categorías. ' + error.message, 'error'); categoriaGlobalSelect.innerHTML = '<option value="">Error al cargar</option>'; categoriaGlobalSelect.disabled = true; })
            .finally(() => { categoriaGlobalSelect.disabled = false; });
    }

    // Función para destruir gráficos existentes
    function destroyCharts() {
        for (const chartId in activeCharts) { if (activeCharts[chartId]) { activeCharts[chartId].destroy(); activeCharts[chartId] = null; } } activeCharts = {}; // Limpiar el objeto de gráficos activos
    }

    // Función para mostrar la vista previa en el HTML (MODIFICADA para manejar gráficos y tablas)
    function mostrarVistaPrevia(data) {
        let html = ''; destroyCharts(); // Destruir gráficos anteriores
        const userReportOrder = ["infoUsuario", "historialPrestamosUsuario", "sancionesUsuario"];
        const globalReportOrder = ["equiposMasPrestados", "usuariosMasPrestaron", "prestamosPorFecha", "mantenimientos", "prestamosFechaFecha", "administradoresPrestamo", "sancionesActivasInactivas", "horario-laboratorio"];
        const estadisticoReportOrder = ["equiposMasPrestados", "usuariosMasPrestaron"]; // Claves en el orden deseado para gráficos

        const reportKeysToRender = []; // Determinar el orden de renderizado según el tipo seleccionado
        if (tipoReporteSeleccionado === 'usuario') { userReportOrder.forEach(key => { if (data.hasOwnProperty(key)) { reportKeysToRender.push(key); } }); }
        else if (tipoReporteSeleccionado === 'global') { globalReportOrder.forEach(key => { if (data.hasOwnProperty(key)) { reportKeysToRender.push(key); } }); }
        else if (tipoReporteSeleccionado === 'estadistico') { estadisticoReportOrder.forEach(key => { if (data.hasOwnProperty(key) && reportesSeleccionados.includes(key)) { reportKeysToRender.push(key); } }); }

        // Mapeo de claves del reporte a las claves de los datos para renderizar tablas
        const reporteKeysHTML = {
            "sancionesUsuario": ["idSancion", "motivoSancion", "fechaSancion", "estado"],
            "historialPrestamosUsuario": ["idPrestamo", "fechaPrestamo", "horaPrestamo", "estado", "fechaDevolucionEstimada"],
            "equiposMasPrestados": ["nombre", "cantidadPrestada"], // Estas claves deben coincidir con las del backend
            "usuariosMasPrestaron": ["nombre", "apellido", "cantidadPrestamos"], // Estas claves deben coincidir con las del backend
            "prestamosPorFecha": ["idPrestamo", "usuario", "fechaPrestamo", "horaPrestamo", "estado"],
            "mantenimientos": ["idMantenimiento", "equipo", "fechaMantenimiento", "cantidad"],
            "prestamosFechaFecha": ["idPrestamo", "usuario", "fechaPrestamo", "horaPrestamo", "administrador", "estado", "fechaDevolucionEstimada"],
            "administradoresPrestamo": ["administrador", "fechaPrestamo", "horaPrestamo", "usuario"],
            "sancionesActivasInactivas": ["idSancion", "usuario", "motivoSancion", "fechaSancion", "estado"],
            "infoUsuario": null, // Este no es una tabla, es texto/lista
            "horario-laboratorio": ["diaSemana", "horaInicio", "horaFin", "ocupado"]
        };


        // --- Iterar sobre las claves de los reportes en el orden definido y renderizar ---
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
                            reporte.datos.forEach(fila => { // fila es un Map/Objeto del backend
                                html += '<tr>';
                                keys.forEach(key => {
                                    const dataValue = fila[key]; let displayValue = dataValue; let cellClasses = "px-5 py-5 border-b border-gray-200 text-sm";
                                    // Lógica específica de visualización (ej. Horario Ocupado)
                                    if (reporteKey === "horario-laboratorio" && key === "ocupado") { displayValue = dataValue ? 'Ocupado' : 'Disponible'; cellClasses += dataValue ? ' text-red-500 font-bold' : ' text-green-500 font-bold'; }
                                    // Manejo de formato de fecha/hora (verificar si el backend envía Date o String)
                                    else if (dataValue instanceof Date) { // Si el backend envía objetos Date (menos común en JSON)
                                        displayValue = dataValue.toLocaleString(); // O .toLocaleDateString(), .toLocaleTimeString()
                                    }
                                    else if (typeof dataValue === 'string') { // Si el backend envía fechas/horas como String (común)
                                        // Intentar parsear si parece fecha/hora para formatear
                                        if (dataValue.match(/^\d{4}-\d{2}-\d{2}(T.*)?$/)) { // YYYY-MM-DD o YYYY-MM-DDTHH:MM:SS
                                            try { const date = new Date(dataValue); if (!isNaN(date.getTime())) { displayValue = date.toLocaleDateString(); if(dataValue.includes('T')) displayValue += ' ' + date.toLocaleTimeString(); } else { displayValue = dataValue; } } catch (e) { displayValue = dataValue; console.error("Error parsing date string:", dataValue, e); }
                                        } else if (dataValue.match(/^\d{2}:\d{2}(:\d{2})?$/)) { // HH:MM o HH:MM:SS
                                            displayValue = dataValue; // Mantener formato de hora si es solo hora
                                        } else { displayValue = dataValue; } // Otro tipo de string
                                    }
                                    else { displayValue = dataValue !== null && dataValue !== undefined ? dataValue : ''; } // Valores null/undefined

                                    html += `<td class="${cellClasses}">${displayValue}</td>`;
                                });
                                html += '</tr>';
                            });
                        } else { // Tabla vacía
                            const colSpan = reporte.cabecera ? reporte.cabecera.length : 1;
                            html += `<tr><td class="px-5 py-5 border-b border-gray-200 text-sm text-center italic" colspan="${colSpan}">No se encontraron datos para este reporte.</td></tr>`;
                        }
                        html += '</tbody></table></div>'; // Cerrar tabla y div
                    }
                } else if (reporte.tipo === 'lista') { // Renderizado para tipo 'lista'
                    if (reporte.datos && Array.isArray(reporte.datos) && reporte.datos.length > 0) {
                        html += '<ul class="list-disc list-inside">'; reporte.datos.forEach(item => { html += `<li>${item}</li>`; }); html += '</ul>';
                    } else { html += '<p class="text-gray-700 italic">No se encontraron datos para este reporte.</p>'; }
                } else if (reporte.tipo === 'texto' || reporte.tipo === 'info-usuario') { // Renderizado para tipo 'texto' o 'info-usuario'
                    if (reporte.datos) {
                        if (typeof reporte.datos === 'string' && reporte.datos.trim() !== '') {
                            html += `<p class="text-gray-700 whitespace-pre-line">${reporte.datos}</p>`;
                        } else if (typeof reporte.datos === 'object' && reporte.tipo === 'info-usuario') {
                            let infoHtml = '<div class="grid grid-cols-1 md:grid-cols-1 gap-2 text-sm">';
                            const infoKeys = ["ru", "nombre", "apellido", "ci", "tipoUsuario", "carrera", "telefono", "correo", "materia", "paralelo", "semestre"];
                            infoKeys.forEach(key => { if(reporte.datos.hasOwnProperty(key) && reporte.datos[key] !== null){ let label = key.replace(/([A-Z])/g, ' $1').trim(); label = label.charAt(0).toUpperCase() + label.slice(1); infoHtml += `<div><span class="font-semibold">${label}:</span> ${reporte.datos[key]}</div>`; } });
                            infoHtml += '</div>'; html += infoHtml;
                        } else { html += '<p class="text-gray-700 italic">No se encontró información.</p>'; }
                    } else { html += '<p class="text-gray-700 italic">No se encontró información.</p>'; }
                } else { console.warn(`Tipo de reporte desconocido o condición no cumplida para ${reporteKey}.`); }
                if (reporteKey !== reportKeysToRender[reportKeysToRender.length - 1]) { html += '<hr class="my-4 border-gray-300">'; } // Separador entre reportes
            } else { console.warn(`Reporte object es null/undefined para clave: ${reporteKey}`); }
        }); // Fin del bucle forEach sobre reportKeysToRender

        if (html === '') { html = '<p class="text-gray-500 italic">No se seleccionaron reportes válidos o no hay datos.</p>'; }
        reporteContenido.innerHTML = html; // Insertar el HTML generado

        // --- Crear gráficos DESPUÉS de insertar el HTML ---
        if (tipoReporteSeleccionado === 'estadistico') {
            reportKeysToRender.forEach(reporteKey => {
                const reporte = data[reporteKey];
                // Solo intentar crear gráfico si es uno de los tipos estadísticos esperados
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

    // --- Funciones de Lógica de Reporte (obtenerReportesSeleccionadosYFiltros, validarYToggleGenerarBoton, generarVistaPrevia) ---

    // Función para obtener los reportes seleccionados y filtros
    function obtenerReportesSeleccionadosYFiltros() {
        reportesSeleccionados = []; filtros = {}; // Reiniciar
        if (tipoReporteSeleccionado === 'global') {
            reportesGlobalesCheckboxes.forEach(checkbox => { if (checkbox.checked) { reportesSeleccionados.push(checkbox.value); } });
            if (!filtrosGlobales.classList.contains('hidden')) {
                filtros = {
                    fechaInicio: document.getElementById('fecha-inicio-global').value || null, fechaFin: document.getElementById('fecha-fin-global').value || null,
                    laboratorio: document.getElementById('laboratorio-global').value || null, categoria: document.getElementById('categoria-global').value || null
                };
                if (!diasSemanaHorarioSelect.parentElement.parentElement.classList.contains('hidden')) {
                    const selectedDays = Array.from(diasSemanaHorarioSelect.selectedOptions).map(option => option.value);
                    if (selectedDays.length > 0) { filtros.diasSemana = selectedDays; }
                }
            }
        } else if (tipoReporteSeleccionado === 'estadistico') {
            reportesEstadisticosCheckboxes.forEach(checkbox => { if (checkbox.checked) { reportesSeleccionados.push(checkbox.value); } });
            if (!filtrosGlobales.classList.contains('hidden')) { // Los estadísticos usan filtros globales
                filtros = {
                    fechaInicio: document.getElementById('fecha-inicio-global').value || null, fechaFin: document.getElementById('fecha-fin-global').value || null,
                    laboratorio: document.getElementById('laboratorio-global').value || null, categoria: document.getElementById('categoria-global').value || null
                };
            }
        } else if (tipoReporteSeleccionado === 'usuario') {
            if (usuarioSeleccionado) {
                reportesUsuarioCheckboxes.forEach(checkbox => { if (checkbox.checked) { reportesSeleccionados.push(checkbox.value); } });
                if (!filtrosHistorialPrestamosDiv.classList.contains('hidden')) { filtros.estadoPrestamoUsuario = document.getElementById('estado-prestamo').value || null; filtros.fechaInicioPrestamosUsuario = document.getElementById('fecha-inicio-prestamos').value || null; filtros.fechaFinPrestamosUsuario = document.getElementById('fecha-fin-prestamos').value || null; }
                if (!filtrosSancionesDiv.classList.contains('hidden')) { filtros.estadoSancionUsuario = document.getElementById('estado-sancion').value || null; filtros.fechaInicioSancionesUsuario = document.getElementById('fecha-inicio-sanciones').value || null; filtros.fechaFinSancionesUsuario = document.getElementById('fecha-fin-sanciones').value || null; }
            }
        }
        for (const key in filtros) { if (Array.isArray(filtros[key]) && filtros[key].length === 0) { delete filtros[key]; } else if (!Array.isArray(filtros[key]) && (filtros[key] === null || filtros[key] === '')) { delete filtros[key]; } }
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
                imprimirReporteBtn.disabled = false; imprimirReporteBtn.classList.remove('bg-gray-500', 'cursor-not-allowed'); imprimirReporteBtn.classList.add('bg-gray-700', 'hover:bg-gray-700', 'cursor-pointer');
            })
            .catch(error => {
                console.error('Error al generar vista previa:', error); reporteContenido.innerHTML = `<p class="text-red-500">Error al generar reporte: ${error.message}</p>`;
                mostrarMensaje('Error al generar el reporte. Por favor, inténtelo de nuevo.', 'error');
                imprimirReporteBtn.disabled = true; imprimirReporteBtn.classList.add('bg-gray-500', 'cursor-not-allowed'); imprimirReporteBtn.classList.remove('bg-gray-700', 'hover:bg-gray-700', 'cursor-pointer');
            });
    }


    // --- Adjunción ÚNICA de Event Listeners al Cargar el DOM ---

    // Event listener para los botones de tipo de reporte (Global/Estadistico/Usuario)
    // ESTE BUCLE DEBE ESTAR SOLO UNA VEZ
    tipoReporteBtns.forEach(button => {
        button.addEventListener('click', function() {
            tipoReporteSeleccionado = this.dataset.tipo;
            tipoReporteBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            ocultarFormularios();
            vistaPrevia.classList.add('hidden');
            reporteContenido.innerHTML = '';
            destroyCharts();

            // Limpiar campos de filtro y checkboxes
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
                filtrosGlobales.classList.remove('hidden'); // Asegura que el contenedor principal de filtros globales esté visible
                cargarLaboratorios();
                cargarCategorias();
                toggleReportesUsuarioCheckboxes(true);
                toggleReportesEstadisticosCheckboxes(false); // Habilitar solo los estadísticos
                diasSemanaHorarioSelect.parentElement.parentElement.classList.add('hidden'); // Ocultar filtro de días
                // NO es necesario ocultar explícitamente los divs de fecha, lab, cat aquí
                // Si no se ven, es un problema de CSS que los afecta *dentro* del grid cuando el tipo es estadístico.

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

        // Limpiar campos de filtro y checkboxes
        document.querySelectorAll('input[type="checkbox"][name^="reportes"]').forEach(checkbox => { checkbox.checked = false; });
        document.querySelectorAll('#filtros-globales input, #filtros-globales select, #filtros-usuario input, #filtros-usuario select').forEach(input => {
            if (input.tagName === 'SELECT') { input.selectedIndex = 0; } else { input.value = ''; }
        });
        Array.from(diasSemanaHorarioSelect.options).forEach(option => { option.selected = false; });
        toggleReportesUsuarioCheckboxes(true); // Deshabilitar checkboxes de usuario y limpiar filtros
        toggleReportesEstadisticosCheckboxes(true); // Deshabilitar checkboxes estadísticos

        generarReporteBtn.disabled = true; generarReporteBtn.classList.add('bg-gray-500', 'cursor-not-allowed'); generarReporteBtn.classList.remove('bg-indigo-500', 'hover:bg-indigo-700', 'cursor-pointer');
        imprimirReporteBtn.disabled = true; imprimirReporteBtn.classList.add('bg-gray-500', 'cursor-not-allowed'); imprimirReporteBtn.classList.remove('bg-gray-700', 'hover:bg-gray-700', 'cursor-pointer');

        const mensajesExistentes = document.querySelectorAll('.mensaje-flotante'); mensajesExistentes.forEach(msg => msg.remove());
    });


    // Event listener para el cambio en el selector de laboratorio global para filtrar categorías
    laboratorioGlobalSelect.addEventListener('change', function() {
        const selectedLabId = this.value;
        categoriaGlobalSelect.innerHTML = '<option value="">Cargando...</option>';
        categoriaGlobalSelect.disabled = true;
        if (selectedLabId) { cargarCategorias(parseInt(selectedLabId, 10)); } else { cargarCategorias(); }
    });


    // Event listeners para checkboxes de reportes de usuario para mostrar/ocultar filtros específicos
    historialPrestamosUsuarioCheckbox.addEventListener('change', function() {
        if (this.checked) { filtrosHistorialPrestamosDiv.classList.remove('hidden'); }
        else {
            filtrosHistorialPrestamosDiv.classList.add('hidden');
            filtrosHistorialPrestamosDiv.querySelectorAll('input, select').forEach(input => { if (input.tagName === 'SELECT') { input.selectedIndex = 0; } else { input.value = ''; } });
        }
        validarYToggleGenerarBoton();
    });

    sancionesUsuarioCheckbox.addEventListener('change', function() {
        if (this.checked) { filtrosSancionesDiv.classList.remove('hidden'); }
        else {
            filtrosSancionesDiv.classList.add('hidden');
            filtrosSancionesDiv.querySelectorAll('input, select').forEach(input => { if (input.tagName === 'SELECT') { input.selectedIndex = 0; } else { input.value = ''; } });
        }
        validarYToggleGenerarBoton();
    });

    document.getElementById('info-usuario').addEventListener('change', validarYToggleGenerarBoton);


    // Event listener para el input de RU de usuario (para buscar y habilitar/deshabilitar checkboxes)
    ruUsuarioInput.addEventListener('input', function() {
        const ru = this.value.trim(); usuarioSeleccionado = null; usuarioInfoDiv.textContent = '';
        toggleReportesUsuarioCheckboxes(true); reportesUsuarioCheckboxes.forEach(checkbox => checkbox.checked = false);
        filtrosHistorialPrestamosDiv.classList.add('hidden'); filtrosSancionesDiv.classList.add('hidden');

        if (ru !== '') {
            fetch(`/usuarios/buscarPorRu/${ru}`) // Revisa esta URL
                .then(response => { if (response.ok) { return response.json(); } else if (response.status === 404) { return null; } else { throw new Error('Error inesperado al buscar usuario (' + response.status + ')'); } })
                .then(data => {
                    usuarioSeleccionado = data;
                    if (usuarioSeleccionado) { usuarioInfoDiv.textContent = `Usuario encontrado: ${data.nombre} ${data.apellido}, RU: ${data.ru}`; toggleReportesUsuarioCheckboxes(false); mostrarMensaje('Usuario encontrado.', 'success'); }
                    else { usuarioInfoDiv.textContent = 'Usuario no encontrado'; toggleReportesUsuarioCheckboxes(true); mostrarMensaje('Usuario no encontrado con RU ' + ru + '. Por favor, ingrese un RU válido.', 'error'); }
                    validarYToggleGenerarBoton();
                })
                .catch(error => { console.error('Error al buscar usuario:', error); usuarioSeleccionado = null; usuarioInfoDiv.textContent = 'Error al buscar usuario'; toggleReportesUsuarioCheckboxes(true); mostrarMensaje('Error al buscar usuario. Por favor, inténtelo de nuevo.', 'error'); validarYToggleGenerarBoton(); });
        } else { validarYToggleGenerarBoton(); }
    });

    // Event listeners para los checkboxes de reportes globales para validar
    reportesGlobalesCheckboxes.forEach(checkbox => { checkbox.addEventListener('change', validarYToggleGenerarBoton); });

    // Event listeners para los checkboxes de reportes estadísticos para validar
    reportesEstadisticosCheckboxes.forEach(checkbox => { checkbox.addEventListener('change', validarYToggleGenerarBoton); });

    // Event listener para el select de días de semana (para validar)
    diasSemanaHorarioSelect.addEventListener('change', validarYToggleGenerarBoton);


    // --- Lógica de Inicialización al Cargar la Página ---

    // Deshabilitar botones generar/imprimir al cargar la página
    generarReporteBtn.disabled = true; generarReporteBtn.classList.add('bg-gray-500', 'cursor-not-allowed'); generarReporteBtn.classList.remove('bg-indigo-500', 'hover:bg-indigo-700', 'cursor-pointer');
    imprimirReporteBtn.disabled = true; imprimirReporteBtn.classList.add('bg-gray-500', 'cursor-not-allowed'); imprimirReporteBtn.classList.remove('bg-gray-700', 'hover:bg-gray-700', 'cursor-pointer');

    // Ocultar formularios y vista previa al inicio
    ocultarFormularios();
    vistaPrevia.classList.add('hidden'); // Asegurarse de que la vista previa esté oculta al inicio

    // Asegurarse de que los checkboxes de usuario y estadísticos estén deshabilitados al inicio
    toggleReportesUsuarioCheckboxes(true);
    toggleReportesEstadisticosCheckboxes(true);

    // Limpiar campos de filtro y checkboxes al inicio
    document.querySelectorAll('input[type="checkbox"][name^="reportes"]').forEach(checkbox => { checkbox.checked = false; });
    document.querySelectorAll('#filtros-globales input, #filtros-globales select, #filtros-usuario input, #filtros-usuario select').forEach(input => {
        if (input.tagName === 'SELECT') { input.selectedIndex = 0; } else { input.value = ''; }
    });
    Array.from(diasSemanaHorarioSelect.options).forEach(option => { option.selected = false; });
    usuarioSeleccionado = null; ruUsuarioInput.value = ''; usuarioInfoDiv.textContent = '';


}); // Fin del único listener DOMContentLoaded