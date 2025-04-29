// JavaScript para la página de administradores
// Ubicación: src/main/resources/static/js/administradores.js

const sidebar = document.getElementById('sidebar');
const content = document.getElementById('content');
const toggleSidebarBtn = document.getElementById('toggleSidebar');

// Event listener para colapsar/expandir la barra lateral
toggleSidebarBtn.addEventListener('click', (e) => {
    e.preventDefault(); // Prevenir comportamiento por defecto del enlace '#'
    sidebar.classList.toggle('collapsed');
    content.classList.toggle('sidebar-collapsed');
});

// Cargar administradores en la tabla al inicio
function cargarAdministradores() {
    fetch('/administradores') // Llama a tu endpoint GET /administradores
        .then(response => {
            if (!response.ok) {
                // Si la respuesta no es OK (ej. 401, 403, 404, 500), leer el cuerpo del error
                return response.text().then(text => {
                    // Incluir el estado HTTP en el mensaje de error
                    throw new Error(`Error ${response.status}: ${text || response.statusText}`);
                });
            }
            return response.json(); // Si la respuesta es OK, se espera un JSON (lista de administradores)
        })
        .then(data => {
            const tableBody = document.getElementById('administradores-body');
            tableBody.innerHTML = ''; // Limpiar tabla antes de llenar
            if (!data || data.length === 0) {
                // Mostrar mensaje si no hay administradores
                tableBody.innerHTML = `<tr><td colspan="5" style="text-align: center;">No hay administradores registrados.</td></tr>`;
                return;
            }
            // Llenar la tabla con los datos de los administradores
            data.forEach(admin => {
                // Determinar clase y texto para el badge/botón de estado
                const estadoClass = admin.estado === 'ACTIVO' ? 'bg-success' : 'bg-secondary';
                const accionEstadoTexto = admin.estado === 'ACTIVO' ? 'Desactivar' : 'Activar';
                const accionEstadoClass = admin.estado === 'ACTIVO' ? 'btn-warning' : 'btn-success'; // warning para desactivar, success para activar

                const row = `<tr>
                        <td>${admin.idAdministrador || 'N/A'}</td> <td>${admin.usuario || 'N/A'}</td> <td>${admin.usuarioRef ? `${admin.usuarioRef.nombre} ${admin.usuarioRef.apellido} (ID: ${admin.usuarioRef.idUsuario})` : 'N/A (Usuario Desconocido)'}</td> <td>
                            <span class="badge ${estadoClass}">${admin.estado || 'N/A'}</span>
                        </td>
                        <td>
                             <button class="btn btn-primary btn-sm" onclick="abrirModalEditar(${admin.idAdministrador}, '${admin.usuario ? admin.usuario.replace(/'/g, "\\'") : ''}', '${admin.usuarioRef ? `${admin.usuarioRef.nombre} ${admin.usuarioRef.apellido}`.replace(/'/g, "\\'") : 'N/A'}', ${admin.usuarioRef ? admin.usuarioRef.idUsuario : 0})">Editar</button>

                            <button class="btn ${accionEstadoClass} btn-sm" onclick="toggleEstadoAdmin(${admin.idAdministrador})">
                                ${accionEstadoTexto}
                            </button>
                            </td>
                    </tr>`;
                tableBody.innerHTML += row;
            });
        })
        .catch(error => {
            console.error('Error al cargar administradores:', error);
            // Mostrar error al usuario de forma más amigable en la tabla
            const tableBody = document.getElementById('administradores-body');
            tableBody.innerHTML = `<tr><td colspan="5" style="color: red; text-align: center;">Error al cargar datos: ${error.message}</td></tr>`;
        });
}

// --- FUNCIÓN PARA CAMBIAR ESTADO ---
function toggleEstadoAdmin(idAdministrador) {
    fetch(`/administradores/${idAdministrador}/toggle-estado`, {
        method: 'PATCH', // Método PATCH para actualizar parcialmente (solo el estado)
        headers: {
            'Content-Type': 'application/json',
            // Agregar headers de autenticación si son necesarios (ej. JWT Token)
        }
    })
        .then(response => {
            if (!response.ok) {
                // Si la respuesta no es OK, leer el cuerpo del error
                return response.text().then(text => {
                    throw new Error(`Error ${response.status}: ${text || response.statusText}`);
                });
            }
            return response.json(); // El backend devuelve el admin actualizado en JSON
        })
        .then(updatedAdmin => {
            console.log('Estado actualizado:', updatedAdmin);
            // Opcional: Mostrar notificación de éxito temporal
            // alert(`Estado del administrador ID ${updatedAdmin.idAdministrador} cambiado a ${updatedAdmin.estado}`);
            cargarAdministradores(); // Recargar la tabla para ver el cambio reflejado
        })
        .catch(error => {
            console.error('Error al cambiar estado:', error);
            alert(`Error al cambiar estado: ${error.message}`); // Mostrar error en un alert simple
        });
}
// --- FIN FUNCIÓN CAMBIAR ESTADO ---


