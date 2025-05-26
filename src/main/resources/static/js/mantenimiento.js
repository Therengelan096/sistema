window.selectedInstancias = [];
let mantenimientosData = [];
let currentMantenimientoId = null;
let detalleIdActual = null;
const detallesSection = document.getElementById('detalles-section');
const detallesSectionTitle = document.getElementById('detalles-section-title');
const currentMantenimientoNombre = document.getElementById('current-mantenimiento-nombre');
const detallesTbody = document.getElementById('detalles-body');
const mantenimientoListTitle = document.getElementById('mantenimiento-list-title');
const nuevoMantenimientoBtnContainer = document.getElementById('nuevo-mantenimiento-btn-container');
const API_BASE_URL = '';

function mostrarVistaMantenimientos() {
    const mantenimientoTableContainer = document.getElementById('mantenimiento-table-container');
    if (mantenimientoListTitle) {
        mantenimientoListTitle.classList.remove('hidden');
    }
    if (nuevoMantenimientoBtnContainer) {
        nuevoMantenimientoBtnContainer.classList.remove('hidden');
    }

    // Mostrar tabla principal
    if (mantenimientoTableContainer) {
        mantenimientoTableContainer.classList.remove('hidden');
    }

    // Ocultar sección de detalles
    if (detallesSection) {
        detallesSection.classList.add('hidden');
    }
}
function mostrarVistaDetalles() {
    const mantenimientoTableContainer = document.getElementById('mantenimiento-table-container');

    if (mantenimientoListTitle) {
        mantenimientoListTitle.classList.add('hidden');
    }
    if (nuevoMantenimientoBtnContainer) {
        nuevoMantenimientoBtnContainer.classList.add('hidden');
    }
    if (mantenimientoTableContainer) {
        mantenimientoTableContainer.classList.add('hidden');
    }

    if (detallesSection) {
        detallesSection.classList.remove('hidden');
    }
}

