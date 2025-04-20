package com.proyecto.sistema.controller;

import com.proyecto.sistema.model.DetallePrestamo;
import com.proyecto.sistema.model.Equipo;
import com.proyecto.sistema.model.Prestamo;
import com.proyecto.sistema.repository.DetallePrestamoRepository;
import com.proyecto.sistema.repository.EquipoRepository;
import com.proyecto.sistema.repository.PrestamoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional; // Importar Transactional
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.time.Instant;
import java.time.ZoneId;
import java.time.LocalDateTime;
import java.time.LocalTime; // Asegurarse de importar LocalTime
import java.util.ArrayList;
import java.util.Iterator;

@RestController
@RequestMapping("/prestamos")
public class PrestamoController {

    @Autowired
    private PrestamoRepository prestamoRepository;

    @Autowired
    private DetallePrestamoRepository detallePrestamoRepository;

    @Autowired
    private EquipoRepository equipoRepository;

    @GetMapping
    public List<Prestamo> obtenerPrestamos() {
        // Asegura que los detalles se carguen si no están ya cargados por defecto
        // Esto podría requerir configuración de fetching en JPA o ser manejado por Jackson
        // si usas @JsonManagedReference como en tu modelo.
        return prestamoRepository.findAll();
    }

    @PostMapping
    @Transactional // Asegura que la creación y el descuento de stock sean atómicos
    public ResponseEntity<Prestamo> crearPrestamo(@RequestBody Prestamo prestamo) {
        // Lógica para extraer horaPrestamo si el frontend envía fecha+hora combinadas
        if (prestamo.getFechaPrestamo() != null && prestamo.getHoraPrestamo() == null) {
            try {
                Instant instant = prestamo.getFechaPrestamo().toInstant();
                LocalDateTime localDateTime = instant.atZone(ZoneId.systemDefault()).toLocalDateTime();
                prestamo.setHoraPrestamo(localDateTime.toLocalTime());
                // Si fechaPrestamo en tu modelo es java.util.Date, ya debería estar bien.
                // Si es java.sql.Date o java.time.LocalDate/LocalDateTime, ajusta la asignación aquí si es necesario.
            } catch (Exception e) {
                System.err.println("Error al extraer hora de fechaPrestamo en POST: " + e.getMessage());
                throw new RuntimeException("Formato de fecha u hora inválido para el préstamo."); // Lanza excepción para rollback y 400
            }
        } else if (prestamo.getFechaPrestamo() == null || prestamo.getHoraPrestamo() == null) {
            // Si falta fecha u hora y son obligatorias en BD
            throw new RuntimeException("Fecha y hora de préstamo son requeridas."); // Lanza excepción para rollback y 400
        }


        // Clona el objeto recibido para evitar efectos secundarios inesperados antes de guardar
        Prestamo nuevoPrestamo = new Prestamo();
        nuevoPrestamo.setUsuario(prestamo.getUsuario());
        nuevoPrestamo.setAdministrador(prestamo.getAdministrador());
        nuevoPrestamo.setFechaPrestamo(prestamo.getFechaPrestamo());
        nuevoPrestamo.setHoraPrestamo(prestamo.getHoraPrestamo());
        // Asegura un estado por defecto si no viene en el request, o valida que venga
        nuevoPrestamo.setEstado(prestamo.getEstado() != null ? prestamo.getEstado() : "pendiente");
        nuevoPrestamo.setFechaDevolucionEstimada(prestamo.getFechaDevolucionEstimada());

        // Guardar el préstamo principal primero para obtener su ID
        Prestamo prestamoGuardado = prestamoRepository.save(nuevoPrestamo);

        // **>>> INICIO LÓGICA STOCK Y DETALLES AL CREAR <<<**
        List<DetallePrestamo> detallesParaGuardar = new ArrayList<>();

        if (prestamo.getDetallesPrestamo() != null && !prestamo.getDetallesPrestamo().isEmpty()) {
            for (DetallePrestamo detalleRequest : prestamo.getDetallesPrestamo()) {
                // Validar que el equipo y la cantidad vengan en el detalle
                if (detalleRequest.getEquipo() == null || detalleRequest.getEquipo().getIdEquipo() == 0 || detalleRequest.getCantidad() <= 0) {
                    throw new RuntimeException("Detalle de préstamo inválido: equipo o cantidad no especificados.");
                }

                Optional<Equipo> equipoOptional = equipoRepository.findById(detalleRequest.getEquipo().getIdEquipo());

                if (!equipoOptional.isPresent()) {
                    throw new RuntimeException("Equipo no encontrado con ID: " + detalleRequest.getEquipo().getIdEquipo() + " en los detalles del préstamo.");
                }

                Equipo equipo = equipoOptional.get();
                int cantidadSolicitada = detalleRequest.getCantidad();

                if (equipo.getCantidad() < cantidadSolicitada) {
                    throw new RuntimeException("Stock insuficiente (" + equipo.getCantidad() + ") para el equipo con ID: " + equipo.getIdEquipo() + ". Cantidad solicitada: " + cantidadSolicitada);
                }

                // Descontar stock
                equipo.setCantidad(equipo.getCantidad() - cantidadSolicitada);
                equipoRepository.save(equipo); // Guarda el stock actualizado

                // Prepara el detalle para guardar, asignando el préstamo guardado
                DetallePrestamo nuevoDetalle = new DetallePrestamo();
                nuevoDetalle.setPrestamo(prestamoGuardado); // Asocia al préstamo principal
                nuevoDetalle.setEquipo(equipo); // Asocia el objeto Equipo completo
                nuevoDetalle.setCantidad(cantidadSolicitada);

                detallesParaGuardar.add(nuevoDetalle);
            }

            // Guarda todos los detalles de préstamo asociados al nuevo préstamo
            detallePrestamoRepository.saveAll(detallesParaGuardar);
            // Asocia los detalles guardados al objeto Prestamo en memoria
            prestamoGuardado.setDetallesPrestamo(detallesParaGuardar);

        } else {
            // Si no vienen detalles en el request, y se permite un préstamo sin equipos,
            // inicializa la lista de detalles vacía. Si un préstamo debe tener equipos,
            // deberías lanzar una excepción aquí.
            prestamoGuardado.setDetallesPrestamo(new ArrayList<>());
            // throw new RuntimeException("El préstamo debe incluir al menos un equipo."); // Si los detalles son obligatorios
        }
        // **>>> FIN LÓGICA STOCK Y DETALLES AL CREAR <<<**


        // Retorna el préstamo guardado (con los detalles asociados en memoria)
        return new ResponseEntity<>(prestamoGuardado, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @Transactional // Asegura que toda la operación de actualización y ajuste de stock sea atómica
    public ResponseEntity<Prestamo> actualizarPrestamo(@PathVariable int id, @RequestBody Prestamo prestamo) {
        Optional<Prestamo> prestamoExistenteOptional = prestamoRepository.findById(id);
        if (!prestamoExistenteOptional.isPresent()) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND); // Préstamo no encontrado
        }

        Prestamo prestamoActualizado = prestamoExistenteOptional.get();

        // **>>> INICIO LÓGICA STOCK Y DETALLES AL ACTUALIZAR (Corregido orphanRemoval) <<<**

        // 1. Recuperar stock de los detalles ANTIGUOS recorriendo la colección GESTIONADA por Hibernate
        // Creamos una COPIA para poder iterar mientras modificamos la lista original en el objeto gestionado
        List<DetallePrestamo> detallesAntiguosCopia = new ArrayList<>(prestamoActualizado.getDetallesPrestamo());

        if (detallesAntiguosCopia != null && !detallesAntiguosCopia.isEmpty()) {
            for (DetallePrestamo detalleAntiguo : detallesAntiguosCopia) {
                Optional<Equipo> equipoOptional = equipoRepository.findById(detalleAntiguo.getEquipo().getIdEquipo());
                if (equipoOptional.isPresent()) {
                    Equipo equipo = equipoOptional.get();
                    // Sumar la cantidad que estaba prestada de vuelta al stock
                    equipo.setCantidad(equipo.getCantidad() + detalleAntiguo.getCantidad());
                    equipoRepository.save(equipo); // Guarda el stock actualizado
                } else {
                    // Esto indica un posible problema de datos: un detalle apunta a un equipo que no existe
                    System.err.println("ADVERTENCIA: Equipo con ID: " + detalleAntiguo.getEquipo().getIdEquipo() + " no encontrado al intentar recuperar stock antiguo para el préstamo " + id + ". Detalle ID: " + detalleAntiguo.getIdDetalle());
                    // Dependiendo de la política, podrías lanzar una excepción aquí si esto es crítico.
                }
            }
        }

        // 2. ELIMINAR todos los detalles ANTIGUOS limpiando la colección GESTIONADA
        // Debido a orphanRemoval=true en Prestamo.java y cascade=ALL, Hibernate eliminará estos detalles de la BD al guardar el padre.
        prestamoActualizado.getDetallesPrestamo().clear();


        // 3. Procesar los NUEVOS detalles, descontar stock y añadirlos a la colección GESTIONADA

        List<DetallePrestamo> nuevosDetallesRecibidos = prestamo.getDetallesPrestamo(); // Detalles del RequestBody
        if (nuevosDetallesRecibidos != null && !nuevosDetallesRecibidos.isEmpty()) {
            for (DetallePrestamo detalleRequest : nuevosDetallesRecibidos) {
                // Validar que el equipo y la cantidad vengan en el detalle
                if (detalleRequest.getEquipo() == null || detalleRequest.getEquipo().getIdEquipo() == 0 || detalleRequest.getCantidad() <= 0) {
                    throw new RuntimeException("Detalle de préstamo inválido: equipo o cantidad no especificados en la actualización.");
                }

                Optional<Equipo> equipoOptional = equipoRepository.findById(detalleRequest.getEquipo().getIdEquipo());

                if (!equipoOptional.isPresent()) {
                    throw new RuntimeException("Equipo no encontrado con ID: " + detalleRequest.getEquipo().getIdEquipo() + " al procesar nuevos detalles para el préstamo " + id);
                }

                Equipo equipo = equipoOptional.get();
                int cantidadSolicitada = detalleRequest.getCantidad();

                // Verificar stock (ahora contra el stock recuperado + stock base)
                if (equipo.getCantidad() < cantidadSolicitada) {
                    throw new RuntimeException("Stock insuficiente (" + equipo.getCantidad() + ") para el equipo con ID: " + equipo.getIdEquipo() + " al actualizar préstamo " + id + ". Cantidad solicitada: " + cantidadSolicitada);
                }

                // Descontar stock de la cantidad que se va a prestar en la nueva versión del préstamo
                equipo.setCantidad(equipo.getCantidad() - cantidadSolicitada);
                equipoRepository.save(equipo); // Guarda el stock actualizado

                // Crear nueva instancia de DetallePrestamo y añadirla a la colección GESTIONADA
                // No asignamos ID al nuevo detalle, JPA/Hibernate se encarga.
                DetallePrestamo nuevoDetalle = new DetallePrestamo();
                nuevoDetalle.setPrestamo(prestamoActualizado); // Es importante setear la referencia al padre
                nuevoDetalle.setEquipo(equipo); // Asocia el objeto Equipo completo
                nuevoDetalle.setCantidad(cantidadSolicitada);

                // Añadir a la colección GESTIONADA. Debido a cascade=ALL, este nuevo detalle será insertado.
                prestamoActualizado.getDetallesPrestamo().add(nuevoDetalle);
            }
        } else {
            // Si no vienen detalles en la actualización, se borran todos los anteriores
            // y ya se recuperó el stock al inicio del método. Asegura que la lista en el objeto sea vacía.
            prestamoActualizado.setDetallesPrestamo(new ArrayList<>());
        }
        // **>>> FIN LÓGICA STOCK Y DETALLES AL ACTUALIZAR <<<**


        // 4. Actualizar las propiedades básicas del préstamo (esta parte se mantiene)
        prestamoActualizado.setUsuario(prestamo.getUsuario());
        prestamoActualizado.setAdministrador(prestamo.getAdministrador());
        // Permite actualizar el estado del préstamo (ej: a "devuelto", aunque la devolución tiene su propio endpoint)
        // Si el estado se actualiza a "devuelto" aquí, asegúrate de que la lógica de stock en la devolución
        // no se duplique o cause inconsistencias. Es mejor que el estado "devuelto" solo se setee en el endpoint de devolución.
        if (prestamo.getEstado() != null) {
            prestamoActualizado.setEstado(prestamo.getEstado());
        }
        prestamoActualizado.setFechaDevolucionEstimada(prestamo.getFechaDevolucionEstimada());

        // Lógica para horaPrestamo (se mantiene)
        if (prestamo.getFechaPrestamo() != null) {
            try {
                Instant instant = prestamo.getFechaPrestamo().toInstant();
                LocalDateTime localDateTime = instant.atZone(ZoneId.systemDefault()).toLocalDateTime();
                // Asigna la fecha. Asegúrate de que el tipo en tu modelo (java.util.Date, java.sql.Date, etc.)
                // sea compatible o conviértelo apropiadamente. java.util.Date.from(Instant) es común.
                prestamoActualizado.setFechaPrestamo(java.util.Date.from(localDateTime.atZone(ZoneId.systemDefault()).toInstant()));
                // Asigna la hora. Asegúrate de que el campo en tu modelo es java.time.LocalTime.
                prestamoActualizado.setHoraPrestamo(localDateTime.toLocalTime());
            } catch (Exception e) {
                System.err.println("Error al parsear fecha/hora de la solicitud de actualización para préstamo " + id + ": " + e.getMessage());
                throw new RuntimeException("Formato de fecha u hora inválido.");
            }
        } else {
            // Si la fecha de préstamo es eliminada o nula en la solicitud de actualización
            // Y es requerida en la BD, lanza un error.
            System.err.println("FechaPrestamo es null en la solicitud de actualización para préstamo " + id);
            throw new RuntimeException("Fecha de préstamo es requerida.");
        }


        // 5. Guardar la entidad padre. Hibernate gestionará automáticamente las inserciones,
        // actualizaciones y eliminaciones de los detalles debido a @Transactional,
        // cascade=ALL y orphanRemoval=true, basado en los cambios que hicimos a la colección gestionada.
        Prestamo prestamoGuardado = prestamoRepository.save(prestamoActualizado);


        // JPA/Hibernate debería devolver el objeto 'prestamoGuardado' con la colección 'detallesPrestamo'
        // ya actualizada y asociada. Confía en esto para la respuesta.
        return new ResponseEntity<>(prestamoGuardado, HttpStatus.OK);
    }