// --- Código para buscar usuario por RU y abrir modal ---
document.getElementById('buscar-ru-form').addEventListener('submit', function (e) {
    e.preventDefault(); // Prevenir el envío del formulario tradicional
    const ru = document.getElementById('ru-buscar').value;
    const resultadoDiv = document.getElementById('resultado-usuario');
    resultadoDiv.innerHTML = '<p>Buscando...</p>'; // Mostrar mensaje de búsqueda

    // Limpiar mensajes previos del formulario modal al iniciar una nueva búsqueda
    document.getElementById('form-messages').textContent = '';


    // Llama al endpoint de búsqueda por RU en tu backend
    // Asegúrate de que esta URL coincida con el endpoint de tu controlador de usuarios o administradores
    fetch(`/administradores/usuarios/buscarPorRu/${ru}`) // O `/usuarios/buscarPorRu/${ru}` si lo moviste a UsuarioController
        .then(response => {
            if (!response.ok) {
                // Si la respuesta no es OK (ej. 404 si no encuentra usuario), leer el cuerpo del error para el mensaje
                return response.text().then(text => {
                    // Lanzar un error con el mensaje del backend si está disponible
                    throw new Error(text || `Usuario no encontrado con RU: ${ru}`);
                });
            }
            return response.json(); // Si la respuesta es OK, se espera un JSON de Usuario
        })
        .then(usuario => {
            // Al encontrar el usuario, muestra su nombre completo y el botón para abrir el modal de agregar
            resultadoDiv.innerHTML = `
                    <p>Usuario encontrado: <strong>${usuario.nombre} ${usuario.apellido}</strong> (ID: ${usuario.idUsuario})</p>
                    <button class="btn btn-success" onclick="abrirModalAgregar(${usuario.idUsuario}, '${usuario.nombre} ${usuario.apellido}')">Registrar como Administrador</button>
                `;
            // Limpiar mensajes del formulario modal al encontrar un usuario con éxito
            document.getElementById('form-messages').textContent = '';

        })
        .catch(error => {
            // Mostrar error de búsqueda en el div de resultados
            resultadoDiv.innerHTML = `
                    <p style="color: red;">Error en búsqueda: ${error.message}</p>
                `;
            console.error("Error en búsqueda RU:", error);
            // Limpiar mensajes del formulario modal en caso de error de búsqueda
            document.getElementById('form-messages').textContent = '';
        });
});

// Función para abrir el modal de agregar administrador
function abrirModalAgregar(idUsuario, nombreCompleto) {
    document.getElementById('administrador-form').reset(); // Resetear el formulario
    document.getElementById('id-administrador').value = ''; // Asegurarse de que el campo de ID de administrador esté vacío (nueva creación)
    document.getElementById('id-usuario').value = idUsuario; // Guardar el ID del usuario asociado en un campo oculto
    document.getElementById('usuario-nombre').value = nombreCompleto; // Mostrar el nombre completo del usuario seleccionado
    document.getElementById('nombre-login-admin').value = ''; // Limpiar el campo de nombre de login del administrador
    document.getElementById('nombre-login-admin').required = true; // El nombre de login es obligatorio para un nuevo administrador
    document.getElementById('contraseña').value = ''; // Limpiar el campo de contraseña
    document.getElementById('contraseña').placeholder = 'Ingrese contraseña (obligatoria)';
    document.getElementById('contraseña').required = true; // La contraseña es obligatoria para un nuevo administrador
    document.getElementById('modal-title').textContent = 'Registrar Administrador'; // Cambiar el título del modal
    document.getElementById('modal-administrador').style.display = 'flex'; // Mostrar el modal (usando flex para centrar)
    document.getElementById('form-messages').textContent = ''; // Limpiar mensajes al abrir el modal
    document.getElementById('form-messages').style.color = 'red'; // Establecer color por defecto para mensajes de error
}

