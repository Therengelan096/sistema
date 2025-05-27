// JavaScript para la página de administradores
// Ubicación: src/main/resources/static/js/administradores.js

const sidebar = document.getElementById('sidebar');
const content = document.getElementById('content');
const toggleSidebarBtn = document.getElementById('toggleSidebar');

toggleSidebarBtn.addEventListener('click', (e) => {
    e.preventDefault();
    sidebar.classList.toggle('collapsed');
    content.classList.toggle('sidebar-collapsed');
});

function cargarAdministradores() {
    fetch('/administradores')
        .then(response => {
            if (!response.ok) {
                return response.text().then(text => {
                    throw new Error(`Error ${response.status}: ${text || response.statusText}`);
                });
            }
            return response.json();
        })
        .then(data => {
            const tableBody = document.getElementById('administradores-body');
            tableBody.innerHTML = '';
            if (!data || data.length === 0) {
                tableBody.innerHTML = `<tr><td colspan="5" style="text-align: center;">No hay administradores registrados.</td></tr>`;
                return;
            }
            data.forEach(admin => {
                const estadoClass = admin.estado === 'ACTIVO' ? 'bg-success' : 'bg-secondary';
                const accionEstadoTexto = admin.estado === 'ACTIVO' ? 'Desactivar' : 'Activar';
                const accionEstadoClass = admin.estado === 'ACTIVO' ? 'btn-warning' : 'btn-success';

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
            const tableBody = document.getElementById('administradores-body');
            tableBody.innerHTML = `<tr><td colspan="5" style="color: red; text-align: center;">Error al cargar datos: ${error.message}</td></tr>`;
        });
}

function toggleEstadoAdmin(idAdministrador) {
    fetch(`/administradores/${idAdministrador}/toggle-estado`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
        }
    })
        .then(response => {
            if (!response.ok) {
                return response.text().then(text => {
                    throw new Error(`Error ${response.status}: ${text || response.statusText}`);
                });
            }
            return response.json();
        })
        .then(updatedAdmin => {
            console.log('Estado actualizado:', updatedAdmin);
            cargarAdministradores();
        })
        .catch(error => {
            console.error('Error al cambiar estado:', error);
            alert(`Error al cambiar estado: ${error.message}`);
        });
}

document.getElementById('buscar-ru-form').addEventListener('submit', function (e) {
    e.preventDefault();
    const ru = document.getElementById('ru-buscar').value;
    const resultadoDiv = document.getElementById('resultado-usuario');
    resultadoDiv.innerHTML = '<p>Buscando...</p>';

    document.getElementById('form-messages').textContent = '';

    fetch(`/administradores/usuarios/buscarPorRu/${ru}`)
        .then(response => {
            if (!response.ok) {
                return response.text().then(text => {
                    throw new Error(text || `Usuario no encontrado con RU: ${ru}`);
                });
            }
            return response.json();
        })
        .then(usuario => {
            resultadoDiv.innerHTML = `
                    <p>Usuario encontrado: <strong>${usuario.nombre} ${usuario.apellido}</strong> (ID: ${usuario.idUsuario})</p>
                    <button class="btn btn-success" onclick="abrirModalAgregar(${usuario.idUsuario}, '${usuario.nombre} ${usuario.apellido}')">Registrar como Administrador</button>
                `;
            document.getElementById('form-messages').textContent = '';
        })
        .catch(error => {
            resultadoDiv.innerHTML = `
                    <p style="color: red;">Error en búsqueda: ${error.message}</p>
                `;
            console.error("Error en búsqueda RU:", error);
            document.getElementById('form-messages').textContent = '';
        });
});

