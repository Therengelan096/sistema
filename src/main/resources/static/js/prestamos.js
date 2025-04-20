document.addEventListener('DOMContentLoaded', function () {
  // --- VARIABLES Y REFERENCIAS DE ELEMENTOS ---
  const toggleBtn = document.getElementById('toggleSidebar');
  const sidebar = document.getElementById('sidebar');
  const prestamoModalElement = document.getElementById('prestamoModal');
  // Nota: La inicialización de modals de Bootstrap debe hacerse DESPUÉS de obtener la referencia
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

  // **NUEVAS REFERENCIAS PARA EL MODAL DE DEVOLUCIÓN**
  const devolucionModalElement = document.getElementById('devolucionModal');
  const devolucionForm = document.getElementById('devolucion-form');
  const devolucionPrestamoIdInput = document.getElementById('devolucion-prestamo-id'); // Input oculto para el ID del préstamo

  // Inicializar los objetos Modal de Bootstrap *después* de obtener las referencias
  const prestamoModal = new bootstrap.Modal(prestamoModalElement);
  const devolucionModal = new bootstrap.Modal(devolucionModalElement); // Inicializa el modal de devolución

  let prestamosData = [];
  let equiposSeleccionados = [];

  // --- FUNCIONES DE CARGA (ALGUNAS AHORA GLOBALES PARA SER LLAMADAS POR editarPrestamo) ---
  // HACEMOS ESTAS FUNCIONES GLOBALES PARA QUE editarPrestamo PUEDA LLAMARLAS
  window.cargarPrestamos = function() { // <-- HECHO GLOBAL
    fetch('/prestamos')
      .then(response => {
          if (!response.ok) {
              return response.text().then(text => { throw new Error('HTTP status ' + response.status + ': ' + text) });
          }
          return response.json();
      })
      .then(data => {
        prestamosData = data;
        populateTable(data);
      })
      .catch(error => {
          console.error('Error al cargar préstamos:', error);
          const tableBody = document.getElementById('prestamos-body');
          tableBody.innerHTML = `<tr><td colspan="9" class="text-center">Error al cargar los préstamos.</td></tr>`;
      });
  }

  // Esta sigue siendo local, solo la llama cargarPrestamos
  function populateTable(data) {
        const tableBody = document.getElementById('prestamos-body');
        tableBody.innerHTML = '';
        if (data.length === 0) {
             tableBody.innerHTML = `<tr><td colspan="9" class="text-center">No hay préstamos registrados.</td></tr>`;
             return;
        }

        data.forEach(item => {
          const equiposPrestados = item.detallesPrestamo && item.detallesPrestamo.length > 0 ?
            item.detallesPrestamo.map(detalle => `${detalle.equipo ? detalle.equipo.nombre : 'Equipo Desconocido'} (${detalle.cantidad})`).join(', ') : 'N/A';

          const fechaPrestamo = item.fechaPrestamo ? new Date(item.fechaPrestamo).toLocaleDateString() : 'N/A';
          const horaPrestamo = item.horaPrestamo ? item.horaPrestamo.slice(0, 5) : 'N/A';
          const fechaDevolucionEstimada = item.fechaDevolucionEstimada ? new Date(item.fechaDevolucionEstimada).toLocaleDateString() : 'N/A';

          let estadoTexto = item.estado;
          let estadoClase = '';
          let botonModificarHTML = '';
          let botonDevolucionHTML = '';

          switch (item.estado) {
            case 'pendiente':
              estadoClase = 'text-warning';
              botonModificarHTML = `<button class="btn btn-sm btn-warning me-1" onclick="editarPrestamo(${item.idPrestamo})">Modificar</button>`;
              botonDevolucionHTML = `<button class="btn btn-sm btn-success btn-entregar" data-id="${item.idPrestamo}">Entregar</button>`;
              break;
            case 'devuelto':
              estadoClase = 'text-success';
              botonModificarHTML = `<button class="btn btn-sm btn-warning me-1" disabled>Modificar</button>`;
              botonDevolucionHTML = `<button class="btn btn-sm btn-danger btn-cancelar-devolucion" data-id="${item.idPrestamo}">Cancelar</button>`;
              break;
            case 'retrasado':
              estadoClase = 'text-danger';
              botonModificarHTML = `<button class="btn btn-sm btn-warning me-1" onclick="editarPrestamo(${item.idPrestamo})">Modificar</button>`;
              botonDevolucionHTML = `<button class="btn btn-sm btn-success btn-entregar" data-id="${item.idPrestamo}">Entregar</button>`;
              break;
          }

          tableBody.innerHTML += `
            <tr>
              <td>${item.idPrestamo}</td>
              <td>${item.usuario ? item.usuario.nombre + ' ' + item.usuario.apellido : 'N/A'}</td>
              <td>${equiposPrestados}</td>
              <td>${item.administrador ? item.administrador.usuario : 'N/A'}</td>
              <td>${fechaPrestamo}</td>
              <td>${horaPrestamo}</td>
              <td class="${estadoClase}">${estadoTexto}</td>
              <td>${fechaDevolucionEstimada}</td>
              <td>
                ${botonModificarHTML}
                ${botonDevolucionHTML}
              </td>
            </tr>
          `;
        });
      }

  // OTRAS FUNCIONES DE CARGA QUE DEBEN SER ACCESIBLES POR editarPrestamo
  window.cargarUsuarios = function() { // <-- HECHO GLOBAL
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

  window.cargarAdministradores = function() { // <-- HECHO GLOBAL
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

  window.cargarLaboratorios = function() { // <-- HECHO GLOBAL
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

  window.cargarCategoriasPorLaboratorio = function(laboratorioId) { // <-- HECHO GLOBAL
    if (!laboratorioId) {
        const categoriaSelects = document.querySelectorAll('#categoria');
         categoriaSelects.forEach(select => {
            select.innerHTML = '<option value="">Todas las Categorías</option>';
         });
        return;
    }
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

  window.cargarEquiposPorLaboratorio = function(laboratorioId, categoriaId = '') { // <-- HECHO GLOBAL
     if (!laboratorioId) {
         equiposDisponiblesContainer.innerHTML = '';
         return;
     }
    let url = `/laboratorios/${laboratorioId}/equipos`;
    if (categoriaId) {
      url += `?categoriaId=${categoriaId}`;
    }
    fetch(url)
      .then(response => response.json())
      .then(equipos => {
        equiposDisponiblesContainer.innerHTML = '';
        if (equipos.length === 0) {
             equiposDisponiblesContainer.innerHTML = '<p class="col-12 text-center">No hay equipos disponibles en este laboratorio (o categoría).</p>';
             return;
        }
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
              <div class="mt-1" style="color: #aaa;">
                Disponibles: ${equipo.cantidad}
              </div>
              <div class="mt-2">
                <label for="cantidad-${equipo.idEquipo}" class="form-label small">Cantidad a prestar:</label>
                <input type="number" class="form-control form-control-sm bg-dark border-secondary text-white" id="cantidad-${equipo.idEquipo}" value="1" min="1" style="width: 70px;">
              </div>
            </div>
          `;
          equiposDisponiblesContainer.appendChild(equipoDiv);
        });
      })
      .catch(error => console.error('Error al cargar equipos:', error));
  }

  // Helper function para formatear fecha y hora (AHORA GLOBAL)
  window.formatDateTimeLocal = function(dateString, timeString) { // <-- HECHO GLOBAL
      if (!dateString) return '';

      let datePart = '';
      try {
           const dateObj = new Date(dateString);
           if (!isNaN(dateObj.getTime())) {
               const year = dateObj.getFullYear();
               const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
               const day = dateObj.getDate().toString().padStart(2, '0');
               datePart = `${year}-${month}-${day}`;
           } else {
               console.warn("Could not parse date string:", dateString);
               return '';
           }
      } catch (e) {
          console.error("Error parsing date string:", dateString, e);
          return '';
      }

      let timePart = '00:00';
      if (timeString) {
          const timeMatch = timeString.match(/^(\d{2}:\d{2}(:\d{2})?)/);
          if (timeMatch && timeMatch[1]) {
              timePart = timeMatch[1].substring(0, 5);
          } else {
               console.warn("Could not parse time string:", timeString);
          }
      }

      return `${datePart}T${timePart}`;
  }

   // FUNCIÓN PARA ACTUALIZAR LISTA DE EQUIPOS EN EL MODAL (AHORA GLOBAL)
   window.actualizarEquiposPrestamoLista = function() { // <-- HECHO GLOBAL
    equiposPrestamoLista.innerHTML = '';
    if (equiposSeleccionados.length === 0) {
         equiposPrestamoLista.innerHTML = '<li class="list-group-item">No se han agregado equipos a este préstamo.</li>';
         return;
    }
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


  // --- FUNCIÓN PARA EDITAR PRÉSTAMO (YA ERA GLOBAL) ---
  window.editarPrestamo = function (id) { // ESTA YA ESTABA GLOBAL
    fetch(`/prestamos/${id}`)
      .then(response => {
          if (!response.ok) {
              return response.text().then(text => { throw new Error('HTTP status ' + response.status + ': ' + text) });
          }
          return response.json();
      })
      .then(prestamo => {
        prestamoIdInput.value = prestamo.idPrestamo;
        document.getElementById('usuario').value = prestamo.usuario ? prestamo.usuario.idUsuario : '';
        document.getElementById('administrador').value = prestamo.administrador ? prestamo.administrador.idAdministrador : '';

        // Usar las funciones helper globales
        document.getElementById('fechaPrestamo').value = window.formatDateTimeLocal(prestamo.fechaPrestamo, prestamo.horaPrestamo);
        document.getElementById('fechaDevolucionEstimada').value = window.formatDateTimeLocal(prestamo.fechaDevolucionEstimada, prestamo.fechaDevolucionEstimada ? prestamo.fechaDevolucionEstimada.split('T')[1] : null);

        equiposSeleccionados = prestamo.detallesPrestamo && prestamo.detallesPrestamo.length > 0
          ? prestamo.detallesPrestamo.map(detalle => ({
              idEquipo: detalle.equipo.idEquipo,
              nombre: detalle.equipo.nombre,
              cantidad: detalle.cantidad
            }))
          : [];
        window.actualizarEquiposPrestamoLista(); // <-- LLAMADA A FUNCIÓN AHORA GLOBAL

        if (prestamo.detallesPrestamo && prestamo.detallesPrestamo.length > 0 && prestamo.detallesPrestamo[0].equipo && prestamo.detallesPrestamo[0].equipo.laboratorio) {
               const labId = prestamo.detallesPrestamo[0].equipo.laboratorio.idLaboratorio;
               document.getElementById('laboratorio').value = labId;
               setTimeout(() => {
                 window.cargarCategoriasPorLaboratorio(labId); // <-- LLAMADA A FUNCIÓN AHORA GLOBAL
                 window.cargarEquiposPorLaboratorio(labId); // <-- LLAMADA A FUNCIÓN AHORA GLOBAL
                 seleccionEquiposContainer.style.display = 'block';
               }, 100);
          } else {
              document.getElementById('laboratorio').value = '';
              window.cargarCategoriasPorLaboratorio(''); // <-- LLAMADA A FUNCIÓN AHORA GLOBAL
              window.cargarEquiposPorLaboratorio(''); // <-- LLAMADA A FUNCIÓN AHORA GLOBAL
              seleccionEquiposContainer.style.display = 'none';
          }

        document.getElementById('prestamoModalLabel').textContent = 'Editar Préstamo';
        guardarPrestamoBtn.textContent = 'Actualizar Préstamo';
        prestamoModal.show();

      })
      .catch(error => console.error('Error al cargar préstamo para editar:', error));
  };


  // Función para abrir el modal de devolución (esta no necesita ser global para el botón Modificar)
  function abrirModalDevolucion(prestamoId) {
      // Guarda el ID del préstamo en el input oculto del formulario del modal
      devolucionPrestamoIdInput.value = prestamoId;

      // Pre-llenar fecha y hora actual
      const now = new Date();
      const year = now.getFullYear();
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const day = now.getDate().toString().padStart(2, '0');
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');

      document.getElementById('fechaDevolucion').value = `${year}-${month}-${day}`;
      document.getElementById('horaDevolucion').value = `${hours}:${minutes}`;

      // Resetea otros campos
      document.getElementById('estadoEquipoAlDevolver').value = '';
      document.getElementById('observaciones').value = '';

      // Muestra el modal
      devolucionModal.show();
  }


  // --- INICIALIZACIÓN Y EVENT LISTENERS ---

  // Cargar datos iniciales al cargar la página
  // ESTAS YA ESTÁN HECHAS GLOBALES Y PUEDEN SER LLAMADAS DIRECTAMENTE
  cargarPrestamos();
  cargarUsuarios();
  cargarLaboratorios();
  cargarAdministradores();


  // Evento de clic en el toggle del sidebar
  document.addEventListener('DOMContentLoaded', function () {
    const toggleBtn = document.getElementById('toggleSidebar');
    const sidebar = document.getElementById('sidebar');

    toggleBtn.addEventListener('click', function (e) {
      e.preventDefault();
      sidebar.classList.toggle('collapsed');
    });
  });

  // Evento de clic usando delegación para los botones 'Entregar' en la tabla
  const tableBody = document.getElementById('prestamos-body');
  tableBody.addEventListener('click', function(event) {
      // Verifica si el clic fue en un botón con la clase 'btn-entregar'
      if (event.target.classList.contains('btn-entregar')) {
          const prestamoId = event.target.dataset.id;
          abrirModalDevolucion(prestamoId); // Esta no necesita ser global, se llama desde el listener
      }
      // La lógica para editarPrestamo se maneja directamente por el onclick en el HTML
  });

  // Evento al cambiar el laboratorio (Ya estaba)
  laboratorioSelect.addEventListener('change', function () {
    const laboratorioId = this.value;
    if (laboratorioId) {
      window.cargarCategoriasPorLaboratorio(laboratorioId); // <-- LLAMADA A FUNCIÓN AHORA GLOBAL
      window.cargarEquiposPorLaboratorio(laboratorioId); // <-- LLAMADA A FUNCIÓN AHORA GLOBAL
      seleccionEquiposContainer.style.display = 'block';
    } else {
      seleccionEquiposContainer.style.display = 'none';
      equiposDisponiblesContainer.innerHTML = '';
      window.cargarCategoriasPorLaboratorio(''); // <-- LLAMADA A FUNCIÓN AHORA GLOBAL
    }
    categoriaSelect.value = '';
  });

  // Evento al cambiar la categoría (opcional) (Ya estaba)
  categoriaSelect.addEventListener('change', function () {
    const laboratorioId = laboratorioSelect.value;
    const categoriaId = this.value;
    if (laboratorioId) {
      window.cargarEquiposPorLaboratorio(laboratorioId, categoriaId); // <-- LLAMADA A FUNCIÓN AHORA GLOBAL
    }
  });

  // Evento al hacer clic en "Agregar Equipos Seleccionados" (Ya estaba)
  agregarEquiposBtn.addEventListener('click', function () {
      const equiposCheckboxes = equiposDisponiblesContainer.querySelectorAll('input[type="checkbox"]:checked');
      if (equiposCheckboxes.length === 0) {
        alert("Selecciona al menos un equipo para agregar.");
        return;
      }

      equiposCheckboxes.forEach(checkbox => {
        const equipoId = checkbox.value;
        const cantidadInput = checkbox.closest('.equipo-item').querySelector('input[type="number"]');
        const nombreEquipoSpan = checkbox.closest('.equipo-item').querySelector('.nombre-equipo');
        const nombreEquipo = nombreEquipoSpan ? nombreEquipoSpan.textContent : 'Equipo Desconocido';
        const cantidadSolicitada = parseInt(cantidadInput.value);

        // Obtener la cantidad disponible del equipo directamente del DOM
        const cantidadDisponibleElement = checkbox.closest('.card').querySelector('div[style*="color"]');
        const cantidadDisponibleTexto = cantidadDisponibleElement ? cantidadDisponibleElement.textContent : '';
        const cantidadDisponibleMatch = cantidadDisponibleTexto.match(/Disponibles: (\d+)/);
        const cantidadDisponible = cantidadDisponibleMatch ? parseInt(cantidadDisponibleMatch[1]) : 0;

        if (isNaN(cantidadSolicitada) || cantidadSolicitada <= 0) {
          alert(`La cantidad para "${nombreEquipo}" debe ser mayor que cero.`);
          return; // No agregar este equipo si la cantidad no es válida
        }

        if (cantidadSolicitada > cantidadDisponible) {
          alert(`No hay suficientes unidades disponibles de "${nombreEquipo}". Disponibles: ${cantidadDisponible}. Por favor, selecciona una cantidad menor o igual.`);
          return; // No agregar este equipo si la cantidad solicitada excede la disponible
        }

        const index = equiposSeleccionados.findIndex(e => e.idEquipo == equipoId);
        if (index !== -1) {
          equiposSeleccionados[index].cantidad += cantidadSolicitada;
        } else {
          equiposSeleccionados.push({ idEquipo: parseInt(equipoId), nombre: nombreEquipo, cantidad: cantidadSolicitada });
        }

        checkbox.checked = false;
        cantidadInput.value = 1;
      });
      window.actualizarEquiposPrestamoLista();
    });

  // Evento para eliminar un equipo de la lista de préstamo (delegación en la lista) (Ya estaba)
  equiposPrestamoLista.addEventListener('click', function (event) {
    if (event.target.classList.contains('eliminar-equipo-prestamo')) {
      const indexAEliminar = parseInt(event.target.dataset.index);
      equiposSeleccionados.splice(indexAEliminar, 1);
      window.actualizarEquiposPrestamoLista(); // <-- LLAMADA A FUNCIÓN AHORA GLOBAL
    }
  });


  // Evento al enviar el formulario de nuevo préstamo (Ya estaba)
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

    if (!prestamoId && detallesPrestamo.length === 0) {
        alert("Debe seleccionar al menos un equipo para el préstamo.");
        return;
    }

    if (!usuarioId) { alert("Selecciona un usuario."); return; }
    if (!administradorId) { alert("Selecciona un administrador."); return; }


    const prestamoData = {
      idPrestamo: prestamoId ? parseInt(prestamoId) : null,
      usuario: { idUsuario: parseInt(usuarioId) },
      administrador: { idAdministrador: parseInt(administradorId) },
      fechaPrestamo: fechaPrestamo,
      estado: 'pendiente',
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
      .then(async response => {
        if (response.ok) {
          window.cargarPrestamos(); // <-- LLAMADA A FUNCIÓN AHORA GLOBAL
          prestamoModal.hide();
          alert('Préstamo guardado con éxito.');
        } else {
          const text = await response.text();
          console.error('Error al guardar/actualizar préstamo:', response.status, text);
          alert('Error al guardar/actualizar préstamo: ' + text);
        }
      })
      .catch(error => {
        console.error('Error en la petición de préstamo:', error);
        alert('Ocurrió un error en la comunicación con el servidor al guardar el préstamo.');
      });
  });

  // Evento al ocultar el modal de préstamo (Resetear formulario) (Ya estaba)
  prestamoModalElement.addEventListener('hidden.bs.modal', function () {
    nuevoPrestamoForm.reset();
    equiposSeleccionados = [];
    window.actualizarEquiposPrestamoLista(); // <-- LLAMADA A FUNCIÓN AHORA GLOBAL
    prestamoIdInput.value = '';
    guardarPrestamoBtn.textContent = 'Guardar Préstamo';
    document.getElementById('prestamoModalLabel').textContent = 'Nuevo Préstamo';
    seleccionEquiposContainer.style.display = 'none';
    equiposDisponiblesContainer.innerHTML = '';
    laboratorioSelect.value = '';
    categoriaSelect.value = '';
  });


  // **EVENTO AL ENVIAR EL FORMULARIO DE DEVOLUCIÓN** (Ya estaba, se mantiene)
  devolucionForm.addEventListener('submit', function (event) {
      event.preventDefault();

      const prestamoId = devolucionPrestamoIdInput.value;
      const fechaDevolucion = document.getElementById('fechaDevolucion').value;
      const horaDevolucion = document.getElementById('horaDevolucion').value;
      const estadoEquipoAlDevolver = document.getElementById('estadoEquipoAlDevolver').value;
      const observaciones = document.getElementById('observaciones').value;

      if (!estadoEquipoAlDevolver) {
          alert("Por favor, selecciona el estado del equipo.");
          return;
      }

      const devolucionData = {
          prestamo: { idPrestamo: parseInt(prestamoId) },
          fechaDevolucion: fechaDevolucion,
          horaDevolucion: horaDevolucion,
          estadoEquipoAlDevolver: estadoEquipoAlDevolver,
          observaciones: observaciones
      };

      fetch('/devolucion/registrar', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify(devolucionData)
      })
      .then(async response => {
          if (response.ok) {
              window.cargarPrestamos(); // <-- LLAMADA A FUNCIÓN AHORA GLOBAL
              devolucionModal.hide();
              alert('Devolución registrada con éxito.');
          } else {
              const text = await response.text();
              console.error('Error al registrar devolución:', response.status, text);
              alert('Error al registrar la devolución: ' + text);
          }
      })
      .catch(error => {
          console.error('Error en la petición de devolución:', error);
          alert('Ocurrió un error en la comunicación con el servidor al registrar la devolución.');
      });
  });

  // Evento al ocultar el modal de devolución (Resetear formulario) (Ya estaba)
  devolucionModalElement.addEventListener('hidden.bs.modal', function () {
      devolucionForm.reset();
      devolucionPrestamoIdInput.value = '';
  });
// Evento de clic usando delegación para los botones 'Cancelar' devolución
  tableBody.addEventListener('click', function(event) {
      if (event.target.classList.contains('btn-cancelar-devolucion')) {
          const prestamoId = event.target.dataset.id;
          if (confirm(`¿Seguro que deseas cancelar la devolución del préstamo con ID ${prestamoId}?`)) {
              fetch(`/prestamos/devolucion/cancelar/${prestamoId}`, { // Correcto
                  method: 'POST',
                  headers: {
                      'Content-Type': 'application/json'
                  }
              })
              .then(async response => {
                  if (response.ok) {
                      window.cargarPrestamos(); // Recargar la tabla para reflejar los cambios
                      alert('Devolución cancelada con éxito.');
                  } else {
                      const text = await response.text();
                      console.error('Error al cancelar la devolución:', response.status, text);
                      alert('Error al cancelar la devolución: ' + text);
                  }
              })
              .catch(error => {
                  console.error('Error en la petición de cancelación de devolución:', error);
                  alert('Ocurrió un error al intentar cancelar la devolución.');
              });
          }
      }
  });
}); // Cierre del DOMContentLoaded