// Función para abrir el modal de editar administrador
function abrirModalEditar(idAdministrador, nombreLoginAdmin, nombreCompletoUsuario, idUsuario) {
    // Verifica si el idUsuario es válido (distinto de 0 o null si es el caso)
    if (!idUsuario || idUsuario === 0) {
        alert("No se puede editar un administrador sin un usuario asociado válido.");
        return;
    }

    document.getElementById('administrador-form').reset(); // Resetear el formulario
    document.getElementById('id-administrador').value = idAdministrador; // Guardar el ID del Administrador que se está editando
    document.getElementById('id-usuario').value = idUsuario; // Guardar el ID del Usuario asociado
    document.getElementById('usuario-nombre').value = nombreCompletoUsuario; // Mostrar el nombre completo del Usuario asociado
    document.getElementById('nombre-login-admin').value = nombreLoginAdmin; // Mostrar el nombre de login del Administrador
    document.getElementById('nombre-login-admin').required = false; // El nombre de login no siempre es requerido al editar (ajusta si es obligatorio)

    document.getElementById('contraseña').value = ''; // Limpiar el campo de contraseña
    document.getElementById('contraseña').placeholder = 'Dejar en blanco para no cambiar'; // Indicar que es opcional
    document.getElementById('contraseña').required = false; // Hacer no requerido al editar

    document.getElementById('modal-title').textContent = `Editar Administrador`; // Título genérico para edición
    document.getElementById('modal-administrador').style.display = 'flex'; // Mostrar el modal
    document.getElementById('form-messages').textContent = ''; // Limpiar mensajes al abrir el modal
    document.getElementById('form-messages').style.color = 'red'; // Establecer color por defecto para mensajes de error
}

// Función para cerrar el modal
function cerrarModal() {
    // Restaurar los requisitos por defecto para el formulario de 'Agregar' (por si se abre de nuevo)
    document.getElementById('nombre-login-admin').required = true;
    document.getElementById('contraseña').required = true;

    document.getElementById('modal-administrador').style.display = 'none'; // Ocultar el modal
    document.getElementById('form-messages').textContent = ''; // Limpiar mensajes al cerrar el modal
    document.getElementById('form-messages').style.color = 'red'; // Restaurar color por defecto para el siguiente uso
}

// Listener para el envío del formulario del modal (Crear/Editar Administrador)
document.getElementById('administrador-form').addEventListener('submit', function (e) {
    e.preventDefault(); // Prevenir el envío del formulario tradicional
    const idAdministrador = document.getElementById('id-administrador').value; // Vacío si es crear
    const idUsuario = document.getElementById('id-usuario').value; // ID del usuario asociado (obtenido de la búsqueda)
    const nombreLoginAdmin = document.getElementById('nombre-login-admin').value; // Nombre de login para el administrador (input del modal)
    const contraseña = document.getElementById('contraseña').value; // Contraseña (input del modal)

    const esEdicion = !!idAdministrador; // True si idAdministrador tiene valor, indica modo edición

    // --- Validaciones del formulario antes de enviar ---
    if (!esEdicion) { // Validaciones solo al crear un nuevo administrador
        if (!idUsuario || idUsuario === '0') {
            document.getElementById('form-messages').textContent = 'Error: No se ha seleccionado un usuario válido.';
            return; // Detener el envío si no hay usuario asociado
        }
        if (!nombreLoginAdmin) {
            document.getElementById('form-messages').textContent = 'El nombre de login para el administrador es obligatorio.';
            return; // Detener el envío si falta el nombre de login
        }
        if (!contraseña) {
            document.getElementById('form-messages').textContent = 'La contraseña es obligatoria para crear un nuevo administrador.';
            return; // Detener el envío si falta la contraseña
        }
    } else { // Validaciones solo al editar un administrador existente
        // Si está editando, y el nombre de login es requerido en backend para PUT, asegúrate de que no esté vacío si se envió contraseña
        if (document.getElementById('nombre-login-admin').required && !nombreLoginAdmin && contraseña) {
            document.getElementById('form-messages').textContent = 'El nombre de login es obligatorio si cambias la contraseña.';
            return; // Detener el envío
        }
        // Puedes añadir más validaciones para edición si son necesarias
    }
    // --- Fin Validaciones ---


    const url = esEdicion ? `/administradores/${idAdministrador}` : '/administradores'; // URL del endpoint
    const method = esEdicion ? 'PUT' : 'POST'; // Método HTTP

    // Construir el objeto de datos a enviar
    const dataToSend = {
        // Incluir el nombre de login del administrador (el campo 'usuario' en tu entidad Administrador)
        usuario: nombreLoginAdmin,

        // Incluir contraseña solo si es POST (crear) o si se escribió algo en PUT (editar)
        // Usamos un operador spread (...) para añadir condicionalmente la propiedad
        ...( (method === 'POST') || (method === 'PUT' && contraseña) ) && { contraseña: contraseña },

        // Incluir usuarioRef con el ID del usuario asociado SOLO para la creación (POST)
        // En la edición (PUT), no enviamos usuarioRef en el body a menos que tu backend PUT lo espere para cambiar el usuario asociado
        ...(method === 'POST' && idUsuario) && { usuarioRef: { idUsuario: parseInt(idUsuario) } }

        // Si tu PUT endpoint requiere el usuarioRef incluso si no cambia:
        // ...(method === 'PUT' && idUsuario) && { usuarioRef: { idUsuario: parseInt(idUsuario) } }
    };

    // Limpiar mensajes de error antes de enviar la nueva solicitud
    document.getElementById('form-messages').textContent = '';
    document.getElementById('form-messages').style.color = 'red'; // Restaurar color por defecto para posibles errores


    // Realizar la solicitud Fetch al backend
    fetch(url, {
        method: method,
        headers: {
            'Content-Type': 'application/json',
            // Agregar headers de autenticación si son necesarios (ej. Authorization: Bearer Token)
        },
        body: JSON.stringify(dataToSend), // Convertir el objeto a cadena JSON
    })
        .then(response => {
            if (response.ok) {
                // Si la respuesta es OK (códigos 2xx), leer el cuerpo como texto (ya que el backend devuelve String)
                return response.text();
            } else {
                // Si la respuesta no es OK (ej. 400, 404, 500), leer el cuerpo del error como texto
                return response.text().then(text => {
                    // Lanzar un error con el mensaje del backend si está disponible, o un mensaje genérico
                    throw new Error(text || `Error ${response.status}: Error al procesar la solicitud`);
                });
            }
        })
        .then(responseText => { // 'responseText' contendrá el mensaje de éxito del backend
            // Mostrar mensaje de éxito en el div de mensajes
            document.getElementById('form-messages').style.color = 'green'; // Color verde para éxito
            document.getElementById('form-messages').textContent = responseText || (esEdicion ? 'Administrador actualizado correctamente' : 'Administrador creado correctamente');

            // Cerrar el modal y recargar la tabla después de un breve retraso para que el usuario pueda leer el mensaje de éxito
            setTimeout(() => {
                cerrarModal(); // Cerrar el modal
                cargarAdministradores(); // Recargar la lista de administradores en la tabla
            }, 2000); // Esperar 2 segundos

        })
        .catch(error => { // Capturar errores que ocurrieron durante el fetch o fueron lanzados en el .then()
            console.error('Error en formulario admin:', error);
            // Mostrar mensaje de error en el div de mensajes
            document.getElementById('form-messages').style.color = 'red'; // Color rojo para error
            document.getElementById('form-messages').textContent = `Error: ${error.message}`;
        });
});

