document.addEventListener('DOMContentLoaded', function () {
    const API_BASE_URL = 'http://localhost:8083'; // Asegúrate que el puerto es correcto

    // --- Código Común: Sidebar Toggle ---
    // Este código se ejecuta en cualquier página donde existan estos elementos
    const toggleBtn = document.getElementById('toggleSidebar');
    const sidebar = document.getElementById('sidebar');
    const content = document.getElementById('content');

    if(toggleBtn && sidebar && content) {
        toggleBtn.addEventListener('click', function () {
            sidebar.classList.toggle('collapsed');
            content.classList.toggle('sidebar-collapsed');
        });
    }

    // --- Código Específico para la Sección de Administración de Laboratorios ---
    // Solo se ejecuta si el formulario de laboratorio está presente en la página
    const laboratorioForm = document.getElementById('laboratorio-form');
    if (laboratorioForm) { // Verificar si el formulario existe
        console.log("Lógica de administración de laboratorios activada."); // Para depuración

        // Selectores para la sección de administración de laboratorios
        const adminLaboratoriosSection = document.getElementById('adminLaboratoriosSection');
        const laboratorioIdInput = document.getElementById('laboratorio-id');
        const nombreInput = document.getElementById('nombre');
        const ubicacionInput = document.getElementById('ubicacion');
        const submitButton = document.getElementById('submit-button');
        const laboratoriosBody = document.getElementById('laboratorios-body');
        const cancelEditButton = document.getElementById('cancel-edit-button');

        // --- Lógica para Administración de Laboratorios ---
        function cargarLaboratorios() {
            fetch(`${API_BASE_URL}/laboratorios`)
                .then(response => {
                    if (!response.ok) throw new Error('Error en la respuesta: ' + response.status);
                    return response.json();
                })
                .then(data => {
                    laboratoriosBody.innerHTML = ''; // Limpiar la tabla actual
                    data.forEach(laboratorio => {
                        const row = document.createElement('tr');
                        // Usamos template literals (comillas invertidas) y accedemos a las propiedades
                        // del objeto laboratorio directamente con punto (laboratorio.idLaboratorio, etc.)
                        row.innerHTML = `
                              <td>${laboratorio.idLaboratorio}</td>
                              <td>${laboratorio.nombre}</td>
                              <td>${laboratorio.ubicacion}</td>
                              <td>
                                  <button class="btn btn-info btn-sm btn-accion btn-editar"
                                          data-id="${laboratorio.idLaboratorio}"
                                          data-nombre="${laboratorio.nombre}"
                                          data-ubicacion="${laboratorio.ubicacion}">Editar</button>
                                  <button class="btn btn-success btn-sm btn-accion btn-ver-horario"
                                          data-id="${laboratorio.idLaboratorio}"
                                          data-nombre="${laboratorio.nombre}">Ver Horario</button>
                              </td>
                          `;
                        laboratoriosBody.appendChild(row);
                    });
                    agregarEventListenersAcciones();
                })
                .catch(error => console.error('Error al cargar laboratorios:', error));
        }

        function agregarEventListenersAcciones() {
            // Botones Editar
            document.querySelectorAll('.btn-editar').forEach(boton => {
                boton.addEventListener('click', function() {
                    laboratorioIdInput.value = this.dataset.id;
                    nombreInput.value = this.dataset.nombre;
                    ubicacionInput.value = this.dataset.ubicacion;
                    submitButton.textContent = 'Actualizar Laboratorio';
                    cancelEditButton.style.display = 'inline-block';
                    window.scrollTo(0, 0); // Scroll al formulario
                });
            });

            // Botones Ver Horario
            document.querySelectorAll('.btn-ver-horario').forEach(boton => {
                boton.addEventListener('click', function() {
                    const labId = this.dataset.id;
                    const labNombre = this.dataset.nombre;
                    mostrarVistaHorario(labId, labNombre);
                });
            });
        }

        cancelEditButton.addEventListener('click', function() {
            laboratorioIdInput.value = '';
            laboratorioForm.reset();
            submitButton.textContent = 'Agregar Laboratorio';
            this.style.display = 'none';
        });


        laboratorioForm.addEventListener('submit', function (event) {
            event.preventDefault();
            const id = laboratorioIdInput.value;
            const nombre = nombreInput.value;
            const ubicacion = ubicacionInput.value;

            const method = id ? 'PUT' : 'POST';
            // La URL para PUT debe incluir el ID en la ruta si tu backend lo espera así.
            // Si tu backend espera el ID en el body para PUT, la URL sería solo '/laboratorios'.
            // Ajusta esta línea según la implementación de tu API de Spring Boot.
            // Asumimos que PUT espera el ID en la URL: /laboratorios/{id}
            const url = id ? `${API_BASE_URL}/laboratorios/${id}` : `${API_BASE_URL}/laboratorios`;
            const dataToSend = { nombre, ubicacion }; // El backend espera nombre y ubicacion en el body

            // Si tu backend *también* espera el idLaboratorio en el body para la actualización (PUT),
            // descomenta la siguiente línea o incluye id en dataToSend condicionalmente.
            // if (id) dataToSend.idLaboratorio = parseInt(id); // Asegúrate de que el tipo coincida con tu backend (number/long)


            fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dataToSend)
            })
                .then(response => {
                    // Manejo más detallado de respuestas para debug
                    if (response.ok) {
                        console.log('Laboratorio guardado/actualizado exitosamente');
                        cargarLaboratorios(); // Recargar la lista
                        laboratorioForm.reset(); // Limpiar formulario
                        laboratorioIdInput.value = ''; // Resetear ID oculto
                        submitButton.textContent = 'Agregar Laboratorio'; // Cambiar texto del botón
                        cancelEditButton.style.display = 'none'; // Ocultar botón cancelar
                    } else {
                        // Intentar leer el cuerpo de la respuesta para obtener detalles del error
                        response.text().then(text => {
                            console.error('Error en la respuesta del servidor:', response.status, text);
                            alert('Error al guardar laboratorio: ' + text); // Mostrar error al usuario
                        }).catch(err => {
                            console.error('Error al leer el cuerpo del error:', err);
                            alert('Error al guardar laboratorio (no se pudo leer el detalle del error).');
                        });
                    }
                })
                .catch(error => {
                    console.error('Error en la solicitud fetch:', error);
                    alert('Ocurrió un error al comunicarse con el servidor.');
                });
        });

        // Carga inicial de laboratorios al cargar la página (si estamos en la página de laboratorios)
        cargarLaboratorios();

    } // Fin del bloque de lógica de administración de laboratorios


    // --- Código Específico para la Sección de Visualización de Horarios ---
    // Solo se ejecuta si el contenedor del horario está presente en la página
    const horarioLaboratorioSection = document.getElementById('horarioLaboratorioSection');
    if (horarioLaboratorioSection) { // Verificar si la sección de horario existe
        console.log("Lógica de visualización de horarios activada."); // Para depuración

        // Selectores para la sección de horarios
        const nombreLaboratorioHorarioTitulo = document.getElementById('nombreLaboratorioHorario');
        const tablaHorarioContenedor = document.getElementById('tablaHorarioContenedor');
        const btnVolverALabs = document.getElementById('btnVolverALabs');

        // Ajusta estos valores según la lógica de tu backend y las horas que manejes
        const DIAS_SEMANA_HORARIO = ["LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES"];
        const HORA_INICIO_CLASES_HORARIO = 8; // Hora de inicio (ej: 8 para 08:00)
        const HORA_FIN_CLASES_HORARIO = 18; // Hora de fin (el bucle irá hasta < HORA_FIN, es decir, hasta la hora 17:00)

        function mostrarVistaHorario(idLaboratorio, nombreLaboratorio) {
            // Asumiendo que adminLaboratoriosSection también existe en esta página si se muestra el horario
            const adminLaboratoriosSection = document.getElementById('adminLaboratoriosSection');
            if (adminLaboratoriosSection) {
                adminLaboratoriosSection.style.display = 'none';
            }
            horarioLaboratorioSection.style.display = 'block';
            nombreLaboratorioHorarioTitulo.textContent = `Horario del Laboratorio: ${nombreLaboratorio}`;
            tablaHorarioContenedor.innerHTML = '<p>Cargando horario...</p>'; // Feedback mientras carga
            crearYMostrarTablaHorario(idLaboratorio);
        }

        if (btnVolverALabs) { // Verificar si el botón de volver existe
            btnVolverALabs.addEventListener('click', () => {
                horarioLaboratorioSection.style.display = 'none';
                const adminLaboratoriosSection = document.getElementById('adminLaboratoriosSection');
                if (adminLaboratoriosSection) {
                    adminLaboratoriosSection.style.display = 'block';
                }
                tablaHorarioContenedor.innerHTML = ''; // Limpiar el contenedor del horario al volver
                nombreLaboratorioHorarioTitulo.textContent = 'Horario del Laboratorio'; // Resetear título
            });
        }


        async function crearYMostrarTablaHorario(idLaboratorio) {
            const tabla = document.createElement('table');
            tabla.classList.add('horario-tabla');
            tabla.setAttribute('data-lab-id', idLaboratorio);

            const thead = tabla.createTHead();
            const headerRow = thead.insertRow();
            const thHora = document.createElement('th');
            thHora.textContent = 'Hora';
            headerRow.appendChild(thHora);
            DIAS_SEMANA_HORARIO.forEach(dia => {
                const th = document.createElement('th');
                // Capitaliza la primera letra y deja el resto en minúsculas para mostrar "Lunes", "Martes", etc.
                th.textContent = dia.charAt(0).toUpperCase() + dia.slice(1).toLowerCase();
                headerRow.appendChild(th);
            });

            const tbody = tabla.createTBody();
            try {
                const horarioData = await obtenerHorarioDeAPI(idLaboratorio);
                // Crear un mapa para acceder fácilmente a los bloques de horario por hora y día
                const horarioPorHoraYDia = {};
                horarioData.forEach(bloque => {
                    if (!horarioPorHoraYDia[bloque.horaInicio]) {
                        horarioPorHoraYDia[bloque.horaInicio] = {};
                    }
                    horarioPorHoraYDia[bloque.horaInicio][bloque.diaSemana] = bloque;
                });

                // Llenar la tabla con las horas y los bloques de horario
                for (let h = HORA_INICIO_CLASES_HORARIO; h < HORA_FIN_CLASES_HORARIO; h++) {
                    const horaActualStr = `${String(h).padStart(2, '0')}:00:00`; // Formato HH:mm:ss para comparar con el backend
                    const tr = tbody.insertRow();
                    const tdHora = tr.insertCell();
                    tdHora.textContent = `${String(h).padStart(2, '0')}:00 - ${String(h + 1).padStart(2, '0')}:00`;

                    DIAS_SEMANA_HORARIO.forEach(dia => {
                        const td = tr.insertCell();
                        td.classList.add('horario-celda');
                        const bloque = horarioPorHoraYDia[horaActualStr] ? horarioPorHoraYDia[horaActualStr][dia] : null;

                        if (bloque) {
                            td.setAttribute('data-horario-id', bloque.idHorario);
                            // Añadir la clase 'ocupado' si el backend indica que está ocupado
                            if (bloque.ocupado) {
                                td.classList.add('ocupado');
                            }
                            // Agregar listener para toggle si el bloque existe
                            td.addEventListener('click', () => toggleOcupadoCelda(td, bloque.idHorario));
                        } else {
                            // Manejar celdas donde no hay un bloque de horario definido en el backend
                            console.warn(`Bloque de horario no encontrado para Lab ${idLaboratorio}, Día ${dia}, Hora ${horaActualStr}. Esta celda no será interactiva.`);
                            td.style.cursor = 'not-allowed'; // Cambiar cursor para indicar que no es clicable
                            td.textContent = '-'; // Opcional: mostrar algo en celdas vacías
                            td.classList.add('celda-vacia'); // Opcional: añadir clase para estilizar celdas vacías
                        }
                    });
                }
                tablaHorarioContenedor.innerHTML = ''; // Limpiar el "Cargando..."
                tablaHorarioContenedor.appendChild(tabla); // Añadir la tabla generada
                console.log('Tabla de horario creada y mostrada.');

            } catch (error) {
                tablaHorarioContenedor.innerHTML = '<p>Error al cargar el horario. Verifique la conexión con el servidor.</p>';
                console.error("Error al crear o cargar tabla de horario:", error);
            }
        }

        async function obtenerHorarioDeAPI(idLaboratorio) {
            // Asegúrate que la URL coincida con tu endpoint de Spring Boot para obtener horarios por laboratorio
            const response = await fetch(`${API_BASE_URL}/laboratorios/${idLaboratorio}/horario`);
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Error HTTP al obtener horario: ${response.status} - ${errorText}`);
            }
            return await response.json();
        }

        async function toggleOcupadoCelda(celda, idHorario) {
            if (!idHorario) {
                console.warn("Intento de click en celda sin idHorario. No se realizará la acción.");
                return;
            }
            const estabaOcupado = celda.classList.contains('ocupado');
            const nuevoEstadoOcupado = !estabaOcupado; // Invertir el estado actual

            try {
                // Asegúrate que la URL y el método coincidan con tu endpoint de Spring Boot para actualizar un bloque de horario
                // Este endpoint debería recibir el ID del bloque de horario y el nuevo estado (ocupado/disponible)
                const response = await fetch(`${API_BASE_URL}/laboratorios/horario/${idHorario}/ocupado?ocupado=${nuevoEstadoOcupado}`, {
                    method: 'PUT' // O PATCH, dependiendo de tu implementación REST
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Error HTTP al actualizar estado: ${response.status} - ${errorText}`);
                }

                // Si la respuesta es exitosa, actualiza la clase CSS en la celda
                celda.classList.toggle('ocupado', nuevoEstadoOcupado);
                console.log(`Estado del horario ${idHorario} actualizado a ${nuevoEstadoOcupado ? 'ocupado' : 'disponible'}`);

            } catch (error) {
                console.error('Error al actualizar estado de ocupación:', error);
                alert('No se pudo actualizar el estado del horario. Verifique la conexión con el servidor y la implementación del backend.');
                // Opcional: revertir la UI si la actualización falla
                // celda.classList.toggle('ocupado', estabaOcupado);
            }
        }
        // NOTA: La función mostrarVistaHorario es llamada desde los botones en la tabla de laboratorios,
        // por lo que no necesita ser llamada aquí al cargar la página.

    } // Fin del bloque de lógica de visualización de horarios


    // --- Código Específico para el Dashboard de Usuario ---
    // Solo se ejecuta si la sección de datos del usuario está presente en la página
    const userDataSection = document.querySelector('.dashboard-section.user-data');
    if (userDataSection) { // Verificar si la sección de datos del usuario existe
        console.log("Lógica del dashboard de usuario activada."); // Para depuración

    }
}); // Fin DOMContentLoaded
