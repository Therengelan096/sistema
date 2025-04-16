document.addEventListener('DOMContentLoaded', function () {
  const toggleBtn = document.getElementById('toggleSidebar');
  const sidebar = document.getElementById('sidebar');
  const prestamoModalElement = document.getElementById('prestamoModal');
  const prestamoModal = new bootstrap.Modal(prestamoModalElement);
  const nuevoPrestamoForm = document.getElementById('nuevo-prestamo-form');
  const laboratorioSelect = document.getElementById('laboratorio');
  const categoriaSelect = document.getElementById('categoria');
  const seleccionEquiposContainer = document.getElementById('seleccion-equipos-container');
  const equiposDisponiblesContainer = document.getElementById('equipos-disponibles-container');
  const agregarEquiposBtn = document.getElementById('agregar-equipos-btn');
  const equiposPrestamoLista = document.getElementById('equipos-prestamo-lista').querySelector('ul');
  const detallePrestamoInput = document.getElementById('detalle-prestamo-input');
  const guardarPrestamoBtn = document.getElementById('guardar-prestamo-btn');
  const prestamoIdInput = document.getElementById('prestamo-id');

  let prestamosData = [];
  let equiposSeleccionados = [];

  toggleBtn.addEventListener('click', function () {
    sidebar.classList.toggle('collapsed');
  });

  // Cargar datos iniciales
  cargarPrestamos();
  cargarUsuarios();
  cargarLaboratorios();

  // Evento al cambiar el laboratorio
  laboratorioSelect.addEventListener('change', function () {
    const laboratorioId = this.value;
    if (laboratorioId) {
      cargarCategoriasPorLaboratorio(laboratorioId);
      cargarEquiposPorLaboratorio(laboratorioId);
      seleccionEquiposContainer.style.display = 'block';
    } else {
      seleccionEquiposContainer.style.display = 'none';
      equiposDisponiblesContainer.innerHTML = '';
    }
    categoriaSelect.value = ''; // Resetear la categoría al cambiar el laboratorio
  });

  // Evento al cambiar la categoría (opcional)
  categoriaSelect.addEventListener('change', function () {
    const laboratorioId = laboratorioSelect.value;
    const categoriaId = this.value;
    if (laboratorioId) {
      cargarEquiposPorLaboratorio(laboratorioId, categoriaId);
    }
  });

  // Evento al hacer clic en "Agregar Equipos Seleccionados"
  agregarEquiposBtn.addEventListener('click', function () {
    const equiposCheckboxes = equiposDisponiblesContainer.querySelectorAll('input[type="checkbox"]:checked');
    equiposCheckboxes.forEach(checkbox => {
      const equipoId = checkbox.value;
      const cantidadInput = checkbox.closest('.equipo-item').querySelector('input[type="number"]');
      const nombreEquipo = checkbox.closest('.equipo-item').querySelector('.nombre-equipo').textContent;
      const cantidad = parseInt(cantidadInput.value);

      if (cantidad > 0) {
        const index = equiposSeleccionados.findIndex(e => e.idEquipo === equipoId);
        if (index !== -1) {
          equiposSeleccionados[index].cantidad += cantidad;
        } else {
          equiposSeleccionados.push({ idEquipo: equipoId, nombre: nombreEquipo, cantidad: cantidad });
        }
      }
      checkbox.checked = false; // Desmarcar después de agregar
      cantidadInput.value = 1;   // Resetear la cantidad
    });
    actualizarEquiposPrestamoLista();
  });

  // Función para actualizar la lista de equipos a prestar visualmente
  function actualizarEquiposPrestamoLista() {
    equiposPrestamoLista.innerHTML = '';
    equiposSeleccionados.forEach((equipo, index) => {
      const listItem = document.createElement('li');
      listItem.classList.add('list-group-item');
      listItem.innerHTML = `
        <span>${equipo.nombre} - Cantidad: ${equipo.cantidad}</span>
        <button type="button" class="btn btn-sm btn-danger eliminar-equipo-prestamo" data-index="${index}">Eliminar</button>
      `;
      equiposPrestamoLista.appendChild(listItem);
    });
  }

  // Evento para eliminar un equipo de la lista de préstamo
  equiposPrestamoLista.addEventListener('click', function (event) {
    if (event.target.classList.contains('eliminar-equipo-prestamo')) {
      const indexAEliminar = parseInt(event.target.dataset.index);
      equiposSeleccionados.splice(indexAEliminar, 1);
      actualizarEquiposPrestamoLista();
    }
  });

  // Evento al enviar el formulario de nuevo préstamo
  nuevoPrestamoForm.addEventListener('submit', function (event) {
    event.preventDefault();

    const usuarioId = document.getElementById('usuario').value;
    const administradorId = document.getElementById('administrador').value;
    const fechaPrestamo = document.getElementById('fechaPrestamo').value;
    const fechaDevolucionEstimada = document.getElementById('fechaDevolucionEstimada').value;
    const prestamoId = prestamoIdInput.value;

    const detallesPrestamo = equiposSeleccionados.map(equipo => ({
      equipo: { idEquipo: equipo.idEquipo },
      cantidad: equipo.cantidad
    }));

    const prestamoData = {
      idPrestamo: prestamoId ? parseInt(prestamoId) : null,
      usuario: { idUsuario: parseInt(usuarioId) },
      administrador: { idAdministrador: parseInt(administradorId) },
      fechaPrestamo: fechaPrestamo,
      horaPrestamo: fechaPrestamo.split('T')[1],
      estado: 'pendiente', // Puedes ajustar el estado inicial
      fechaDevolucionEstimada: fechaDevolucionEstimada,
      detallesPrestamo: detallesPrestamo
    };

    const url = prestamoId ? `/prestamos/${prestamoId}` : '/prestamos';
    const method = prestamoId ? 'PUT' : 'POST';

    fetch(url, {
      method: method,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(prestamoData)
    })
      .then(response => {
        if (response.ok) {
          cargarPrestamos();
          prestamoModal.hide();
          nuevoPrestamoForm.reset();
          equiposSeleccionados = [];
          actualizarEquiposPrestamoLista();
          prestamoIdInput.value = '';
          guardarPrestamoBtn.textContent = 'Guardar Préstamo';
          document.getElementById('prestamoModalLabel').textContent = 'Nuevo Préstamo';
        } else {
          console.error('Error al guardar/actualizar préstamo:', response);
          // Aquí puedes mostrar un mensaje de error al usuario
        }
      })
      .catch(error => console.error('Error:', error));
  });

  // Evento al ocultar el modal
  prestamoModalElement.addEventListener('hidden.bs.modal', function () {
    nuevoPrestamoForm.reset();
    equiposSeleccionados = [];
    actualizarEquiposPrestamoLista();
    prestamoIdInput.value = '';
    guardarPrestamoBtn.textContent = 'Guardar Préstamo';
    document.getElementById('prestamoModalLabel').textContent = 'Nuevo Préstamo';
    seleccionEquiposContainer.style.display = 'none';
    equiposDisponiblesContainer.innerHTML = '';
    laboratorioSelect.value = '';
    categoriaSelect.value = '';
  });

  function cargarPrestamos() {
    fetch('/prestamos')
      .then(response => response.json())
      .then(data => {
        prestamosData = data;
        populateTable(data);
      })
      .catch(error => console.error('Error al cargar préstamos:', error));
  }

  function populateTable(data) {
      const tableBody = document.getElementById('prestamos-body');
      tableBody.innerHTML = '';
      data.forEach(item => {
        const equiposPrestados = item.detallesPrestamo ?
          item.detallesPrestamo.map(detalle => `${detalle.equipo.nombre} (${detalle.cantidad})`).join(', ') : 'N/A';

        const fechaPrestamo = item.fechaPrestamo ? new Date(item.fechaPrestamo).toLocaleDateString() : 'N/A';
        const horaPrestamo = item.horaPrestamo ? item.horaPrestamo.slice(0, 5) : 'N/A';
        const fechaDevolucionEstimada = item.fechaDevolucionEstimada ? new Date(item.fechaDevolucionEstimada).toLocaleDateString() : 'N/A';

        tableBody.innerHTML += `
          <tr>
            <td>${item.idPrestamo}</td>
            <td>${item.usuario ? item.usuario.nombre + ' ' + item.usuario.apellido : 'N/A'}</td>
            <td>${equiposPrestados}</td>
            <td>${item.administrador ? item.administrador.usuario : 'N/A'}</td>
            <td>${fechaPrestamo}</td>
            <td>${horaPrestamo}</td>
            <td>${item.estado}</td>
            <td>${fechaDevolucionEstimada}</td>
            <td>
              <button class="btn btn-sm btn-warning" onclick="editarPrestamo(${item.idPrestamo})">Modificar</button>
            </td>
          </tr>
        `;
      });
    }

  function cargarUsuarios() {
    fetch('/usuarios')
      .then(response => response.json())
      .then(usuarios => {
        const usuarioSelects = document.querySelectorAll('#usuario');
        usuarioSelects.forEach(select => {
          select.innerHTML = '<option value="">Seleccionar Usuario</option>';
          usuarios.forEach(usuario => {
            select.innerHTML += `<option value="${usuario.idUsuario}">${usuario.nombre} ${usuario.apellido}</option>`;
          });
        });
      })
      .catch(error => console.error('Error al cargar usuarios:', error));
  }

  function cargarAdministradores() {
    fetch('/administradores')
      .then(response => response.json())
      .then(administradores => {
        const administradorSelects = document.querySelectorAll('#administrador');
        administradorSelects.forEach(select => {
          select.innerHTML = '<option value="">Seleccionar Administrador</option>';
          administradores.forEach(admin => {
            select.innerHTML += `<option value="${admin.idAdministrador}">${admin.usuario}</option>`;
          });
        });
      })
      .catch(error => console.error('Error al cargar administradores:', error));
  }

  function cargarLaboratorios() {
    fetch('/laboratorios')
      .then(response => response.json())
      .then(laboratorios => {
        const laboratorioSelects = document.querySelectorAll('#laboratorio');
        laboratorioSelects.forEach(select => {
          select.innerHTML = '<option value="">Seleccionar Laboratorio</option>';
          laboratorios.forEach(lab => {
            select.innerHTML += `<option value="${lab.idLaboratorio}">${lab.nombre}</option>`;
          });
        });
      })
      .catch(error => console.error('Error al cargar laboratorios:', error));
  }

  function cargarCategoriasPorLaboratorio(laboratorioId) {
    fetch(`/laboratorios/${laboratorioId}/categorias`)
      .then(response => response.json())
      .then(categorias => {
        const categoriaSelects = document.querySelectorAll('#categoria');
        categoriaSelects.forEach(select => {
          select.innerHTML = '<option value="">Todas las Categorías</option>';
          categorias.forEach(cat => {
            select.innerHTML += `<option value="${cat.idCategoria}">${cat.nombreCategoria}</option>`;
          });
        });
      })
      .catch(error => console.error('Error al cargar categorías:', error));
  }

  function cargarEquiposPorLaboratorio(laboratorioId, categoriaId = '') {
    let url = `/laboratorios/${laboratorioId}/equipos`;
    if (categoriaId) {
      url += `?categoriaId=${categoriaId}`;
    }
    fetch(url)
      .then(response => response.json())
      .then(equipos => {
        equiposDisponiblesContainer.innerHTML = '';
        equipos.forEach(equipo => {
          const equipoDiv = document.createElement('div');
          equipoDiv.classList.add('col-md-4', 'mb-3', 'equipo-item');
          equipoDiv.innerHTML = `
            <div class="card bg-dark border-secondary rounded-3 p-2">
              <div class="form-check">
                <input class="form-check-input" type="checkbox" value="${equipo.idEquipo}" id="equipo-${equipo.idEquipo}">
                <label class="form-check-label nombre-equipo" for="equipo-${equipo.idEquipo}">
                  ${equipo.nombre}
                </label>
              </div>
              <div class="mt-2">
                <label for="cantidad-${equipo.idEquipo}" class="form-label small">Cantidad:</label>
                <input type="number" class="form-control form-control-sm bg-dark border-secondary text-white" id="cantidad-${equipo.idEquipo}" value="1" min="1" style="width: 70px;">
              </div>
            </div>
          `;
          equiposDisponiblesContainer.appendChild(equipoDiv);
        });
      })
      .catch(error => console.error('Error al cargar equipos:', error));
  }

  window.editarPrestamo = function (id) {
    fetch(`/prestamos/${id}`)
      .then(response => response.json())
      .then(prestamo => {
        prestamoIdInput.value = prestamo.idPrestamo;
        document.getElementById('usuario').value = prestamo.usuario.idUsuario;
        document.getElementById('administrador').value = prestamo.administrador.idAdministrador;
        document.getElementById('fechaPrestamo').value = prestamo.fechaPrestamo.replace(' ', 'T').slice(0, 16);
        document.getElementById('fechaDevolucionEstimada').value = prestamo.fechaDevolucionEstimada.replace(' ', 'T').slice(0, 16);

        equiposSeleccionados = prestamo.detallesPrestamo.map(detalle => ({
          idEquipo: detalle.equipo.idEquipo,
          nombre: detalle.equipo.nombre,
          cantidad: detalle.cantidad
        }));
        actualizarEquiposPrestamoLista();

        // Cargar el laboratorio y luego los equipos para edición
        document.getElementById('laboratorio').value = prestamo.detallesPrestamo[0].equipo.laboratorio.idLaboratorio;
        cargarCategoriasPorLaboratorio(prestamo.detallesPrestamo[0].equipo.laboratorio.idLaboratorio);
        cargarEquiposPorLaboratorio(prestamo.detallesPrestamo[0].equipo.laboratorio.idLaboratorio);

        document.getElementById('prestamoModalLabel').textContent = 'Editar Préstamo';
        guardarPrestamoBtn.textContent = 'Actualizar Préstamo';
        prestamoModal.show();
        seleccionEquiposContainer.style.display = 'block';
      })
      .catch(error => console.error('Error al cargar préstamo para editar:', error));
  };
  // Cargar administradores al cargar la página
  cargarAdministradores();
});