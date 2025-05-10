window.selectedInstancias = [];
let mantenimientosData = [];

// Función para editar detalle
window.editarDetalle = async function(idDetalle) {
    try {
        const response = await fetch(`/mantenimiento/detalleMantenimiento/${idDetalle}`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const detalle = await response.json();

        // Llenar el formulario
        document.getElementById('editDetalleId').value = detalle.idDetalleMant;
        document.getElementById('editEstadoInicial').value = detalle.estadoInicial || '';
        document.getElementById('editEstadoFinal').value = detalle.estadoFinal || '';
        document.getElementById('editProblema').value = detalle.problema || '';
        document.getElementById('editSolucion').value = detalle.solucion || '';

        const editarModal = new bootstrap.Modal(document.getElementById('editarDetalleModal'));
        editarModal.show();
    } catch (error) {
        console.error('Error al obtener el detalle:', error);
        alert('Error al cargar los datos del detalle');
    }
};

// Evento submit del formulario
document.getElementById('editarDetalleForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const idDetalle = document.getElementById('editDetalleId').value;

    const detalleActualizado = {
        estadoInicial: document.getElementById('editEstadoInicial').value.trim(),
        estadoFinal: document.getElementById('editEstadoFinal').value.trim(),
        problema: document.getElementById('editProblema').value.trim(),
        solucion: document.getElementById('editSolucion').value.trim()
    };

    try {
        const response = await fetch(`/mantenimiento/detalleMantenimiento/${idDetalle}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(detalleActualizado)
        });

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }

        const result = await response.json();

        // Cerrar el modal
        const editarModal = bootstrap.Modal.getInstance(document.getElementById('editarDetalleModal'));
        editarModal.hide();

        // Recargar la lista de detalles
        if (result.idMantenimiento) {
            await verDetalles(result.idMantenimiento);
        }

        alert('Detalle actualizado exitosamente');
    } catch (error) {
        console.error('Error al actualizar:', error);
        alert('Error al actualizar el detalle');
    }
});


// Agregar el evento submit para el formulario de edición
document.getElementById('editarDetalleForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const idDetalle = document.getElementById('editDetalleId').value;
    const detalleActualizado = {
        estadoInicial: document.getElementById('editEstadoInicial').value,
        estadoFinal: document.getElementById('editEstadoFinal').value,
        problema: document.getElementById('editProblema').value,
        solucion: document.getElementById('editSolucion').value
    };

    try {
        const response = await fetch(`http://localhost:8083/mantenimiento/detalleMantenimiento/${idDetalle}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(detalleActualizado)
        });

        if (!response.ok) {
            throw new Error('Error al actualizar el detalle');
        }

        const result = await response.json();

        // Cerrar el modal
        const editarModal = bootstrap.Modal.getInstance(document.getElementById('editarDetalleModal'));
        editarModal.hide();

        // Recargar los detalles del mantenimiento
        if (result.idMantenimiento) {
            await window.verDetalles(result.idMantenimiento);
        }

        alert('Detalle actualizado exitosamente');
    } catch (error) {
        console.error('Error:', error);
        alert('Error al actualizar el detalle');
    }
});