function abrirModalAgregar(idUsuario, nombreCompleto) {
    document.getElementById('administrador-form').reset();
    document.getElementById('id-administrador').value = '';
    document.getElementById('id-usuario').value = idUsuario;
    document.getElementById('usuario-nombre').value = nombreCompleto;
    document.getElementById('nombre-login-admin').value = '';
    document.getElementById('nombre-login-admin').required = true;
    document.getElementById('contraseña').value = '';
    document.getElementById('contraseña').placeholder = 'Ingrese contraseña (obligatoria)';
    document.getElementById('contraseña').required = true;
    document.getElementById('modal-title').textContent = 'Registrar Administrador';
    document.getElementById('modal-administrador').style.display = 'flex';
    document.getElementById('form-messages').textContent = '';
    document.getElementById('form-messages').style.color = 'red';
}

function abrirModalEditar(idAdministrador, nombreLoginAdmin, nombreCompletoUsuario, idUsuario) {
    if (!idUsuario || idUsuario === 0) {
        alert("No se puede editar un administrador sin un usuario asociado válido.");
        return;
    }

    document.getElementById('administrador-form').reset();
    document.getElementById('id-administrador').value = idAdministrador;
    document.getElementById('id-usuario').value = idUsuario;
    document.getElementById('usuario-nombre').value = nombreCompletoUsuario;
    document.getElementById('nombre-login-admin').value = nombreLoginAdmin;
    document.getElementById('nombre-login-admin').required = false;

    document.getElementById('contraseña').value = '';
    document.getElementById('contraseña').placeholder = 'Dejar en blanco para no cambiar';
    document.getElementById('contraseña').required = false;

    document.getElementById('modal-title').textContent = `Editar Administrador`;
    document.getElementById('modal-administrador').style.display = 'flex';
    document.getElementById('form-messages').textContent = '';
    document.getElementById('form-messages').style.color = 'red';
}

function cerrarModal() {
    document.getElementById('nombre-login-admin').required = true;
    document.getElementById('contraseña').required = true;

    document.getElementById('modal-administrador').style.display = 'none';
    document.getElementById('form-messages').textContent = '';
    document.getElementById('form-messages').style.color = 'red';
}

document.getElementById('administrador-form').addEventListener('submit', function (e) {
    e.preventDefault();
    const idAdministrador = document.getElementById('id-administrador').value;
    const idUsuario = document.getElementById('id-usuario').value;
    const nombreLoginAdmin = document.getElementById('nombre-login-admin').value;
    const contraseña = document.getElementById('contraseña').value;

    const esEdicion = !!idAdministrador;

    if (!esEdicion) {
        if (!idUsuario || idUsuario === '0') {
            document.getElementById('form-messages').textContent = 'Error: No se ha seleccionado un usuario válido.';
            return;
        }
        if (!nombreLoginAdmin) {
            document.getElementById('form-messages').textContent = 'El nombre de login para el administrador es obligatorio.';
            return;
        }
        if (!contraseña) {
            document.getElementById('form-messages').textContent = 'La contraseña es obligatoria para crear un nuevo administrador.';
            return;
        }
    } else {
        if (document.getElementById('nombre-login-admin').required && !nombreLoginAdmin && contraseña) {
            document.getElementById('form-messages').textContent = 'El nombre de login es obligatorio si cambias la contraseña.';
            return;
        }
    }

    const url = esEdicion ? `/administradores/${idAdministrador}` : '/administradores';
    const method = esEdicion ? 'PUT' : 'POST';

    const dataToSend = {
        usuario: nombreLoginAdmin,
        ...( (method === 'POST') || (method === 'PUT' && contraseña) ) && { contraseña: contraseña },
        ...(method === 'POST' && idUsuario) && { usuarioRef: { idUsuario: parseInt(idUsuario) } }
    };

    document.getElementById('form-messages').textContent = '';
    document.getElementById('form-messages').style.color = 'red';

    fetch(url, {
        method: method,
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
    })
        .then(response => {
            if (response.ok) {
                return response.text();
            } else {
                return response.text().then(text => {
                    throw new Error(text || `Error ${response.status}: Error al procesar la solicitud`);
                });
            }
        })
        .then(responseText => {
            document.getElementById('form-messages').style.color = 'green';
            document.getElementById('form-messages').textContent = responseText || (esEdicion ? 'Administrador actualizado correctamente' : 'Administrador creado correctamente');

            setTimeout(() => {
                cerrarModal();
                cargarAdministradores();
            }, 2000);

        })
        .catch(error => {
            console.error('Error en formulario admin:', error);
            document.getElementById('form-messages').style.color = 'red';
            document.getElementById('form-messages').textContent = `Error: ${error.message}`;
        });
});