    // Método para obtener préstamo por ID (se mantiene igual)
    @GetMapping("/{id}")
    public ResponseEntity<Prestamo> obtenerPrestamoPorId(@PathVariable int id) {
        // Asegura que los detalles se carguen al obtener un préstamo por ID si no es por defecto
        // Optional<Prestamo> prestamo = prestamoRepository.findById(id); // Esto puede no cargar los detalles
        // Podrías necesitar un método en el repositorio con un JOIN FETCH si los detalles no se cargan lazy/eager apropiadamente
        Optional<Prestamo> prestamo = prestamoRepository.findById(id); // O ajusta el fetch type/usa un query dedicado si es necesario

        return prestamo.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // Considera agregar un endpoint DELETE para préstamos
    // Esto también debería manejar la recuperación de stock de los equipos antes de eliminar el préstamo y sus detalles.
     /*
     @DeleteMapping("/{id}")
     @Transactional
     public ResponseEntity<?> eliminarPrestamo(@PathVariable int id) {
         Optional<Prestamo> prestamoOptional = prestamoRepository.findById(id);
         if (!prestamoOptional.isPresent()) {
             return new ResponseEntity<>(HttpStatus.NOT_FOUND);
         }
         Prestamo prestamoParaEliminar = prestamoOptional.get();

         // Recuperar stock de los detalles antes de que sean eliminados por cascade/orphanRemoval
         List<DetallePrestamo> detallesAEliminar = new ArrayList<>(prestamoParaEliminar.getDetallesPrestamo()); // Copia

         if (detallesAEliminar != null && !detallesAEliminar.isEmpty()) {
             for (DetallePrestamo detalle : detallesAEliminar) {
                 Optional<Equipo> equipoOptional = equipoRepository.findById(detalle.getEquipo().getIdEquipo());
                 if (equipoOptional.isPresent()) {
                     Equipo equipo = equipoOptional.get();
                     equipo.setCantidad(equipo.getCantidad() + detalle.getCantidad());
                     equipoRepository.save(equipo); // Guarda el stock actualizado
                 } else {
                     System.err.println("ADVERTENCIA: Equipo con ID: " + detalle.getEquipo().getIdEquipo() + " no encontrado al intentar recuperar stock durante la eliminación del préstamo " + id);
                 }
             }
         }

         // Eliminar el préstamo principal. Debido a cascade=ALL y orphanRemoval=true, los detalles también se eliminarán.
         prestamoRepository.delete(prestamoParaEliminar);

         return new ResponseEntity<>(HttpStatus.NO_CONTENT); // 204 No Content para eliminación exitosa
     }
     */
}