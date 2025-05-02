document.addEventListener('DOMContentLoaded', () => {
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

    // Referencias a las secciones de filtros de usuario específicas
    const filtrosHistorialPrestamosDiv = document.getElementById('filtros-historial-prestamos');
    const filtrosSancionesDiv = document.getElementById('filtros-sanciones');
    const historialPrestamosUsuarioCheckbox = document.getElementById('historial-prestamos-usuario');
    const sancionesUsuarioCheckbox = document.getElementById('sanciones-usuario');


    let tipoReporteSeleccionado = null;
    let usuarioSeleccionado = null;
    let reportesSeleccionados = [];
    let filtros = {};
    let reportesData = {};


    // Ocultar todos los formularios de filtro al inicio
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
    ocultarFormularios();

    // Función para mostrar un mensaje
    function mostrarMensaje(mensaje, tipo = 'error') {
        // Eliminar mensajes anteriores para evitar acumulación
        const mensajesExistentes = document.querySelectorAll('.mensaje-flotante');
        mensajesExistentes.forEach(msg => msg.remove());

        const mensajeDiv = document.createElement('div');
        mensajeDiv.className = `mensaje-flotante fixed top-4 left-1/2 transform -translate-x-1/2 bg-${tipo === 'error' ? 'red' : 'green'}-100 text-${tipo === 'error' ? 'red' : 'green'}-700 border border-${tipo === 'error' ? 'red' : 'green'}-400 px-4 py-2 rounded shadow-md z-50`; // Añadido z-50 para asegurar que esté encima
        mensajeDiv.textContent = mensaje;
        document.body.appendChild(mensajeDiv);
        setTimeout(() => mensajeDiv.remove(), 4000); // Mostrar por 4 segundos
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
        }
    }

    // Función para cargar los laboratorios en el select global
    function cargarLaboratorios() {
        // Implementación para cargar desde el backend
        // La URL ahora debe incluir el prefijo del controlador
        fetch('/reportes/laboratorios') // URL correcta
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
                // Asegúrate de que 'data' sea un array y que los objetos laboratorio tengan idLaboratorio y nombre
                if (Array.isArray(data)) {
                    data.forEach(laboratorio => {
                        const option = document.createElement('option');
                        // *** IMPORTANTE ***: Ajusta estas propiedades (.idLaboratorio, .nombre)
                        // según los nombres exactos de las propiedades en el objeto Laboratorio que retorna tu backend.
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
                mostrarMensaje('Error al cargar laboratorios.', 'error');
                laboratorioGlobalSelect.innerHTML = '<option value="">Error al cargar</option>';
            });
    }

    // Función para cargar las categorías en el select global (o filtradas por laboratorio)
    function cargarCategorias(laboratorioId = null) {
        // Implementación para cargar desde el backend
        // La URL ahora debe incluir el prefijo del controlador y el parámetro si laboratorioId no es null
        const url = laboratorioId ? `/reportes/categorias?laboratorioId=${laboratorioId}` : '/reportes/categorias'; // URL correcta

        fetch(url)
            .then(response => {
                if (!response.ok) {
                    // Leer el cuerpo de la respuesta para un error más detallado si no es 404
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
                    data.forEach(categoria => { // <-- Inicio del bucle forEach
                        console.log("Procesando categoría:", categoria); // <-- Añadir este log
                        const option = document.createElement('option');
                        option.value = categoria.idCategoria;
                        option.textContent = categoria.nombreCategoria; // <-- ¡Línea corregida!
                        console.log("Creando opción:", option); // <-- Añadir este log
                        categoriaGlobalSelect.appendChild(option);
                    }); // <-- Fin del bucle forEach
                } else {
                    console.error("Datos de categorías recibidos no es un array:", data);
                    categoriaGlobalSelect.innerHTML = '<option value="">Error al cargar categorías</option>';
                    mostrarMensaje("Error: Formato de datos de categorías incorrecto.", 'error');
                }
            })
            .catch(error => {
                console.error('Error al cargar categorías:', error);
                mostrarMensaje('Error al cargar categorías.', 'error');
                categoriaGlobalSelect.innerHTML = '<option value="">Error al cargar</option>';
            })
            .finally(() => {
                categoriaGlobalSelect.disabled = false; // Re-enable selector siempre al finalizar
            });
    }

    // Event listener para el cambio en el selector de laboratorio global
    laboratorioGlobalSelect.addEventListener('change', function() {
        const selectedLabId = this.value; // Obtiene el ID del laboratorio seleccionado (será string)
        // Limpiar y deshabilitar selector de categoría mientras carga
        categoriaGlobalSelect.innerHTML = '<option value="">Cargando...</option>';
        categoriaGlobalSelect.disabled = true; // Deshabilitar selector de categoría

        if (selectedLabId) {
            // Convertir el valor a número si tu backend lo espera como Integer
            cargarCategorias(parseInt(selectedLabId, 10)); // Cargar categorías filtradas por laboratorio
        } else {
            cargarCategorias(); // Cargar todas las categorías si "Todos los Laboratorios" está seleccionado (value es "")
        }
        // El re-habilitar se hace en el finally de cargarCategorias
    });


    // Event listeners para los botones de tipo de reporte
    tipoReporteBtns.forEach(button => {
        button.addEventListener('click', function() {
            tipoReporteSeleccionado = this.dataset.tipo;
            // Eliminar clase 'active' de todos y añadirla al seleccionado
            tipoReporteBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            // Ocultar secciones, vista previa y limpiar contenido
            ocultarFormularios();
            vistaPrevia.classList.add('hidden');
            reporteContenido.innerHTML = ''; // Limpiar vista previa anterior

            // Desmarcar todos los checkboxes de reportes
            document.querySelectorAll('input[type="checkbox"][name^="reportes"]').forEach(checkbox => {
                checkbox.checked = false;
            });

            // Limpiar campos de filtro
            document.querySelectorAll('input[type="date"], input[type="number"], select').forEach(input => {
                if (input.type === 'select-one') {
                    input.selectedIndex = 0; // Reset selects to first option
                } else {
                    input.value = ''; // Clear input fields
                }
            });


            if (tipoReporteSeleccionado === 'global') {
                reporteGlobalSeleccion.classList.remove('hidden');
                filtrosGlobales.classList.remove('hidden');
                cargarLaboratorios();
                cargarCategorias(); // Cargar todas las categorías inicialmente
                // Asegurarse de que los checkboxes de usuario estén deshabilitados si no es reporte de usuario
                toggleReportesUsuarioCheckboxes(true);
            } else if (tipoReporteSeleccionado === 'usuario') {
                reporteUsuarioSeleccion.classList.remove('hidden');
                filtrosUsuario.classList.remove('hidden');
                // Habilitar checkboxes de usuario solo si ya se seleccionó un usuario válido
                if (usuarioSeleccionado) {
                    toggleReportesUsuarioCheckboxes(false);
                } else {
                    toggleReportesUsuarioCheckboxes(true); // Mantener deshabilitados hasta buscar usuario
                }
            }

            // Habilitar botón generar por defecto (se deshabilitará si no hay selecciones válidas)
            generarReporteBtn.disabled = false;
            generarReporteBtn.classList.remove('bg-gray-500', 'cursor-not-allowed');
            generarReporteBtn.classList.add('bg-indigo-500', 'hover:bg-indigo-700', 'cursor-pointer');
            // Deshabilitar botón imprimir por defecto
            imprimirReporteBtn.disabled = true;
            imprimirReporteBtn.classList.add('bg-gray-500', 'cursor-not-allowed');
            imprimirReporteBtn.classList.remove('bg-gray-700', 'hover:bg-gray-700', 'cursor-pointer');
        });
    });

    // Event listeners para checkboxes de reportes de usuario para mostrar/ocultar filtros
    historialPrestamosUsuarioCheckbox.addEventListener('change', function() {
        if (this.checked) {
            filtrosHistorialPrestamosDiv.classList.remove('hidden');
        } else {
            filtrosHistorialPrestamosDiv.classList.add('hidden');
            // Limpiar filtros al ocultar
            filtrosHistorialPrestamosDiv.querySelectorAll('input, select').forEach(input => {
                if (input.type === 'select-one') {
                    input.selectedIndex = 0;
                } else {
                    input.value = '';
                }
            });
        }
    });

    sancionesUsuarioCheckbox.addEventListener('change', function() {
        if (this.checked) {
            filtrosSancionesDiv.classList.remove('hidden');
        } else {
            filtrosSancionesDiv.classList.add('hidden');
            // Limpiar filtros al ocultar
            filtrosSancionesDiv.querySelectorAll('input, select').forEach(input => {
                if (input.type === 'select-one') {
                    input.selectedIndex = 0;
                } else {
                    input.value = '';
                }
            });
        }
    });


    // Event listener para el input de RU de usuario
    ruUsuarioInput.addEventListener('input', function() {
        const ru = this.value.trim();
        // Limpiar info y deshabilitar checkboxes si el RU está vacío o cambia
        usuarioSeleccionado = null;
        usuarioInfoDiv.textContent = '';
        toggleReportesUsuarioCheckboxes(true);
        // Desmarcar también los checkboxes de reportes de usuario al cambiar el RU
        reportesUsuarioCheckboxes.forEach(checkbox => checkbox.checked = false);


        if (ru !== '') {
            fetch(`/usuarios/buscarPorRu/${ru}`) // Ajusta la URL si es diferente
                .then(response => {
                    if (response.ok) {
                        return response.json();
                    } else if (response.status === 404) {
                        // No lanzar error aquí, solo indicar que no se encontró
                        return null;
                    } else {
                        throw new Error('Error inesperado al buscar usuario (' + response.status + ')');
                    }
                })
                .then(data => {
                    usuarioSeleccionado = data;
                    if (usuarioSeleccionado) {
                        usuarioInfoDiv.textContent = `Nombre: ${data.nombre} ${data.apellido}, RU: ${data.ru}`;
                        toggleReportesUsuarioCheckboxes(false); // Habilitar checkboxes si se encontró usuario
                        mostrarMensaje('Usuario encontrado.', 'success');
                    } else {
                        usuarioInfoDiv.textContent = 'Usuario no encontrado';
                        toggleReportesUsuarioCheckboxes(true); // Mantener deshabilitados
                        mostrarMensaje('Usuario no encontrado. Por favor, ingrese un RU válido.', 'error');
                    }
                })
                .catch(error => {
                    console.error('Error al buscar usuario:', error);
                    usuarioSeleccionado = null; // Asegurarse de que sea null en caso de error de fetch
                    usuarioInfoDiv.textContent = 'Error al buscar usuario'; // Mostrar mensaje de error de fetch
                    toggleReportesUsuarioCheckboxes(true); // Mantener deshabilitados
                    mostrarMensaje('Error al buscar usuario. Por favor, inténtelo de nuevo.', 'error');
                });
        }
    });

    // Función para obtener los reportes seleccionados y filtros
    function obtenerReportesSeleccionados() {
        reportesSeleccionados = [];
        filtros = {};

        if (tipoReporteSeleccionado === 'global') {
            reportesGlobalesCheckboxes.forEach(checkbox => {
                if (checkbox.checked) {
                    reportesSeleccionados.push(checkbox.value);
                }
            });
            filtros = {
                // Solo incluir filtros si tienen valor
                fechaInicio: document.getElementById('fecha-inicio-global').value || null,
                fechaFin: document.getElementById('fecha-fin-global').value || null,
                laboratorio: document.getElementById('laboratorio-global').value || null,
                categoria: document.getElementById('categoria-global').value || null
            };
        } else if (tipoReporteSeleccionado === 'usuario') {
            reportesUsuarioCheckboxes.forEach(checkbox => {
                if (checkbox.checked) {
                    reportesSeleccionados.push(checkbox.value);
                }
            });
            // Solo incluir filtros si la sección de filtro está visible Y tiene valor
            if (!filtrosHistorialPrestamosDiv.classList.contains('hidden')) {
                filtros.fechaInicioPrestamos = document.getElementById('fecha-inicio-prestamos').value || null;
                filtros.fechaFinPrestamos = document.getElementById('fecha-fin-prestamos').value || null;
                filtros.estadoPrestamo = document.getElementById('estado-prestamo').value || null;
            }
            if (!filtrosSancionesDiv.classList.contains('hidden')) {
                filtros.fechaInicioSanciones = document.getElementById('fecha-inicio-sanciones').value || null;
                filtros.fechaFinSanciones = document.getElementById('fecha-fin-sanciones').value || null;
                filtros.estadoSancion = document.getElementById('estado-sancion').value || null;
            }
        }

        // Eliminar filtros con valor null o vacío para no enviarlos al backend si no se usaron
        for (const key in filtros) {
            if (filtros.hasOwnProperty(key) && (filtros[key] === null || filtros[key] === '')) {
                delete filtros[key];
            }
        }
    }

    // Función para validar la selección de reportes
    function validarSeleccion() {
        if (reportesSeleccionados.length === 0) {
            mostrarMensaje('Por favor, seleccione al menos un reporte a generar.', 'error');
            return false;
        }
        if (tipoReporteSeleccionado === 'usuario' && !usuarioSeleccionado) {
            mostrarMensaje('Por favor, ingrese y valide el RU del usuario.', 'error');
            return false;
        }
        // Validación adicional: si es reporte de usuario, al menos un checkbox de usuario debe estar marcado
        if (tipoReporteSeleccionado === 'usuario' && reportesSeleccionados.length === 0) {
            mostrarMensaje('Por favor, seleccione al menos un tipo de reporte para el usuario.', 'error');
            return false;
        }

        return true;
    }

    // Función para generar la vista previa del reporte (AJAX)
    function generarVistaPrevia() {
        obtenerReportesSeleccionados();
        if (!validarSeleccion()) {
            return;
        }

        vistaPrevia.classList.remove('hidden');
        reporteContenido.innerHTML = '<p class="text-gray-500 italic">Generando vista previa...</p>';
        imprimirReporteBtn.disabled = true; // Deshabilitar botón imprimir mientras se genera
        imprimirReporteBtn.classList.add('bg-gray-500', 'cursor-not-allowed');
        imprimirReporteBtn.classList.remove('bg-gray-700', 'hover:bg-gray-700', 'cursor-pointer');


        const data = {
            // tipoReporte: tipoReporteSeleccionado, // No usado en backend
            reportes: reportesSeleccionados,
            filtros: filtros,
            usuarioRu: tipoReporteSeleccionado === 'usuario' && usuarioSeleccionado ? usuarioSeleccionado.ru : null // Enviar RU solo si es reporte de usuario y hay usuario seleccionado
        };

        console.log("Enviando solicitud al backend:", data); // Log para depuración

        fetch('/reportes/generarReporte', { //  Endpoint para generar reportes
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
            .then(response => {
                if (!response.ok) {
                    // Intentar leer el cuerpo del error para un mensaje más detallado
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
                console.log("Datos recibidos del backend:", data); // Log para depuración
                reportesData = data; // Almacena los datos del reporte para la generación del PDF/Imprimir
                mostrarVistaPrevia(data);
                imprimirReporteBtn.disabled = false; // Habilitar botón imprimir al generar exitosamente
                imprimirReporteBtn.classList.remove('bg-gray-500', 'cursor-not-allowed');
                imprimirReporteBtn.classList.add('bg-gray-700', 'hover:bg-gray-700', 'cursor-pointer');
            })
            .catch(error => {
                console.error('Error al generar vista previa:', error);
                reporteContenido.innerHTML = `<p class="text-red-500">Error al generar reporte: ${error.message}</p>`;
                mostrarMensaje('Error al generar el reporte. Por favor, inténtelo de nuevo.', 'error');
                imprimirReporteBtn.disabled = true; // Mantener deshabilitado en caso de error
                imprimirReporteBtn.classList.add('bg-gray-500', 'cursor-not-allowed');
                imprimirReporteBtn.classList.remove('bg-gray-700', 'hover:bg-gray-700', 'cursor-pointer');
            });
    }

    // La función generarPDF no está conectada a ningún botón en tu HTML.
    // Si deseas un botón "Exportar PDF" que use jspdf, necesitarías uno en el HTML
    // y un event listener para llamarla. El botón "Imprimir Reporte" usa window.print().
    function generarPDF() {
        // Esta función usa la biblioteca jspdf para generar un archivo PDF descargable.
        // Si el botón de "Imprimir Reporte" debería hacer esto, cambia su event listener.
        // Si prefieres imprimir directamente desde el navegador, window.print() es suficiente.
        if (Object.keys(reportesData).length === 0) {
            mostrarMensaje('Por favor, genere primero la vista previa del reporte.', 'error');
            return;
        }

        const pdfDoc = new jspdf.jsPDF('p', 'pt', 'letter');
        let y = 50;
        const pageWidth = pdfDoc.internal.pageSize.width;
        const margin = 20;

        pdfDoc.setFontSize(16);
        pdfDoc.text('Reporte Generado', margin, y);
        y += 20;

        // Define el mapeo de tipo de reporte a las claves esperadas para PDF (igual que para HTML)
        const reporteKeysPDF = {
            "sancionesUsuario": ["idSancion", "motivoSancion", "fechaSancion", "estado"],
            "historialPrestamosUsuario": ["idPrestamo", "fechaPrestamo", "horaPrestamo", "estado", "fechaDevolucionEstimada"],
            "equiposMasPrestados": ["nombre", "cantidadPrestada"], // Agrega aquí los demás reportes de tabla
            "prestamosPorFecha": ["idPrestamo", "usuario", "fechaPrestamo", "horaPrestamo", "estado"],
            "mantenimientos": ["idMantenimiento", "equipo", "fechaMantenimiento", "estadoInicial", "estadoFinal", "descripcionProblema", "solucionAplicada"],
            "prestamosFechaFecha": ["idPrestamo", "usuario", "fechaPrestamo", "horaPrestamo", "administrador"],
            "administradoresPrestamo": ["administrador", "fechaPrestamo", "horaPrestamo", "usuario"],
            "usuariosMasPrestaron": ["nombre", "apellido", "cantidadPrestamos"], // Añadido
            "sancionesActivasInactivas": ["estado", "cantidad"] // Añadido

        };

        // Define el orden de visualización para el PDF si es necesario (opcional, jspdf itera sobre claves)
        const userReportOrderPDF = ["infoUsuario", "historialPrestamosUsuario", "sancionesUsuario"];


        for (const reporteKey in reportesData) {
            if (reportesData.hasOwnProperty(reporteKey)) {
                // Si quieres un orden específico en PDF, necesitarías ajustar este bucle
                // para usar un array ordenado similar a como hicimos en mostrarVistaPrevia
                const reporte = reportesData[reporteKey];

                // Agrega una nueva página si no hay suficiente espacio para el título + al menos 2 líneas de contenido/datos
                if (y + 50 > pdfDoc.internal.pageSize.height - margin) {
                    pdfDoc.addPage();
                    y = margin; // Reset y al margen superior
                }


                pdfDoc.setFontSize(14);
                pdfDoc.text(reporte.titulo, margin, y);
                y += 20;

                if (reporte.tipo === 'tabla') {
                    const keys = reporteKeysPDF[reporteKey]; // Obtiene las claves esperadas para este reporte
                    if (!keys) {
                        console.error(`Error: No se encontró mapeo de claves para PDF para el reporte ${reporteKey}`);
                        if (y + 15 > pdfDoc.internal.pageSize.height - margin) { pdfDoc.addPage(); y = margin; }
                        pdfDoc.setFontSize(10);
                        pdfDoc.setTextColor(255, 0, 0); // Rojo
                        pdfDoc.text("Error interno al generar tabla PDF.", margin, y);
                        y += 15;
                        pdfDoc.setTextColor(0, 0, 0); // Negro de nuevo
                        continue; // Pasa al siguiente reporte
                    }

                    // NOTA: La generación de tablas en PDF con jspdf básico puede ser complicada y limitada.
                    // Se recomienda usar el plugin jspdf-autotable para una mejor experiencia.
                    // Si no usas autoTable, la lógica para posicionar texto y líneas manualmente sería compleja.
                    // La siguiente lógica es un intento simple, pero puede que no se vea como una tabla perfecta.

                    if (reporte.datos && reporte.datos.length > 0) {
                        // Renderizar cabeceras
                        pdfDoc.setFontSize(10);
                        let currentX = margin;
                        const colWidthEstimate = (pageWidth - 2 * margin) / reporte.cabecera.length; // Estimación simple de ancho de columna

                        reporte.cabecera.forEach(headerText => {
                            const textLines = pdfDoc.splitTextToSize(headerText, colWidthEstimate - 10); // Estimación de ancho con padding
                            if (y + (textLines.length * 12) > pdfDoc.internal.pageSize.height - margin) {
                                pdfDoc.addPage();
                                y = margin;
                                currentX = margin; // Reset X on new page
                            }
                            pdfDoc.text(textLines, currentX, y);
                            currentX += colWidthEstimate; // Avanzar X
                        });
                        y += 15; // Espacio después de cabeceras


                        // Renderizar datos
                        reporte.datos.forEach(fila => {
                            if (y + 20 > pdfDoc.internal.pageSize.height - margin) { // Espacio estimado por fila
                                pdfDoc.addPage();
                                y = margin;
                                currentX = margin; // Reset X on new page
                            }
                            currentX = margin; // Reset X al inicio de cada fila
                            keys.forEach(key => {
                                const dataValue = fila[key];
                                // Formatear la fecha/hora para PDF si es necesario
                                let displayValue = dataValue;
                                if (typeof dataValue === 'string' && dataValue.includes('T')) { // Asumiendo que las fechas/horas tienen 'T'
                                    try {
                                        const date = new Date(dataValue);
                                        if (!isNaN(date.getTime())) {
                                            if (key.toLowerCase().includes('hora') && key.toLowerCase().includes('fecha')) {
                                                displayValue = date.toLocaleString();
                                            } else if (key.toLowerCase().includes('fecha')) {
                                                displayValue = date.toLocaleDateString();
                                            } else if (key.toLowerCase().includes('hora')) {
                                                displayValue = date.toLocaleTimeString();
                                            } else {
                                                displayValue = dataValue;
                                            }
                                        } else {
                                            displayValue = dataValue;
                                        }
                                    } catch (e) {
                                        displayValue = dataValue;
                                    }
                                } else if (dataValue && typeof dataValue === 'string' && dataValue.match(/^\d{2}:\d{2}:\d{2}$/)) {
                                    displayValue = dataValue;
                                }


                                const textLines = pdfDoc.splitTextToSize(String(displayValue !== null && displayValue !== undefined ? displayValue : ''), colWidthEstimate - 10); // Estimación de ancho
                                pdfDoc.text(textLines, currentX, y);
                                currentX += colWidthEstimate; // Avanzar X
                            });
                            y += 20; // Espacio después de la fila
                        });
                        y += 10; // Espacio adicional después de la tabla
                    } else {
                        if (y + 15 > pdfDoc.internal.pageSize.height - margin) { pdfDoc.addPage(); y = margin; }
                        pdfDoc.setFontSize(10);
                        pdfDoc.text("No se encontraron datos para este reporte.", margin, y);
                        y += 15;
                    }


                } else if (reporte.tipo === 'lista') {
                    pdfDoc.setFontSize(12);
                    if (reporte.datos && reporte.datos.length > 0) {
                        reporte.datos.forEach(item => {
                            if (y + 15 > pdfDoc.internal.pageSize.height - margin) {
                                pdfDoc.addPage();
                                y = margin;
                            }
                            pdfDoc.text("• " + item, margin + 10, y); // Añadir viñeta
                            y += 15;
                        });
                        y += 10; // Espacio después de la lista
                    } else {
                        if (y + 15 > pdfDoc.internal.pageSize.height - margin) { pdfDoc.addPage(); y = margin; }
                        pdfDoc.setFontSize(10);
                        pdfDoc.text("No se encontraron datos para este reporte.", margin, y);
                        y += 15;
                    }

                }  else if (reporte.tipo === 'texto') {
                    pdfDoc.setFontSize(12);
                    if (reporte.datos && reporte.datos.trim() !== '') {
                        const textLines = pdfDoc.splitTextToSize(reporte.datos, pageWidth - 2 * margin);
                        if (y + (textLines.length * 15) > pdfDoc.internal.pageSize.height - margin) {
                            pdfDoc.addPage();
                            y = margin;
                        }
                        pdfDoc.text(textLines, margin, y);
                        y += (textLines.length * 15) + 20;
                    } else {
                        if (y + 15 > pdfDoc.internal.pageSize.height - margin) { pdfDoc.addPage(); y = margin; }
                        pdfDoc.setFontSize(10);
                        pdfDoc.text("No se encontró información para este reporte.", margin, y);
                        y += 15;
                    }
                }
                // Línea separadora si no es el último reporte
                if (reporteKey !== Object.keys(reportesData)[Object.keys(reportesData).length - 1]) {
                    if (y + 10 > pdfDoc.internal.pageSize.height - margin) { pdfDoc.addPage(); y = margin; }
                    // pdfDoc.line(margin, y - 5, pageWidth - margin, y - 5); // Dibuja una línea
                    y += 10; // Espacio después del reporte
                }
            }
        }

        pdfDoc.save('reporte.pdf');
        mostrarMensaje('Reporte PDF generado.', 'success');
    }

    // Función para mostrar la vista previa en el HTML
    function mostrarVistaPrevia(data) {
        let html = '';

        // --- Lógica para definir el orden de visualización ---
        // Orden deseado para reportes de usuario
        const userReportOrder = ["infoUsuario", "historialPrestamosUsuario", "sancionesUsuario"];
        // Orden deseado para reportes globales (puedes ajustar este orden si quieres)
        const globalReportOrder = ["equiposMasPrestados", "usuariosMasPrestaron", "prestamosPorFecha", "mantenimientos", "prestamosFechaFecha", "administradoresPrestamo", "sancionesActivasInactivas"];

        const reportKeysInOrder = [];

        // Primero añadir reportes de usuario en el orden definido, SÍ existen en los datos recibidos
        userReportOrder.forEach(key => {
            if (data.hasOwnProperty(key)) {
                reportKeysInOrder.push(key);
            }
        });

        // Luego añadir reportes globales (si los hay) en el orden definido
        globalReportOrder.forEach(key => {
            if (data.hasOwnProperty(key)) {
                reportKeysInOrder.push(key);
            }
        });

        // Si hay otros reportes no contemplados en los arrays anteriores, añadirlos al final
        Object.keys(data).forEach(key => {
            if (!reportKeysInOrder.includes(key)) {
                reportKeysInOrder.push(key);
            }
        });

        // --- Fin de la lógica para definir el orden ---


        // Define un mapeo de tipo de reporte a las claves esperadas EN ORDEN de las columnas
        // Este mapeo es necesario porque el backend solo envía el texto de la cabecera, no la clave.
        // EL ORDEN DE LAS CLAVES AQUÍ DEBE COINCIDIR EXACTAMENTE CON EL ORDEN EN QUE PONES LOS .put("clave", valor)
        // EN LOS MÉTODOS generarReporte... EN TU ReporteController.java
        const reporteKeysHTML = {
            "sancionesUsuario": ["idSancion", "motivoSancion", "fechaSancion", "estado"],
            "historialPrestamosUsuario": ["idPrestamo", "fechaPrestamo", "horaPrestamo", "estado", "fechaDevolucionEstimada"],
            "equiposMasPrestados": ["nombre", "cantidadPrestada"], // Agrega aquí los demás reportes de tabla
            "prestamosPorFecha": ["idPrestamo", "usuario", "fechaPrestamo", "horaPrestamo", "estado"],
            "mantenimientos": ["idMantenimiento", "equipo", "fechaMantenimiento", "estadoInicial", "estadoFinal", "descripcionProblema", "solucionAplicada"],
            "prestamosFechaFecha": ["idPrestamo", "usuario", "fechaPrestamo", "horaPrestamo", "administrador"],
            "administradoresPrestamo": ["administrador", "fechaPrestamo", "horaPrestamo", "usuario"],
            "usuariosMasPrestaron": ["nombre", "apellido", "cantidadPrestamos"],
            "sancionesActivasInactivas": ["idSancion", "usuario", "motivoSancion", "fechaSancion", "estado"] // <--- Asegúrate de que esté así
            // ... el resto del objeto reporteKeysHTML
        };


        // --- Modifica el bucle principal para iterar sobre reportKeysInOrder ---
        reportKeysInOrder.forEach(reporteKey => { // Cambia for...in por forEach en el array ordenado
            const reporte = data[reporteKey]; // Obtiene el reporte usando la clave del array ordenado

            // Si el reporte existe en los datos recibidos
            if (reporte) {
                // Resto de la lógica de renderizado (igual que antes)
                html += `<h3 class="text-lg font-semibold text-gray-700 mb-2">${reporte.titulo}</h3>`;

                if (reporte.tipo === 'tabla') {
                    const keys = reporteKeysHTML[reporteKey]; // Obtiene las claves esperadas para este reporte
                    if (!keys) {
                        console.error(`Error: No se encontró mapeo de claves para el reporte ${reporteKey} en mostrarVistaPrevia.`);
                        html += `<p class="text-red-500">Error interno al mostrar reporte.</p>`;
                        html += '<hr class="my-4">';
                        return; // Usar return en forEach para pasar al siguiente elemento
                    }

                    html += '<div class="overflow-x-auto">';
                    html += '<table class="min-w-full leading-normal shadow-md rounded-lg overflow-hidden">';
                    html += '<thead class="bg-gray-200 text-gray-700">';
                    html += '<tr>';
                    // Itera a través de las cabeceras para mostrarlas
                    reporte.cabecera.forEach(headerText => {
                        html += `<th class="px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold uppercase tracking-wider">${headerText}</th>`;
                    });
                    html += '</tr>';
                    html += '</thead>';
                    html += '<tbody class="bg-white">';
                    // Verifica si hay datos antes de iterar
                    if (reporte.datos && reporte.datos.length > 0) {
                        reporte.datos.forEach(fila => { // 'fila' es el Map de datos para una fila
                            html += '<tr>';
                            // Itera a través de las claves esperadas para acceder a los datos en el Map 'fila'
                            keys.forEach(key => {
                                // Accede al valor usando la clave
                                const dataValue = fila[key];
                                // Formatea la fecha/hora si es necesario (los timestamps ISO vienen como strings)
                                let displayValue = dataValue;
                                if (typeof dataValue === 'string' && dataValue.includes('T')) { // Asumiendo que las fechas/horas tienen 'T'
                                    try {
                                        const date = new Date(dataValue);
                                        // Verifica si es una fecha válida antes de formatear
                                        if (!isNaN(date.getTime())) {
                                            // Formato simple, ajusta según necesites.
                                            // Si la horaPrestamo viene como string "HH:mm:ss", no entrará aquí.
                                            // Si viene como parte de un timestamp ISO, lo formateamos.
                                            if (key.toLowerCase().includes('hora') && key.toLowerCase().includes('fecha')) { // Si la clave incluye ambos (timestamp completo)
                                                displayValue = date.toLocaleString(); // Ej: "5/2/2025, 8:26:56 AM"
                                            } else if (key.toLowerCase().includes('fecha')) { // Solo fecha
                                                displayValue = date.toLocaleDateString(); // Ej: "5/2/2025"
                                            } else if (key.toLowerCase().includes('hora')) { // Solo hora (si es un timestamp)
                                                displayValue = date.toLocaleTimeString(); // Ej: "8:26:56 AM"
                                            } else {
                                                displayValue = dataValue; // Si no es fecha/hora, usar valor original
                                            }
                                        } else {
                                            displayValue = dataValue; // No es una fecha válida, usar valor original
                                        }


                                    } catch (e) {
                                        console.error("Error formatting date:", dataValue, e);
                                        displayValue = dataValue; // Si falla el formato, muestra el valor original
                                    }
                                } else if (dataValue && typeof dataValue === 'string' && dataValue.match(/^\d{2}:\d{2}:\d{2}$/)) {
                                    // Manejar la hora si viene como string "HH:mm:ss"
                                    displayValue = dataValue;
                                }


                                html += `<td class="px-5 py-5 border-b border-gray-200 text-sm">${displayValue !== null && displayValue !== undefined ? displayValue : ''}</td>`;
                            });
                            html += '</tr>';
                        });
                    } else {
                        // Mostrar un mensaje si no hay datos
                        const colSpan = reporte.cabecera.length > 0 ? reporte.cabecera.length : 1;
                        html += `<tr><td class="px-5 py-5 border-b border-gray-200 text-sm text-center italic" colspan="${colSpan}">No se encontraron datos para este reporte.</td></tr>`;
                    }

                    html += '</tbody>';
                    html += '</table>';
                    html += '</div>';
                } else if (reporte.tipo === 'lista') {
                    // ... renderizado de lista (funciona porque datos es array de strings/primitivos)
                    if (reporte.datos && reporte.datos.length > 0) {
                        html += '<ul class="list-disc list-inside">';
                        reporte.datos.forEach(item => {
                            html += `<li>${item}</li>`;
                        });
                        html += '</ul>';
                    } else {
                        html += '<p class="text-gray-700 italic">No se encontraron datos para este reporte.</p>';
                    }
                }  else if (reporte.tipo === 'texto') {
                    // ... renderizado de texto (funciona porque datos es un string)
                    if (reporte.datos && reporte.datos.trim() !== '') {
                        html += `<p class="text-gray-700 whitespace-pre-line">${reporte.datos}</p>`;
                    } else {
                        html += '<p class="text-gray-700 italic">No se encontró información para este reporte.</p>';
                    }
                }
                html += '<hr class="my-4">'; // Separador entre reportes
            } // Fin if (reporte)
        }); // --- Fin del bucle forEach ---

        reporteContenido.innerHTML = html;
    }
    // Event listener para el botón Generar Reporte
    generarReporteBtn.addEventListener('click', generarVistaPrevia);
    // Event listener para el botón Imprimir Reporte (usa window.print())
    imprimirReporteBtn.addEventListener('click', () => {
        if (Object.keys(reportesData).length === 0) {
            mostrarMensaje('Por favor, genere primero la vista previa del reporte.', 'error');
            return;
        }
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
        // Limpiar campos de filtro
        document.querySelectorAll('input[type="date"], input[type="number"], select').forEach(input => {
            if (input.type === 'select-one') {
                input.selectedIndex = 0; // Reset selects to first option
            } else {
                input.value = ''; // Clear input fields
            }
        });
        // Desmarcar todos los checkboxes de reportes
        document.querySelectorAll('input[type="checkbox"][name^="reportes"]').forEach(checkbox => {
            checkbox.checked = false;
        });
        generarReporteBtn.disabled = true; // Deshabilitar botón generar
        generarReporteBtn.classList.add('bg-gray-500', 'cursor-not-allowed');
        generarReporteBtn.classList.remove('bg-indigo-500', 'hover:bg-indigo-700', 'cursor-pointer');

        imprimirReporteBtn.disabled = true; // Deshabilitar botón imprimir
        imprimirReporteBtn.classList.add('bg-gray-500', 'cursor-not-allowed');
        imprimirReporteBtn.classList.remove('bg-gray-700', 'hover:bg-gray-700', 'cursor-pointer');

        // Asegurarse de que los checkboxes de usuario estén deshabilitados
        toggleReportesUsuarioCheckboxes(true);

        // Eliminar mensajes flotantes
        const mensajesExistentes = document.querySelectorAll('.mensaje-flotante');
        mensajesExistentes.forEach(msg => msg.remove());

    });
    // Deshabilitar botones generar/imprimir al cargar la página
    generarReporteBtn.disabled = true;
    generarReporteBtn.classList.add('bg-gray-500', 'cursor-not-allowed');
    generarReporteBtn.classList.remove('bg-indigo-500', 'hover:bg-indigo-700', 'cursor-pointer');
    imprimirReporteBtn.disabled = true;
    imprimirReporteBtn.classList.add('bg-gray-500', 'cursor-not-allowed');
    imprimirReporteBtn.classList.remove('bg-gray-700', 'hover:bg-gray-700', 'cursor-pointer');
    // Cargar selects al inicio
    cargarLaboratorios();
    cargarCategorias(); // Cargar todas las categorías inicialmente
});