document.getElementById('logout-link').addEventListener('click', function (e) {
    e.preventDefault();

    console.log("Cerrando sesión...");
    fetch('/logout', { method: 'POST' })
        .then(response => {
            if (response.ok) {
                console.log("Sesión cerrada en el backend exitosamente.");
            } else {
                console.error("Error al cerrar sesión en el backend:", response.status, response.statusText);
            }
            window.location.href = '/login.html';
        })
        .catch(error => {
            console.error('Error durante el proceso de logout (fetch):', error);
            window.location.href = '/login.html';
        });
});

document.addEventListener('DOMContentLoaded', cargarAdministradores);

const btnVerAuditoria = document.getElementById('btnVerAuditoria');
const auditoriaModal = document.getElementById('auditoriaModal');
const closeAuditoriaSpan = document.querySelector('.close-auditoria');
const auditoriaTableBody = document.getElementById('auditoria-table-body');
const exportAuditoriaCsvBtn = document.getElementById('exportAuditoriaCsv');

btnVerAuditoria.addEventListener('click', function() {
    auditoriaModal.style.display = 'block';
    cargarRegistrosAuditoria();
});

closeAuditoriaSpan.addEventListener('click', function() {
    auditoriaModal.style.display = 'none';
});

window.addEventListener('click', function(event) {
    if (event.target == auditoriaModal) {
        auditoriaModal.style.display = 'none';
    }
});

function cargarRegistrosAuditoria() {
    fetch('/api/auditoria')
        .then(response => {
            if (!response.ok) {
                throw new Error('Error al cargar los registros de auditoría.');
            }
            return response.json();
        })
        .then(data => {
            auditoriaTableBody.innerHTML = '';
            data.forEach(log => {
                const row = auditoriaTableBody.insertRow();
                row.insertCell(0).textContent = log.idLog;
                row.insertCell(1).textContent = log.nombreAdministrador;
                row.insertCell(2).textContent = log.tablaAfectada;
                row.insertCell(3).textContent = log.idRegistroAfectado;
                row.insertCell(4).textContent = log.tipoOperacion;
                row.insertCell(5).textContent = new Date(log.fechaHoraAccion).toLocaleString();
            });
        })
        .catch(error => {
            console.error('Error al cargar auditoría:', error);
            auditoriaTableBody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">${error.message}</td></tr>`;
        });
}

exportAuditoriaCsvBtn.addEventListener('click', function() {
    fetch('/api/auditoria')
        .then(response => response.json())
        .then(data => {
            if (data.length === 0) {
                alert('No hay datos de auditoría para exportar.');
                return;
            }

            const headers = ["ID Log", "Administrador", "Tabla Afectada", "ID Registro Afectado", "Tipo Operacion", "Fecha y Hora"];

            const csvRows = data.map(log => [
                log.idLog,
                log.nombreAdministrador,
                log.tablaAfectada,
                log.idRegistroAfectado,
                log.tipoOperacion,
                new Date(log.fechaHoraAccion).toLocaleString()
            ].map(item => `"${String(item).replace(/"/g, '""')}"`).join(','));

            const csvContent = [
                headers.join(','),
                ...csvRows
            ].join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.setAttribute('href', url);
            link.setAttribute('download', 'registros_auditoria.csv');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        })
        .catch(error => {
            console.error('Error al exportar auditoría a CSV:', error);
            alert('Error al exportar registros de auditoría.');
        });
});