window.mostrarDetallesEnModal = function (detalles) {
    const tbody = document.getElementById('detallesTableBody');
    tbody.innerHTML = '';
    detalles.forEach(d => {
        tbody.innerHTML += `
                <tr>
                    <td>${d.idDetalleMant}</td>
                    <td>${d.instanciaEquipo ? d.instanciaEquipo.codigoActivo : 'N/A'}</td>
                    <td>${d.estadoInicial}</td>
                    <td>${d.estadoFinal}</td>
                    <td>${d.problema}</td>
                    <td>${d.solucion}</td>
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

// Funciones auxiliares que deben estar disponibles globalmente (existentes, con modificaciones)
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
    try {
        window.currentMantenimientoId = idMantenimiento; // Guardar el ID del mantenimiento actual
        const response = await fetch(`http://localhost:8083/mantenimiento/${idMantenimiento}/detalles`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const detalles = await response.json();
        const detallesTableBody = document.getElementById('detallesTableBody');

        if (!detalles || detalles.length === 0) {
            detallesTableBody.innerHTML = '<tr><td colspan="8" class="text-center">No hay detalles disponibles</td></tr>';
            return;
        }

        detallesTableBody.innerHTML = detalles.map(detalle => `
            <tr>
                <td>${detalle.idDetalleMant || ''}</td>
                <td>${detalle.instanciaEquipo ? detalle.instanciaEquipo.codigoActivo : 'N/A'}</td>
                <td>${detalle.estadoInicial || ''}</td>
                <td>${detalle.estadoFinal || ''}</td>
                <td>${detalle.problema || ''}</td>
                <td>${detalle.solucion || ''}</td>
                <td>${detalle.fase || ''}</td>
                <td>
                    <button class="btn btn-warning btn-sm me-1" onclick="editarDetalle(${detalle.idDetalleMant})">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-success btn-sm" onclick="actualizarFase(${detalle.idDetalleMant})">
                        <i class="bi bi-check-circle"></i>
                    </button>
                </td>
            </tr>
        `).join('');

        const detallesModal = new bootstrap.Modal(document.getElementById('detallesModal'));
        detallesModal.show();
    } catch (error) {
        console.error('Error al cargar los detalles:', error);
        alert('Error al cargar los detalles del mantenimiento');
    }
};


window.actualizarFase = async function(idDetalleMant) {
    try {
        const response = await fetch(`http://localhost:8083/detalleMantenimiento/${idDetalleMant}/reparar`, { //AUN NO EXISTE ESTE ENDPOINT
            method: 'PUT',
        });
        if (!response.ok) {
            throw new Error('Error al actualizar la fase del detalle');
        }
        const data = await response.json();
        alert(data.mensaje); // Mostrar mensaje de éxito
        // Recargar los detalles del mantenimiento para reflejar los cambios
        //const mantenimientoId = document.querySelector('#detallesModal h5').textContent.split(' ')[3]; //EXTRAER EL ID DE MANTENIMIENTO
        const mantenimientoId = data.idMantenimiento; // El backend debe devolver el ID del mantenimiento
        if (mantenimientoId) {
            window.verDetalles(mantenimientoId);
        } else {
            window.cargarMantenimientos();
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al marcar como reparado');
    }

}

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
            <div class="row mb-3">
                <div class="col-md-6">
                    <label class="form-label">Estado Inicial</label>
                    <input type="text" class="form-control" id="estado-inicial-${instancia.idInstancia}" required>
                </div>
                <div class="col-md-6">
                    <label class="form-label">Estado Final</label>
                    <input type="text" class="form-control" id="estado-final-${instancia.idInstancia}" required>
                </div>
            </div>
            <div class="mb-3">
                <label class="form-label">Problema</label>
                <textarea class="form-control" id="problema-${instancia.idInstancia}" required rows="2"></textarea>
            </div>
            <div class="mb-3">
                <label class="form-label">Solución</label>
                <textarea class="form-control" id="solucion-${instancia.idInstancia}" rows="2"></textarea>
            </div>
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

    // Configurar botones
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
        const response = await fetch('http://localhost:8083/laboratorios');
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
        const response = await fetch(`http://localhost:8083/laboratorios/${laboratorioId}/categorias`);
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
        let url = `http://localhost:8083/laboratorios/${laboratorioId}/equipos`;
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
        const response = await fetch('http://localhost:8083/mantenimiento');
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



window.actualizarTablaMantenimientos = function (mantenimientos) {
    const tbody = document.getElementById('mantenimientoTableBody');
    if (!tbody) {
        console.error('No se encontró el elemento mantenimientoTableBody');
        return;
    }

    tbody.innerHTML = '';

    if (!mantenimientos || mantenimientos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">No hay mantenimientos registrados</td></tr>';
        return;
    }

    mantenimientos.forEach(m => {
        tbody.innerHTML += `
            <tr>
                <td>${m.idMantenimiento}</td>
                <td>${m.equipo ? m.equipo.nombre : 'N/A'}</td>
                <td>${new Date(m.fechaMantenimiento).toLocaleDateString()}</td>
                <td>${m.cantidad}</td>
                <td>
                    <button class="btn btn-info btn-sm" onclick="verDetalles(${m.idMantenimiento})">
                        Ver Detalles
                    </button>
                </td>
            </tr>
        `;
    });
};



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
    const detallesModalElement = document.getElementById('detallesModal');
    const confirmarContainer = document.getElementById('confirmarInstanciasContainer');
    const listaInstancias = document.getElementById('listaInstanciasSeleccionadas');
    const listaInstanciasOriginal = document.getElementById('lista-instancias');

    // Inicializar Modals de Bootstrap (existentes)
    const mantenimientoModal = new bootstrap.Modal(mantenimientoModalElement);
    const detallesModal = new bootstrap.Modal(detallesModalElement);

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


    const editarDetalleForm = document.getElementById('editarDetalleForm');

    editarDetalleForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const idDetalle = document.getElementById('editDetalleId').value;
        const detalleActualizado = {
            estadoInicial: document.getElementById('editEstadoInicial').value,
            estadoFinal: document.getElementById('editEstadoFinal').value,
            problema: document.getElementById('editProblema').value,
            solucion: document.getElementById('editSolucion').value
        };

        try {
            const response = await fetch(`http://localhost:8083/detalleMantenimiento/${idDetalle}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(detalleActualizado)
            });

            if (!response.ok) {
                throw new Error('Error al actualizar el detalle');
            }

            // Cerrar el modal de edición
            const editarModal = bootstrap.Modal.getInstance(document.getElementById('editarDetalleModal'));
            editarModal.hide();

            // Recargar los detalles
            const idMantenimiento = window.currentMantenimientoId; // Necesitas mantener esta variable
            if (idMantenimiento) {
                window.verDetalles(idMantenimiento);
            }

            alert('Detalle actualizado exitosamente');
        } catch (error) {
            console.error('Error:', error);
            alert('Error al actualizar el detalle');
        }
    });



// Función para cargar instancias de un equipo
    async function cargarInstancias(equipoId) {
        try {
            const response = await fetch(`http://localhost:8083/equipos/${equipoId}/instancias`);
            if (!response.ok) throw new Error('Error al cargar instancias');
            const instancias = await response.json();
            mostrarOpcionesInstancias(instancias); // Llama a la función existente
        } catch (error) {
            console.error('Error:', error);
            alert('Error al cargar instancias del equipo');
        }
    }


// Modificar la función resetearFormulario
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
                const estadoFinal = document.getElementById(`estado-final-${idInstancia}`).value.trim();
                const problema = document.getElementById(`problema-${idInstancia}`).value.trim();
                const solucion = document.getElementById(`solucion-${idInstancia}`).value.trim();

                // Validar campos requeridos
                if (!estadoInicial || !estadoFinal || !problema || !solucion) {
                    throw new Error('Todos los campos son requeridos para cada instancia');
                }

                return {
                    instanciaEquipo: {
                        id: idInstancia
                    },
                    estadoInicial: estadoInicial,
                    estadoFinal: estadoFinal,
                    problema: problema,
                    solucion: solucion,
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

            // *** AGREGAR ESTE LOG ***
            console.log('Datos a enviar al servidor:', JSON.stringify(mantenimientoData, null, 2));

            // Realizar la petición POST
            const response = await fetch('http://localhost:8083/mantenimiento', {
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
    // Llamar a la inicialización
    cargarLaboratorios(); // Cargar laboratorios al inicio
    cargarMantenimientos();
    // Mantener el código del sidebar (existente)
    const toggleSidebarBtn = document.getElementById('toggleSidebar');
    toggleSidebarBtn.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
        content.classList.toggle('sidebar-collapsed');
    });
    // Redirección al cerrar sesión (existente)
    document.querySelector('.logout-btn').addEventListener('click', function (e) {
        e.preventDefault();
        window.location.href = '/login.html';
    });

});





