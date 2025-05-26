// --- Variables y Referencias del DOM ---
const numColum = 4;
const sidebar = document.getElementById('sidebar');
const content = document.getElementById('content');
const toggleSidebarBtn = document.getElementById('toggleSidebar');

// Elementos del formulario de Tipo de Equipo
const tipoEquipoFormContainer = document.getElementById('tipo-equipo-form-container');
const equipoForm = document.getElementById('equipo-form');
const idEquipoInput = document.getElementById('idEquipo');
const nombreInput = document.getElementById('nombre');
const descripcionInput = document.getElementById('descripcion');
const categoriaIdSelect = document.getElementById('categoriaId');
const laboratorioIdSelect = document.getElementById('laboratorioId'); // Laboratorio general del tipo
const cantidadInput = document.getElementById('cantidad'); // Cantidad inicial
const marcaInput = document.getElementById('marca');
const cancelEditTypeBtn = document.getElementById('cancel-edit-type');


// Elementos de la Tabla de Tipos de Equipo
const tiposEquipoTableContainer = document.getElementById('tipos-equipo-table-container');
const equiposTbody = document.getElementById('equipos-body'); // Body de la tabla de tipos

// === ELEMENTOS PARA LISTAR INSTANCIAS INDIVIDUALES (SIN EDICIÓN) ===
const instanciasSection = document.getElementById('instancias-section'); // Contenedor principal de la sección de instancias
const instanciasSectionTitle = document.getElementById('instancias-section-title'); // Título de la sección de instancias
const currentInstanceTypeName = document.getElementById('current-instance-type-name'); // Para mostrar el nombre del tipo actual
const instanciasTbody = document.getElementById('instancias-body'); // Body de la tabla de instancias individuales
const backToTypesBtn = document.getElementById('back-to-types-btn'); // Botón para volver a la vista de tipos

// --- Eliminadas referencias al formulario de edición de instancia ---


// --- URLs del API ---
const API_BASE_URL = '/equipos';
const API_CATEGORIAS_URL = '/categorias';
const API_LABORATORIOS_URL = '/laboratorios';
const API_INSTANCIAS_URL = `${API_BASE_URL}/instancias`;
// --- Variables de estado ---
let currentTipoEquipoId = null; // Variable para guardar el ID del tipo cuando vemos sus instancias

// --- Funciones de Carga Inicial ---

// Cargar categorías para el select en el formulario de tipo
function cargarCategorias() {
    fetch(API_CATEGORIAS_URL)
        .then(res => res.json())
        .then(data => {
            categoriaIdSelect.innerHTML = '<option value="" disabled selected>Seleccionar Categoría</option>'; // Limpiar antes de cargar
            data.forEach(categoria => {
                const option = document.createElement('option');
                // Usar los nombres de propiedad que vienen del backend (deben coincidir con los nombres de columna DB)
                option.value = categoria.idCategoria;
                option.textContent = categoria.nombreCategoria;
                categoriaIdSelect.appendChild(option);
            });
        })
        .catch(err => console.error('Error al cargar categorías:', err));
}

// Cargar laboratorios para el select en el formulario de tipo
function cargarLaboratorios() {
    fetch(API_LABORATORIOS_URL)
        .then(res => res.json())
        .then(data => {
            laboratorioIdSelect.innerHTML = '<option value="" disabled selected>Seleccionar Laboratorio</option>'; // Limpiar antes de cargar
            data.forEach(laboratorio => {
                const option = document.createElement('option');
                // Usar los nombres de propiedad que vienen del backend
                option.value = laboratorio.idLaboratorio; // Asumiendo idLaboratorio en JSON
                option.textContent = laboratorio.nombre; // Asumiendo nombre en JSON
                laboratorioIdSelect.appendChild(option);
            });
        })
        .catch(err => console.error('Error al cargar laboratorios:', err));
}

// Cargar y mostrar la lista de TIPOS de Equipo
function cargarTiposEquipo() {
    fetch(API_BASE_URL) // Llama a GET /equipos (ahora con FETCH JOIN para Cat/Lab)
        .then(res => res.json())
        .then(data => {
            equiposTbody.innerHTML = ''; // Limpiar la tabla de tipos
            data.forEach(equipo => {
                const row = document.createElement('tr');
                row.innerHTML = `
            <td>${equipo.idEquipo}</td>
            <td>${equipo.nombre}</td>
            <td>${equipo.categoria?.nombreCategoria || 'N/A'}</td>
            <td>${equipo.laboratorio?.nombre || 'N/A'}</td>
            <td>${equipo.descripcion}</td>
            <td>${equipo.cantidad}</td>
            <td>${equipo.marca}</td>
            <td>
              <button class="btn btn-sm btn-warning me-1 edit-type-btn" data-id="${equipo.idEquipo}">Editar Tipo</button>
              <button class="btn btn-sm btn-info view-instances-btn" data-id="${equipo.idEquipo}" data-nombre="${equipo.nombre}">Ver Instancias</button>
            </td>
          `;
                equiposTbody.appendChild(row);
            });
            attachEventListeners(); // Adjuntar event listeners a los botones (Editar Tipo, Ver Instancias)
        })
        .catch(err => console.error('Error al cargar tipos de equipos:', err));
}

