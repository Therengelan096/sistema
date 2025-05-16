document.addEventListener('DOMContentLoaded', function () {
    // --- VARIABLES Y REFERENCIAS DE ELEMENTOS ---
    const toggleBtn = document.getElementById('toggleSidebar');
    const sidebar = document.getElementById('sidebar');
    const prestamoModalElement = document.getElementById('prestamoModal');
    const nuevoPrestamoForm = document.getElementById('nuevo-prestamo-form');
    const laboratorioSelect = document.getElementById('laboratorio');
    const categoriaSelect = document.getElementById('categoria');
    const seleccionEquiposContainer = document.getElementById('seleccion-equipos-container');
    const equiposDisponiblesContainer = document.getElementById('equipos-disponibles-container');
    const agregarEquiposBtn = document.getElementById('agregar-equipos-btn');
    const equiposPrestamoLista = document.getElementById('equipos-prestamo-lista').querySelector('ul');
    const detallePrestamoInput = document.getElementById('detalle-prestamo-input'); // Asegúrate de que este elemento exista si lo usas
    const guardarPrestamoBtn = document.getElementById('guardar-prestamo-btn');
    const prestamoIdInput = document.getElementById('prestamo-id');

    // **NUEVAS REFERENCIAS PARA EL MODAL DE DEVOLUCIÓN**
    const devolucionModalElement = document.getElementById('devolucionModal');
    const devolucionForm = document.getElementById('devolucion-form');
    const devolucionPrestamoIdInput = document.getElementById('devolucion-prestamo-id'); // Input oculto para el ID del préstamo
    // **NUEVAS REFERENCIAS PARA LA BÚSQUEDA POR RU** <-- AÑADE ESTO
    const ruUsuarioInput = document.getElementById('ruUsuarioInput');
    const btnBuscarUsuario = document.getElementById('btnBuscarUsuario');
    const infoUsuarioEncontrado = document.getElementById('infoUsuarioEncontrado');
    const usuarioIdOculto = document.getElementById('usuarioIdOculto'); // Este es el input hidden que guardará el ID
    // Inicializar los objetos Modal de Bootstrap *después* de obtener las referencias
    const prestamoModal = new bootstrap.Modal(prestamoModalElement);
    const devolucionModal = new bootstrap.Modal(devolucionModalElement); // Inicializa el modal de devolución
    let prestamosData = [];
    let equiposSeleccionados = [];
    // ... el resto de tus variables ...
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
    // --- FUNCIÓN PARA EDITAR PRÉSTAMO (CORREGIDA) ---
    window.editarPrestamo = function (id) {
        console.log('Intentando cargar préstamo para editar con ID:', id); // Log para verificar que la función se llama

        fetch(`/prestamos/${id}`)
            .then(response => {
                if (!response.ok) {
                    // Si la respuesta no es exitosa, lanzar un error con el estado y texto de la respuesta
                    return response.text().then(text => {
                        const errorMsg = 'HTTP status ' + response.status + ': ' + text;
                        console.error('Error fetching loan details:', errorMsg); // Log del error de fetch
                        throw new Error(errorMsg);
                    });
                }
                return response.json(); // Procesar la respuesta JSON si es exitosa
            })
            .then(prestamo => {
                console.log('Datos del préstamo recibidos:', prestamo); // Log de los datos recibidos

                // --- PASO CRUCIAL: MOVER prestamoModal.show() AQUÍ ---
                // Muestra el modal *antes* de intentar llenar sus campos.
                prestamoModal.show();

                // --- LLENAR LOS CAMPOS DEL FORMULARIO DENTRO DEL MODAL ---
                // (Estas líneas se ejecutarán después de que se inicie la visualización del modal)

                prestamoIdInput.value = prestamo.idPrestamo;

                // --- Lógica para manejar el USUARIO (ahora por RU) ---
                // Ya no usamos el select de usuario. En su lugar, llenamos el campo RU y buscamos al usuario.
                // Asegúrate de que prestamo.usuario y prestamo.usuario.ru existan en los datos del backend
                if (prestamo.usuario && prestamo.usuario.ru) {
                    ruUsuarioInput.value = prestamo.usuario.ru; // Llena el input de RU con el RU del préstamo
                    console.log('RU encontrado en préstamo:', prestamo.usuario.ru);

                    // Llama a tu lógica de búsqueda por RU para mostrar el nombre y llenar el campo oculto
                    // Esto replica el comportamiento de buscar manualmente el RU al abrir la edición
                    fetch(`/usuarios/buscarPorRu/${prestamo.usuario.ru}`)
                        .then(response => {
                            if (!response.ok) {
                                // Manejar error si el usuario del préstamo existente no se encuentra por RU (ej: usuario eliminado)
                                return response.text().then(text => {
                                    const errorMsg = 'Error al buscar usuario por RU al editar: ' + text;
                                    console.error(errorMsg);
                                    // Mostrar mensaje de error al usuario en la interfaz
                                    infoUsuarioEncontrado.textContent = 'Error: No se pudo encontrar el usuario asociado (RU: ' + prestamo.usuario.ru + ').';
                                    usuarioIdOculto.value = ''; // Limpiar ID oculto
                                    // Opcional: Deshabilitar guardado si el usuario no se encuentra
                                    // guardarPrestamoBtn.disabled = true;
                                    throw new Error(errorMsg); // Propagar el error
                                });
                            }
                            return response.json();
                        })
                        .then(usuarioEncontrado => {
                            console.log('Usuario encontrado al buscar por RU (editar):', usuarioEncontrado);
                            if(usuarioEncontrado) {
                                infoUsuarioEncontrado.textContent = `Usuario encontrado: ${usuarioEncontrado.nombre} ${usuarioEncontrado.apellido}`;
                                usuarioIdOculto.value = usuarioEncontrado.idUsuario; // <-- Importante: llena el campo oculto con el ID
                                // Opcional: Habilitar el botón de guardar si se deshabilitó antes
                                // guardarPrestamoBtn.disabled = false;
                            } else {
                                // Esto debería ser cubierto por el 404, pero como fallback
                                infoUsuarioEncontrado.textContent = 'Error: Usuario asociado no encontrado para el RU proporcionado durante la edición.';
                                usuarioIdOculto.value = '';
                                // guardarPrestamoBtn.disabled = true;
                            }
                        })
                        .catch(error => {
                            console.error('Fetch error al buscar usuario por RU (editar):', error);
                            infoUsuarioEncontrado.textContent = 'Ocurrió un error al buscar el usuario asociado durante la edición.';
                            usuarioIdOculto.value = '';
                            // guardarPrestamoBtn.disabled = true;
                        });

                } else {
                    // Si el préstamo no tiene usuario o RU, limpiar los campos
                    ruUsuarioInput.value = '';
                    infoUsuarioEncontrado.textContent = 'No se encontró información de usuario para este préstamo.';
                    usuarioIdOculto.value = '';
                    // guardarPrestamoBtn.disabled = true; // Podrías considerar deshabilitar si no hay usuario válido
                }


                // Llenar el select de administrador
                // Esta línea fue la que probablemente dio error antes de mover show()
                const administradorSelect = document.getElementById('administrador'); // Obtener referencia aquí localmente
                if (administradorSelect) { // Verificar que el elemento existe
                    administradorSelect.value = prestamo.administrador ? prestamo.administrador.idAdministrador : '';
                } else {
                    console.error("Elemento con ID 'administrador' no encontrado al editar préstamo.");
                }


                // Llenar campos de fecha y hora
                document.getElementById('fechaPrestamo').value = window.formatDateTimeLocal(prestamo.fechaPrestamo, prestamo.horaPrestamo);
                document.getElementById('fechaDevolucionEstimada').value = window.formatDateTimeLocal(prestamo.fechaDevolucionEstimada, prestamo.fechaDevolucionEstimada ? prestamo.fechaDevolucionEstimada.split('T')[1] : null);


                // --- Llenar la lista de equipos seleccionados ---
                equiposSeleccionados = prestamo.detallesPrestamo && prestamo.detallesPrestamo.length > 0
                    ? prestamo.detallesPrestamo.map(detalle => ({
                        idEquipo: detalle.equipo.idEquipo,
                        nombre: detalle.equipo.nombre,
                        cantidad: detalle.cantidad
                        // Asegúrate de que el objeto detalle.equipo tiene idEquipo y nombre
                    }))
                    : [];
                window.actualizarEquiposPrestamoLista(); // Actualiza la lista visible en el modal

                // --- Llenar el select de laboratorio y cargar equipos/categorías ---
                const laboratorioSelectEdit = document.getElementById('laboratorio'); // Obtener referencia localmente
                if (laboratorioSelectEdit && prestamo.detallesPrestamo && prestamo.detallesPrestamo.length > 0 && prestamo.detallesPrestamo[0].equipo && prestamo.detallesPrestamo[0].equipo.laboratorio) {
                    const labId = prestamo.detallesPrestamo[0].equipo.laboratorio.idLaboratorio;
                    laboratorioSelectEdit.value = labId;
                    console.log('Laboratorio del préstamo:', labId);

                    // Usar setTimeout para dar tiempo al DOM a actualizarse antes de cargar dependencias
                    setTimeout(() => {
                        console.log('Cargando categorías y equipos para laboratorio:', labId);
                        window.cargarCategoriasPorLaboratorio(labId);
                        // Opcional: Puedes decidir si quieres cargar todos los equipos del lab o solo los del préstamo al editar.
                        // Si quieres cargar todos los del lab para poder añadir más:
                        window.cargarEquiposPorLaboratorio(labId);
                        // Si solo quieres mostrar los ya seleccionados (menos útil para editar):
                        // actualizarEquiposDisponiblesAlEditar(equiposSeleccionados); // Necesitarías crear esta nueva función
                        seleccionEquiposContainer.style.display = 'block'; // Muestra la sección de selección de equipos
                    }, 150); // Pequeño retraso aumentado ligeramente

                } else {
                    // Si no hay equipos o laboratorio asociado, limpiar y ocultar sección de equipos
                    console.log('Préstamo sin equipos o laboratorio asociado.');
                    if (laboratorioSelectEdit) laboratorioSelectEdit.value = '';
                    window.cargarCategoriasPorLaboratorio('');
                    window.cargarEquiposPorLaboratorio(''); // Limpia la lista de equipos disponibles
                    seleccionEquiposContainer.style.display = 'none';
                }


                // --- Configurar el título del modal y el botón de guardar ---
                document.getElementById('prestamoModalLabel').textContent = 'Editar Préstamo';
                guardarPrestamoBtn.textContent = 'Actualizar Préstamo';

                // prestamoModal.show() ya se movió arriba
            })
            .catch(error => {
                console.error('Error general al cargar préstamo para editar:', error); // Log en caso de error general
                alert('Ocurrió un error al cargar los datos del préstamo para editar.');
                // Ocultar el modal si hubo un error al cargar
                prestamoModal.hide();
            });
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
// **EVENT LISTENER PARA LA BÚSQUEDA DE USUARIO POR RU** <-- AÑADE ESTO
    btnBuscarUsuario.addEventListener('click', () => {
        const ru = ruUsuarioInput.value; // Obtiene el valor del input RU

        // Limpia información anterior y ID oculto mientras busca
        infoUsuarioEncontrado.textContent = 'Buscando...';
        usuarioIdOculto.value = '';

        if (!ru) {
            infoUsuarioEncontrado.textContent = 'Por favor, ingresa un RU.';
            return; // Sale si el campo RU está vacío
        }

        // Llama al endpoint del backend para buscar por RU
        fetch(`/usuarios/buscarPorRu/${ru}`) // <--- Usa la URL de tu UsuarioController
            .then(response => {
                if (!response.ok) {
                    // Si no se encuentra (ej: 404), lanza un error para ir al catch
                    if (response.status === 404) {
                        return null; // Indica que no se encontró
                    }
                    throw new Error('Error en la petición: ' + response.statusText);
                }
                return response.json(); // Procesa la respuesta como JSON
            })
            .then(usuario => {
                if (usuario) {
                    // Si el usuario es encontrado:
                    infoUsuarioEncontrado.textContent = `Usuario encontrado: ${usuario.nombre} ${usuario.apellido}`; // Muestra el nombre (ajusta según la estructura de tu objeto Usuario)
                    usuarioIdOculto.value = usuario.idUsuario; // <--- GUARDA EL ID EN EL CAMPO OCULTO
                    // Opcional: Puedes deshabilitar el campo RU después de encontrar al usuario si quieres
                    // ruUsuarioInput.disabled = true;
                    // btnBuscarUsuario.disabled = true;

                } else {
                    // Si el usuario NO es encontrado (respuesta 404 manejada por el null):
                    infoUsuarioEncontrado.textContent = 'Usuario no encontrado para el RU proporcionado.';
                    usuarioIdOculto.value = ''; // Asegura que el ID oculto esté vacío
                }
            })
            .catch(error => {
                // Manejo de errores de red o del fetch
                console.error('Error al buscar usuario por RU:', error);
                infoUsuarioEncontrado.textContent = 'Ocurrió un error al buscar el usuario.';
                usuarioIdOculto.value = ''; // Asegura que el ID oculto esté vacío
            });
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
      const usuarioId = document.getElementById('usuarioIdOculto').value;
      const administradorId = document.getElementById('administrador').value;// <--- USA EL VALOR DEL CAMPO OCULTO
      // const administradorId = document.getElementById('administrador').value;
      if (!usuarioId) {
          // Usa el div de infoUsuarioEncontrado para mostrar el mensaje
          infoUsuarioEncontrado.textContent = "Por favor, busca y selecciona un usuario por su RU antes de guardar.";
          return; // Detiene el envío del formulario
      }
      if (!administradorId) { alert("Selecciona un administrador."); return; }
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
    // Evento al ocultar el modal de préstamo (Resetear formulario)
    // Evento que se dispara cuando el modal de préstamo/edición ha terminado de ocultarse.
// Este listener limpia el formulario, variables y maneja el foco.
    prestamoModalElement.addEventListener('hidden.bs.modal', function () {
        console.log('Modal de préstamo oculto.'); // Log para depuración

        // --- Código existente para limpiar el formulario y variables ---
        nuevoPrestamoForm.reset(); // Resetea el formulario principal del modal
        equiposSeleccionados = []; // Limpia la lista de equipos seleccionados en JS
        window.actualizarEquiposPrestamoLista(); // Actualiza la lista visible en el modal
        prestamoIdInput.value = ''; // Limpia el input oculto del ID del préstamo
        guardarPrestamoBtn.textContent = 'Guardar Préstamo'; // Restaura el texto del botón
        document.getElementById('prestamoModalLabel').textContent = 'Nuevo Préstamo'; // Restaura el título del modal
        seleccionEquiposContainer.style.display = 'none'; // Oculta la sección de selección de equipos
        equiposDisponiblesContainer.innerHTML = ''; // Limpia la lista de equipos disponibles
        laboratorioSelect.value = ''; // Limpia el select de laboratorio
        categoriaSelect.value = ''; // Limpia el select de categoría

        // Limpieza de los campos de usuario/RU
        // Asegúrate de que estos elementos existen en tu HTML
        const ruUsuarioInput = document.getElementById('ruUsuarioInput'); // Obtén referencia localmente si no es global
        const infoUsuarioEncontrado = document.getElementById('infoUsuarioEncontrado'); // Obtén referencia localmente
        const usuarioIdOculto = document.getElementById('usuarioIdOculto'); // Obtén referencia localmente
        const btnBuscarUsuario = document.getElementById('btnBuscarUsuario'); // Obtén referencia localmente

        if (ruUsuarioInput) ruUsuarioInput.value = '';
        if (infoUsuarioEncontrado) infoUsuarioEncontrado.textContent = '';
        if (usuarioIdOculto) usuarioIdOculto.value = '';
        // Usamos un pequeño setTimeout para dar tiempo al DOM a estabilizarse después de que el modal se oculte.
        setTimeout(() => {
            // Intentamos enfocar el botón "Nuevo Préstamo".
            // Asegúrate de que la variable 'btnNuevoPrestamo' esté declarada al inicio de tu script
            // (por ejemplo: const btnNuevoPrestamo = document.querySelector('[data-bs-target="#prestamoModal"]');)
            if (btnNuevoPrestamo) {
                btnNuevoPrestamo.focus(); // Mueve el foco a este elemento
                console.log('Foco movido al botón Nuevo Préstamo después de cerrar modal préstamo.'); // Log para depuración
            } else {
                // Si por alguna razón no se encuentra el botón, registramos una advertencia
                console.warn('Botón "Nuevo Préstamo" (o el elemento de destino del foco) no encontrado para mover el foco después de cerrar modal préstamo.');
            }
        }, 100); // Retraso de 100 milisegundos. Puedes ajustar este valor si es necesario.

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