// --- Función para Eliminar Administrador (Opcional) ---
// function eliminarAdministrador(idAdministrador) {
//     if (confirm('¿Estás seguro de que deseas eliminar este administrador?')) {
//         fetch(`/administradores/${idAdministrador}`, {
//             method: 'DELETE',
//             headers: {
//                 // Agregar headers de autenticación si son necesarios
//             }
//         })
//         .then(response => {
//             if (!response.ok) {
//                 return response.text().then(text => {
//                     throw new Error(`Error ${response.status}: ${text || response.statusText}`);
//                 });
//             }
//             return response.text(); // O .json() si el backend devuelve algo
//         })
//         .then(message => {
//             alert(message || 'Administrador eliminado correctamente'); // Usar alert o mostrar en interfaz
//             cargarAdministradores(); // Recargar la tabla
//         })
//         .catch(error => {
//             console.error('Error al eliminar administrador:', error);
//             alert(`Error al eliminar administrador: ${error.message}`); // Usar alert o mostrar en interfaz
//         });
//     }
// }
// --- Fin Función Eliminar Administrador ---


// Listener para el enlace de Cerrar Sesión
document.getElementById('logout-link').addEventListener('click', function (e) { // Usar el ID del enlace
    e.preventDefault(); // Prevenir el comportamiento por defecto del enlace

    console.log("Cerrando sesión...");
    // Realizar una solicitud al endpoint de logout en el backend (si usas Spring Security, suele ser POST /logout)
    // Ajusta la URL y el método según tu configuración específica
    fetch('/logout', { method: 'POST' }) // Ejemplo: usando POST a /logout
        .then(response => {
            // Puedes verificar si la respuesta fue exitosa (ej. 200 OK, 204 No Content)
            if (response.ok) {
                console.log("Sesión cerrada en el backend exitosamente.");
            } else {
                console.error("Error al cerrar sesión en el backend:", response.status, response.statusText);
                // Aunque haya error en el backend, generalmente quieres redirigir al usuario a la página de login del frontend
            }
            // Redirigir al usuario a la página de login del frontend
            window.location.href = '/login.html';
        })
        .catch(error => {
            console.error('Error durante el proceso de logout (fetch):', error);
            // Si hay un error en el fetch (ej. problema de red), igual redirigir al frontend de login
            window.location.href = '/login.html';
        });
});


// Carga inicial de administradores al cargar la página
document.addEventListener('DOMContentLoaded', cargarAdministradores);