// --- Funciones para Manejar Vistas ---

// Muestra la sección de formulario/tabla de Tipos y oculta la de Instancias
function mostrarVistaTipos() {
    tipoEquipoFormContainer.classList.remove('hidden');
    tiposEquipoTableContainer.classList.remove('hidden');
    instanciasSection.classList.add('hidden');
    // Removido: instanciaEditFormContainer.classList.add('hidden');
    resetFormularioTipo(); // Limpiar formulario de tipo al volver
}

// Muestra la sección de Instancias y oculta la de Tipos
function mostrarVistaInstancias() {
    tipoEquipoFormContainer.classList.add('hidden');
    tiposEquipoTableContainer.classList.add('hidden');
    instanciasSection.classList.remove('hidden');
    // Removido: instanciaEditFormContainer.classList.add('hidden');
}

// --- Funciones para Cargar y Mostrar Instancias (SOLO LISTAR) ---
function mostrarInstancias(instancias) {
    const tbody = document.getElementById('instancias-body');
    tbody.innerHTML = '';

    if (!instancias || instancias.length === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td colspan="${numColum}">No hay instancias disponibles</td>`;
        tbody.appendChild(tr);
        return;
    }

    instancias.forEach(instancia => {
        const tr = document.createElement('tr');

        tr.innerHTML = `
            <td>${instancia.idInstancia}</td>
            <td>${instancia.codigoActivo}</td>
            <td>${instancia.estadoIndividual || 'N/A'}</td>
            <td>${instancia.fechaAdquisicion ? new Date(instancia.fechaAdquisicion).toLocaleDateString() : 'N/A'}</td>
        `;
        tbody.appendChild(tr);
    });
}

// Cargar y mostrar las instancias individuales para un tipo de equipo específico
function cargarInstanciasPorTipo(equipoId, tipoNombre) {
    currentTipoEquipoId = equipoId;
    currentInstanceTypeName.textContent = tipoNombre;
    instanciasSectionTitle.textContent = `Instancias Individuales (${tipoNombre})`;

    fetch(`${API_BASE_URL}/${equipoId}/instancias`)
        .then(res => {
            if (!res.ok) {
                throw new Error(`Error al cargar instancias: ${res.statusText}`);
            }
            return res.json();
        })
        .then(data => {

            const thead = document.querySelector('#instancias-table thead');
            if (thead) {
                thead.innerHTML = `
                    <tr>
                        <th>ID Instancia</th>
                        <th>Código Activo</th>
                        <th>Estado Individual</th>
                        <th>Fecha Adquisición</th>
                    </tr>
                `;
            }

            mostrarInstancias(data);
            mostrarVistaInstancias();
        })
        .catch(err => {
            console.error('Error al cargar instancias:', err);
            instanciasTbody.innerHTML = `<tr><td colspan="${numColum}" class="text-center text-danger">Error al cargar instancias: ${err.message}</td></tr>`;
            mostrarVistaInstancias();
        });
}
// REMOVED: Función cargarDatosInstanciaParaEdicion (no se editan instancias)
// REMOVED: Función resetFormularioInstancia (no hay form de instancia)
// --- Manejo de Formularios y Eventos ---
// Adjuntar Event Listeners a botones (se llama después de cargar la tabla de tipos)
function attachEventListeners() {
    // Listeners para botones "Editar Tipo" (en la tabla de tipos)
    document.querySelectorAll('.edit-type-btn').forEach(button => {
        button.removeEventListener('click', handleEditTypeClick); // Evitar duplicados
        button.addEventListener('click', handleEditTypeClick);
    });
    // Listeners para botones "Ver Instancias" (en la tabla de tipos)
    document.querySelectorAll('.view-instances-btn').forEach(button => {
        button.removeEventListener('click', handleViewInstancesClick); // Evitar duplicados
        button.addEventListener('click', handleViewInstancesClick);
    });
    // REMOVED: Listeners para botones "Editar Instancia" (no existen)
    // REMOVED: Listeners para el formulario de Instancia (no existe)
    // REMOVED: Listener para botón cancelar edición de instancia (no existe)
}
// Listener para el clic en el botón "Editar Tipo"
function handleEditTypeClick(event) {
    const id = event.target.dataset.id;
    // Fetch los datos completos del tipo para llenar el formulario de edición
    fetch(`${API_BASE_URL}/${id}`) // Llama a GET /equipos/{id}
        .then(res => {
            if (!res.ok) {
                throw new Error(`Error al cargar tipo para edición: ${res.statusText}`);
            }
            return res.json();
        })
        .then(equipo => {
            // Llenar formulario con datos del tipo
            idEquipoInput.value = equipo.idEquipo;
            nombreInput.value = equipo.nombre;
            descripcionInput.value = equipo.descripcion;
            cantidadInput.value = equipo.cantidad;
            marcaInput.value = equipo.marca;

            // Llenar selects para Categoría y Laboratorio
            // Asumimos que cargarCategorias y cargarLaboratorios ya se ejecutaron
            categoriaIdSelect.value = equipo.categoria?.idCategoria || '';
            laboratorioIdSelect.value = equipo.laboratorio?.idLaboratorio || '';

            // Cambiar texto del botón y mostrar cancelar si es edición
            equipoForm.querySelector('button[type="submit"]').textContent = 'Actualizar Tipo';
            cancelEditTypeBtn.classList.remove('hidden');
            tipoEquipoFormContainer.scrollIntoView({ behavior: 'smooth' }); // Desplazar a la vista del formulario
        })
        .catch(err => console.error('Error al cargar tipo para editar:', err));
}

// Listener para el clic en el botón "Ver Instancias"
function handleViewInstancesClick(event) {
    const equipoId = event.target.dataset.id;
    const tipoNombre = event.target.dataset.nombre;
    cargarInstanciasPorTipo(equipoId, tipoNombre); // Carga y muestra las instancias para este tipo
}
// Enviar formulario de TIPO (guardar nuevo tipo/unidades o actualizar tipo)
equipoForm.addEventListener('submit', function (e) {
    e.preventDefault();

    const idEquipo = idEquipoInput.value;
    const esEdicion = !!idEquipo;
    // validar campos obligatorios
    if (!nombreInput.value || !categoriaIdSelect.value || !laboratorioIdSelect.value || !cantidadInput.value) {
        alert('Por favor, complete todos los campos obligatorios');
        return;
    }
    const equipoData = {
        nombre: nombreInput.value,
        descripcion: descripcionInput.value,
        // Enviar solo el objeto con el ID para ManyToOne
        categoria: { idCategoria: parseInt(categoriaIdSelect.value) },
        laboratorio: { idLaboratorio: parseInt(laboratorioIdSelect.value) },
        cantidad: Math.max(1,parseInt(cantidadInput.value)||1),// Usado al CREAR tipo
        marca: marcaInput.value
    };
    const url = esEdicion
        ? `${API_BASE_URL}/${idEquipo}` // PUT para actualizar tipo
        : API_BASE_URL; // POST para crear nuevo tipo y unidades

    fetch(url, {
        method: esEdicion ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(equipoData)
    })
        .then(res => {
            if (!res.ok) {
                // Manejar errores del API
                    throw new Error("Error en la operacion");
                }
            return res.json(); // Asumimos que backend devuelve el objeto (creado o actualizado)
        })
        .then(data => {
            // Éxito al guardar/actualizar tipo (y crear instancias si fue POST)
            alert('Operación exitosa'); // Mensaje de éxito
            mostrarVistaTipos(); // Vuelve a la vista de tipos
            cargarTiposEquipo(); // Recarga la lista de tipos para ver los cambios
            resetFormularioTipo(); // Limpia el formulario de tipo
        })
        .catch(err => {
            console.error('Error al guardar/actualizar tipo de equipo:', err);
            alert("No se pudo completar la operacion"); // Mostrar un mensaje de error al usuario
        });

});


// REMOVED: Listener para el formulario de INSTANCIA INDIVIDUAL (no existe)


// --- Funciones de Reset ---

// Limpiar el formulario de Tipo de Equipo
function resetFormularioTipo() {
    equipoForm.reset();
    idEquipoInput.value = '';
    equipoForm.querySelector('button[type="submit"]').textContent = 'Guardar Tipo y Unidades';
    cancelEditTypeBtn.classList.add('hidden');
    // Resetear selects a la primera opción
    categoriaIdSelect.value = '';
    laboratorioIdSelect.value = '';
}

// REMOVED: Función para limpiar formulario de instancia (no existe)


// --- Event Listeners Iniciales ---

// Evento para el botón de cancelar edición de tipo
cancelEditTypeBtn.addEventListener('click', resetFormularioTipo);

// REMOVED: Evento para el botón de cancelar edición de instancia (no existe)

// Evento para el botón "Volver a Tipos de Equipo"
backToTypesBtn.addEventListener('click', mostrarVistaTipos);


// Redirige a login.html después de cerrar sesión (si ese es el flujo)
document.querySelector('.logout-btn').addEventListener('click', function (e) {
    e.preventDefault();
    // Implementar lógica real de logout en backend si es necesario
    window.location.href = '/login.html'; // Redirige al frontend
});

// --- Carga Inicial al Cargar la Página ---
document.addEventListener('DOMContentLoaded', () => {
    cargarCategorias();
    cargarLaboratorios();
    cargarTiposEquipo();
    mostrarVistaTipos(); // Mostrar la vista de tipos por defecto
});

// Listener para el toggle del sidebar
toggleSidebarBtn.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
    content.classList.toggle('sidebar-collapsed');
});