// --- Funciones para Cargar y Mostrar Detalles de Mantenimiento ---
function mostrarDetallesMantenimiento(detalles) {
    if (!detallesTbody) {
        console.error('No se encontró el tbody para los detalles de mantenimiento');
        return;
    }
    detallesTbody.innerHTML = '';

    if (!detalles || detalles.length === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td colspan="8" class="text-center">No hay detalles de mantenimiento disponibles</td>`;
        detallesTbody.appendChild(tr);
        return;
    }

    detalles.forEach(detalle => {
        const tr = document.createElement('tr');
        // Construye el HTML de la fila paso a paso
        let rowHtml = `
            <td>${detalle.idDetalleMant || ''}</td>
            <td>${detalle.instanciaEquipo ? detalle.instanciaEquipo.codigoActivo : 'N/A'}</td>
            <td>${detalle.estadoInicial || ''}</td>
            <td>${detalle.estadoFinal || ''}</td>
            <td>${detalle.problema || ''}</td>
            <td>${detalle.solucion || ''}</td>
            <td>${detalle.fase || ''}</td>
            <td>`;

        if (detalle.fase === 'reparado') {

            rowHtml += `<span class="badge bg-success">Reparado</span>`;

        } else {

            rowHtml += `
                <button class="btn btn-warning btn-sm me-1" onclick="editarDetalle(${detalle.idDetalleMant})">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-success btn-sm" onclick="mostrarFormularioReparacion(${detalle.idDetalleMant})">
                    <i class="bi bi-check-circle"></i>
                </button>`;
        }
        // *** Fin de la lógica CONDICIONAL ***

        rowHtml += `</td>`; // Cierra la celda de acciones

        tr.innerHTML = rowHtml; // Establece el HTML completo de la fila
        detallesTbody.appendChild(tr);
    });
}

window.mostrarDetallesEnModal = function (detalles) {
    const tbody = document.getElementById('detallesTableBody');
    tbody.innerHTML = '';
    detalles.forEach(d => {
        tbody.innerHTML += `
                <tr>
                    <td>${d.idDetalleMant}</td>
                    <td>${d.instanciaEquipo ? d.instanciaEquipo.codigoActivo : 'N/A'}</td>
                    <td>${d.estadoInicial}</td>
                    <td>${d.problema}</td>
                    <td>${d.fase}</td>
                    <td>
                        <button class="btn btn-success btn-sm" onclick="actualizarFase(${d.idDetalleMant})">
                            Actualizar Fase
                        </button>
                    </td>
                </tr>
            `;
    });
}
window.mostrarOpcionesInstancias = function(instanciasDisponibles) {
    const container = document.getElementById('instanciasContainer');
    if (!container) {
        console.error('No se encontró el contenedor de instancias');
        return;
    }

    // Limpiar el contenedor
    container.innerHTML = `
        <div class="mt-3">
            <h6>Instancias Disponibles</h6>
            <div class="form-check mb-3">
                <input class="form-check-input" type="checkbox" id="seleccionarTodas">
                <label class="form-check-label" for="seleccionarTodas">
                    Seleccionar todas
                </label>
            </div>
            <div id="lista-instancias" class="mt-2">
                ${instanciasDisponibles.map(inst => `
                    <div class="form-check">
                        <input class="form-check-input instancia-checkbox" type="checkbox" 
                            value="${inst.idInstancia}" id="inst-${inst.idInstancia}">
                        <label class="form-check-label" for="inst-${inst.idInstancia}">
                            ${inst.codigoActivo}
                        </label>
                    </div>
                `).join('')}
            </div>
            <div class="mt-3">
                <button type="button" class="btn btn-primary" id="btnConfirmarSeleccion">
                    Confirmar Selección
                </button>
            </div>
        </div>
    `;

    // Agregar event listeners después de crear el HTML
    const seleccionarTodas = document.getElementById('seleccionarTodas');
    const btnConfirmarSeleccion = document.getElementById('btnConfirmarSeleccion');

    if (seleccionarTodas) {
        seleccionarTodas.addEventListener('change', function(e) {
            const checkboxes = document.querySelectorAll('.instancia-checkbox');
            checkboxes.forEach(cb => {
                cb.checked = e.target.checked;
                const instancia = instanciasDisponibles.find(i => i.idInstancia === parseInt(cb.value));
                if (e.target.checked) {
                    if (!window.selectedInstancias.some(si => si.idInstancia === instancia.idInstancia)) {
                        window.selectedInstancias.push(instancia);
                    }
                } else {
                    window.selectedInstancias = window.selectedInstancias.filter(i => i.idInstancia !== instancia.idInstancia);
                }
            });
        });
    }

    // Event listener para el botón de confirmar selección
    if (btnConfirmarSeleccion) {
        btnConfirmarSeleccion.addEventListener('click', window.confirmarSeleccion);
    }

    // Event listeners para los checkboxes individuales
    document.querySelectorAll('.instancia-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', function(e) {
            const instancia = instanciasDisponibles.find(i => i.idInstancia === parseInt(this.value));
            if (this.checked) {
                if (!window.selectedInstancias.some(si => si.idInstancia === instancia.idInstancia)) {
                    window.selectedInstancias.push(instancia);
                }
            } else {
                window.selectedInstancias = window.selectedInstancias.filter(i => i.idInstancia !== instancia.idInstancia);
            }
        });
    });
}
window.confirmarSeleccion = function() {
    console.log('Función confirmarSeleccion llamada');
    console.log('Instancias seleccionadas:', window.selectedInstancias);

    if (!window.selectedInstancias || window.selectedInstancias.length === 0) {
        alert('Por favor, seleccione al menos una instancia');
        return;
    }

    window.mostrarConfirmacionInstancias();
};
window.verDetalles = async function(idMantenimiento) {
    currentMantenimientoId = idMantenimiento;
    const mantenimientoTitleElement = document.querySelector('#detalles-section-title span');
    if (mantenimientoTitleElement) {
        mantenimientoTitleElement.textContent = `#${idMantenimiento}`;
    }

    try {
        const response = await fetch(`/mantenimiento/${idMantenimiento}/detalles`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const detalles = await response.json();

        const thead = document.querySelector('#detalles-table thead');
        if (thead) {
            thead.innerHTML = `
                <tr>
                    <th>ID Detalle</th>
                    <th>Instancia</th>
                    <th>Estado Inicial</th>
                    <th>Estado Final</th>
                    <th>Problema</th>
                    <th>Solución</th>
                    <th>Fase</th>
                    <th>Acciones</th>
                </tr>
            `;
        }

        mostrarDetallesMantenimiento(detalles);
        mostrarVistaDetalles();
    } catch (error) {
        console.error('Error al cargar los detalles:', error);
        alert('Error al cargar los detalles del mantenimiento');
        // Opcionalmente, podrías mostrar un mensaje en la tabla de detalles
        if (detallesTbody) {
            detallesTbody.innerHTML = `<tr><td colspan="8" class="text-center text-danger">Error al cargar los detalles: ${error.message}</td></tr>`;
        }
        mostrarVistaDetalles();
    }
};
window.mostrarFormularioDetalles = function () {
    const detallesContainer = document.querySelector('.detalles-instancia');
    const detallesContent = document.getElementById('detallesInstanciasContainer');
    const confirmarContainer = document.getElementById('confirmarInstanciasContainer');
    if (!detallesContainer || !detallesContent) {
        console.error('No se encontraron elementos de detalles');
        return;
    }
    // Ocultar la confirmación y mostrar el formulario de detalles
    if (confirmarContainer) {
        confirmarContainer.style.display = 'none';
    }
    detallesContainer.style.display = 'block';
    detallesContent.innerHTML = '';
    // Crear formularios para cada instancia seleccionada
    window.selectedInstancias.forEach(instancia => {
        const detalleDiv = document.createElement('div');
        detalleDiv.className = 'mb-4 p-3 border rounded';
        detalleDiv.innerHTML = `
            <h6>Instancia: ${instancia.codigoActivo}</h6>
            <div class="mb-3">
                <label class="form-label">Estado Inicial</label>
                <select class="form-select" id="estado-inicial-${instancia.idInstancia}" required>
                    <option value="">Seleccione un estado</option>
                    <option value="Bueno">bueno</option>
                    <option value="Regular">regular</option>
                    <option value="Dañado">dañado</option>
                </select>      
            </div>
            <div class="mb-3">
                <label class="form-label">Problema</label>
                <textarea class="form-control" id="problema-${instancia.idInstancia}" required rows="2"></textarea>
            </div>           
             <input type="hidden" id="estado-final-${instancia.idInstancia}" value="">
            <input type="hidden" id="solucion-${instancia.idInstancia}" value="">

        `;
        detallesContent.appendChild(detalleDiv);
    });
}
window.mostrarConfirmacionInstancias = function () {
    const confirmarContainer = document.getElementById('confirmarInstanciasContainer');
    const instanciasContainer = document.getElementById('instanciasContainer');
    const listaInstancias = document.getElementById('listaInstanciasSeleccionadas');
    const listaInstanciasOriginal = document.getElementById('lista-instancias');

    if (!confirmarContainer) {
        console.error('No se encontró el contenedor de confirmación');
        return;
    }
    if (!instanciasContainer) {
        console.error('No se encontró el contenedor de instancias');
        return;
    }
    if (!listaInstancias) {
        console.error('No se encontró la lista de instancias seleccionadas');
        return;
    }
    if (!listaInstanciasOriginal) {
        console.error('No se encontró la lista de instancias original');
        return;
    }
    // Verificar que haya instancias seleccionadas
    if (!window.selectedInstancias || window.selectedInstancias.length === 0) {
        alert('Por favor, seleccione al menos una instancia');
        return;
    }
    // Ocultar selección y mostrar confirmación
    listaInstanciasOriginal.style.display = 'none';
    confirmarContainer.style.display = 'block';
    // Mostrar lista de instancias seleccionadas
    listaInstancias.innerHTML = `
        <div class="alert alert-light">
            <p>Se han seleccionado ${window.selectedInstancias.length} instancias:</p>
            <ul>
                ${window.selectedInstancias.map(inst => `
                    <li>${inst.codigoActivo}</li>
                `).join('')}
            </ul>
        </div>
    `;
    const btnVolverSeleccion = document.getElementById('btnVolverSeleccion');
    const btnConfirmarInstancias = document.getElementById('btnConfirmarInstancias');

    // Remover listeners anteriores si existen
    const nuevoVolverBtn = btnVolverSeleccion.cloneNode(true);
    const nuevoConfirmarBtn = btnConfirmarInstancias.cloneNode(true);
    btnVolverSeleccion.parentNode.replaceChild(nuevoVolverBtn, btnVolverSeleccion);
    btnConfirmarInstancias.parentNode.replaceChild(nuevoConfirmarBtn, btnConfirmarInstancias);

    // Agregar nuevos listeners
    nuevoVolverBtn.addEventListener('click', () => {
        confirmarContainer.style.display = 'none';
        listaInstanciasOriginal.style.display = 'block';
    });

    nuevoConfirmarBtn.addEventListener('click', () => {
        window.mostrarFormularioDetalles();
    });

    // Log para depuración
    console.log('Estado de los elementos:', {
        confirmarContainerVisible: confirmarContainer.style.display,
        listaInstanciasOriginalVisible: listaInstanciasOriginal.style.display,
        selectedInstancias: window.selectedInstancias.length
    });
};
// Función para cargar laboratorios
window.cargarLaboratorios = async function () {
    try {
        const response = await fetch(`${API_BASE_URL}/laboratorios`);
        if (!response.ok) throw new Error('Error al cargar laboratorios');
        const laboratorios = await response.json();

        const laboratorioSelects = document.querySelectorAll('#laboratorio');
        laboratorioSelects.forEach(select => {
            select.innerHTML = '<option value="">Seleccione laboratorio</option>';
            laboratorios.forEach(lab => {
                select.innerHTML += `<option value="${lab.idLaboratorio}">${lab.nombre}</option>`;
            });
        });
        // Si hay laboratorios, cargar las categorías del primero
        if (laboratorios.length > 0) {
            await cargarCategoriasPorLaboratorio(laboratorios[0].idLaboratorio);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al cargar laboratorios');
    }
};
// Función para cargar categorías por laboratorio
window.cargarCategoriasPorLaboratorio = async function (laboratorioId) {
    const categoriaSelects = document.querySelectorAll('#categoria');

    if (!laboratorioId) {
        categoriaSelects.forEach(select => {
            select.innerHTML = '<option value="">Todas las Categorías</option>';
        });
        return;
    }
    try {
        const response = await fetch(`${API_BASE_URL}/laboratorios/${laboratorioId}/categorias`);
        if (!response.ok) throw new Error('Error al cargar categorías');
        const categorias = await response.json();

        categoriaSelects.forEach(select => {
            select.innerHTML = '<option value="">Todas las Categorías</option>';
            categorias.forEach(cat => {
                select.innerHTML += `<option value="${cat.idCategoria}">${cat.nombreCategoria}</option>`;
            });
        });
        // Si hay categorías, cargar los equipos de la primera
        if (categorias.length > 0) {
            await cargarEquiposPorLaboratorio(laboratorioId, categorias[0].idCategoria);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al cargar categorías');
    }
};
// Función para cargar equipos por laboratorio
window.cargarEquiposPorLaboratorio = async function (laboratorioId, categoriaId = '') {
    const instanciasContainer = document.getElementById('instanciasContainer');
    if (!laboratorioId) {
        instanciasContainer.innerHTML = '';
        return;
    }
    try {
        let url = `${API_BASE_URL}/laboratorios/${laboratorioId}/equipos`;
        if (categoriaId) {
            url += `?categoriaId=${categoriaId}`;
        }
        const response = await fetch(url);
        if (!response.ok) throw new Error('Error al cargar equipos');
        const equipos = await response.json();
        if (equipos.length === 0) {
            instanciasContainer.innerHTML = '<p class="text-center">No hay equipos disponibles en este laboratorio (o categoría).</p>';
            return;
        }
        const equipoSelect = document.getElementById('equipo');
        equipoSelect.innerHTML = '<option value="">Seleccione equipo</option>';
        equipos.forEach(equipo => {
            equipoSelect.add(new Option(equipo.nombre, equipo.idEquipo));
        });
    } catch (error) {
        console.error('Error:', error);
        alert('Error al cargar equipos');
    }
};
// --- FUNCIONES DE CARGA (EXISTENTES) ---
window.cargarMantenimientos = async function () {
    console.log('Iniciando carga de mantenimientos...');

    const tablaBody = document.getElementById('mantenimientoTableBody');
    if (!tablaBody) {
        console.error('No se encontró el tbody con id "mantenimientoTableBody"');
        return;
    }

    try {
        const response = await fetch('/mantenimiento');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Datos recibidos:', data); // Para ver la estructura exacta de los datos

        if (!data || data.length === 0) {
            tablaBody.innerHTML = '<tr><td colspan="5" class="text-center">No hay mantenimientos registrados</td></tr>';
            return;
        }

        tablaBody.innerHTML = data.map(m => {
            // Manejo seguro del equipo
            let equipoInfo = 'N/A';
            if (m.equipo) {
                if (m.equipo.nombreEquipo) {
                    equipoInfo = m.equipo.nombreEquipo;
                } else if (m.equipo.idEquipo) {
                    equipoInfo = `Equipo #${m.equipo.idEquipo}`;
                }
            }

            return `
                <tr>
                    <td>${m.idMantenimiento || ''}</td>
                    <td>${equipoInfo}</td>
                    <td>${m.fechaMantenimiento ? new Date(m.fechaMantenimiento).toLocaleDateString() : ''}</td>
                    <td>${m.cantidad || ''}</td>
                    <td>
                        <button class="btn btn-info btn-sm" onclick="verDetalles(${m.idMantenimiento})">
                            Ver Detalles
                        </button>
                    </td>
                </tr>
            `;
        }).join('');

        console.log('Tabla actualizada exitosamente');
    } catch (error) {
        console.error('Error al cargar mantenimientos:', error);
        tablaBody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Error al cargar los datos</td></tr>';
    }
};
window.cargarMantenimientos();
mostrarVistaMantenimientos();

function mostrarFormularioReparacion(idDetalleMant) {
    detalleIdActual = idDetalleMant; // Guarda el ID del detalle
    const formularioFlotante = document.getElementById('reparacion-form-container');
    if (formularioFlotante) {
        formularioFlotante.style.display = 'block'; // Mostrar el formulario
    }
}

function cerrarFormularioReparacion() {
    const formulario = document.getElementById('reparacion-form-container');
    if (formulario) {
        formulario.style.display = 'none'; // Ocultar el formulario
    }
    detalleIdActual = null; // Limpia el ID global
}

async function guardarReparacion() {
    if (detalleIdActual === null) {
        console.error('No hay un ID de detalle para reparar.');
        alert('No se puede guardar la reparación. Intente de nuevo.');
        return;
    }

    const estadoFinal = document.getElementById('estado-final-reparacion').value;
    const solucion = document.getElementById('solucion-reparacion').value;

    if (!estadoFinal) {
        alert('Por favor, seleccione el estado final.');
        return;
    }

    const data = {
        estadoFinal: estadoFinal,
        solucion: solucion
    };
    console.log('detalleIdActual:', detalleIdActual);
    console.log('Datos a enviar:', data);

    try {
        const response = await fetch(`/mantenimiento/detalleMantenimiento/${detalleIdActual}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Error al guardar la reparación: ${errorText}`);
        }

        const detalleActualizado = await response.json();
        console.log('Detalle actualizado:', detalleActualizado);
        cerrarFormularioReparacion();
        await verDetalles(currentMantenimientoId);
        alert('Reparación guardada exitosamente.');

    } catch (error) {
        console.error('Error al guardar la reparación:', error);
        alert(error.message);
    }
}


document.addEventListener('DOMContentLoaded', function() {
    // Referencias de elementos (existentes)
    const sidebar = document.getElementById('sidebar');
    const content = document.getElementById('content');
    const mantenimientoModalElement = document.getElementById('mantenimientoModal');
    const mantenimientoForm = document.getElementById('mantenimientoForm');
    const laboratorioSelect = document.getElementById('laboratorio');
    const categoriaSelect = document.getElementById('categoria');
    const equipoSelect = document.getElementById('equipo');
    const instanciasContainer = document.getElementById('instanciasContainer');
    const confirmarContainer = document.getElementById('confirmarInstanciasContainer');
    const listaInstancias = document.getElementById('listaInstanciasSeleccionadas');
    const listaInstanciasOriginal = document.getElementById('lista-instancias');

    // Inicializar Modals de Bootstrap (existentes)
    const mantenimientoModal = new bootstrap.Modal(mantenimientoModalElement);

    // Log inicial de elementos críticos
    console.log('Estado inicial de elementos:', {
        confirmarContainer: !!document.getElementById('confirmarInstanciasContainer'),
        listaInstancias: !!document.getElementById('listaInstanciasSeleccionadas'),
        listaInstanciasOriginal: !!document.getElementById('lista-instancias')
    });
    // Event listener para nuevo mantenimiento (existente)
    document.getElementById('btnNuevoMantenimiento').addEventListener('click', () => {
        resetearFormulario();
        mantenimientoModal.show();
    });

    const backToMantenimientosBtn = document.getElementById('back-to-mantenimientos-btn');
    if (backToMantenimientosBtn) {
        backToMantenimientosBtn.addEventListener('click', mostrarVistaMantenimientos);
    } else {
        console.error('No se encontró el botón "Volver a Mantenimientos"');
    }
    const cancelarReparacionBtn = document.getElementById('cancelar-reparacion');
    const guardarReparacionBtn = document.getElementById('guardarReparacionBtn');

    if (guardarReparacionBtn) {
        guardarReparacionBtn.addEventListener('click', function(event) { // Añadido event
            event.preventDefault(); // Evita que el formulario se envíe y recargue la página
            guardarReparacion();
        });
    }

    if (cancelarReparacionBtn) {
        cancelarReparacionBtn.addEventListener('click', cerrarFormularioReparacion);
    }


// Función para cargar instancias de un equipo
    async function cargarInstancias(equipoId) {
        try {
            const response = await fetch(`/equipos/${equipoId}/instancias`);
            if (!response.ok) throw new Error('Error al cargar instancias');
            const instancias = await response.json();
            mostrarOpcionesInstancias(instancias); // Llama a la función existente
        } catch (error) {
            console.error('Error:', error);
            alert('Error al cargar instancias del equipo');
        }
    }
    function resetearFormulario() {
        if (!mantenimientoForm) {
            console.error('No se encontró el formulario');
            return;
        }
        mantenimientoForm.reset();
        selectedInstancias = [];
        const instanciasContainer = document.getElementById('instanciasContainer');
        const confirmarContainer = document.getElementById('confirmarInstanciasContainer');
        const detallesInstancia = document.querySelector('.detalles-instancia');
        if (instanciasContainer) {
            instanciasContainer.innerHTML = '';
        }
        if (confirmarContainer) {
            confirmarContainer.style.display = 'none';
        }
        if (detallesInstancia) {
            detallesInstancia.style.display = 'none';
        }
    }
    // Función para guardar mantenimiento (existente, con modificaciones menores)
    async function guardarMantenimiento(event) {
        event.preventDefault();

        try {
            // Verificar que tengamos instancias seleccionadas
            if (!window.selectedInstancias || window.selectedInstancias.length === 0) {
                throw new Error('No hay instancias seleccionadas');
            }

            // Obtener valores del formulario
            const fechaMantenimiento = document.getElementById('fechaMantenimiento').value;
            const equipoId = document.getElementById('equipo').value;

            // Crear array de detalles
            const detalles = window.selectedInstancias.map(instancia => {
                const idInstancia = instancia.idInstancia;
                const estadoInicial = document.getElementById(`estado-inicial-${idInstancia}`).value.trim();
                const problema = document.getElementById(`problema-${idInstancia}`).value.trim();

                // Validar campos requeridos
                if (!estadoInicial  || !problema ) {
                    throw new Error('Todos los campos son requeridos para cada instancia');
                }
                return {
                    instanciaEquipo: {
                        id: idInstancia
                    },
                    estadoInicial: estadoInicial,
                    estadoFinal: null,
                    problema: problema,
                    solucion: null,
                    fase: "mantenimiento"
                };
            });

            const mantenimientoData = {
                equipo: {
                    id: parseInt(equipoId)
                },
                fechaMantenimiento: fechaMantenimiento,
                cantidad: window.selectedInstancias.length,
                detalles: detalles
            };

            console.log('Datos a enviar al servidor:', JSON.stringify(mantenimientoData, null, 2));
            const response = await fetch('/mantenimiento', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(mantenimientoData)
            });

            const responseText = await response.text();
            console.log('Respuesta del servidor:', responseText);

            if (!response.ok) {
                throw new Error(`Error del servidor: ${responseText}`);
            }

            const modal = bootstrap.Modal.getInstance(document.getElementById('mantenimientoModal'));
            modal.hide();
            document.getElementById('mantenimientoForm').reset();
            window.selectedInstancias = [];
            await cargarMantenimientos();
            alert('Mantenimiento guardado exitosamente');

        } catch (error) {
            console.error('Error completo:', error);
            alert(`Error al guardar el mantenimiento: ${error.message}`);
        }
    }
    // Event listeners para selectores en cascada y formulario (existentes, con ajustes)
    mantenimientoForm.addEventListener('submit', guardarMantenimiento);
    laboratorioSelect.addEventListener('change', function () {
        const laboratorioId = this.value;
        cargarCategoriasPorLaboratorio(laboratorioId);
        equipoSelect.innerHTML = '<option value="">Seleccionar Equipo</option>';
        instanciasContainer.innerHTML = '';
        selectedInstancias = [];
    });
    categoriaSelect.addEventListener('change', function () {
        const laboratorioId = laboratorioSelect.value;
        const categoriaId = this.value;
        cargarEquiposPorLaboratorio(laboratorioId, categoriaId);
        instanciasContainer.innerHTML = '';
        selectedInstancias = [];
    });
    equipoSelect.addEventListener('change', function () {
        const equipoId = this.value;
        if (equipoId) {
            cargarInstancias(equipoId);
        } else {
            instanciasContainer.innerHTML = '';
            selectedInstancias = [];
        }
    });

    cargarLaboratorios();
    const toggleSidebarBtn = document.getElementById('toggleSidebar');
    toggleSidebarBtn.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
        content.classList.toggle('sidebar-collapsed');
    });
    document.querySelector('.logout-btn').addEventListener('click', function (e) {
        e.preventDefault();
        window.location.href = '/login.html';
    });
});





