package com.proyecto.sistema.controller;

import com.proyecto.sistema.model.DetallePrestamo;
import com.proyecto.sistema.model.Devolucion; // Importa la clase Devolucion
import com.proyecto.sistema.model.Equipo;
import com.proyecto.sistema.model.Prestamo;
import com.proyecto.sistema.repository.DetallePrestamoRepository;
import com.proyecto.sistema.repository.DevolucionRepository; // Importa el repositorio de Devolucion
import com.proyecto.sistema.repository.EquipoRepository;
import com.proyecto.sistema.repository.PrestamoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/prestamos")
public class PrestamoController {

    @Autowired
    private PrestamoRepository prestamoRepository;

    @Autowired
    private DetallePrestamoRepository detallePrestamoRepository;

    @Autowired
    private EquipoRepository equipoRepository;

    @Autowired
    private DevolucionRepository devolucionRepository; // Inyecta el repositorio de Devolucion

    @GetMapping
    public List<Prestamo> obtenerPrestamos() {
        return prestamoRepository.findAll();
    }

    @PostMapping
    @Transactional
    public ResponseEntity<Prestamo> crearPrestamo(@RequestBody Prestamo prestamo) {
        // ... (Tu código existente para crear préstamo) ...
        if (prestamo.getFechaPrestamo() != null && prestamo.getHoraPrestamo() == null) {
            try {
                Instant instant = prestamo.getFechaPrestamo().toInstant();
                LocalDateTime localDateTime = instant.atZone(ZoneId.systemDefault()).toLocalDateTime();
                prestamo.setHoraPrestamo(localDateTime.toLocalTime());
            } catch (Exception e) {
                System.err.println("Error al extraer hora de fechaPrestamo en POST: " + e.getMessage());
                throw new RuntimeException("Formato de fecha u hora inválido para el préstamo.");
            }
        } else if (prestamo.getFechaPrestamo() == null || prestamo.getHoraPrestamo() == null) {
            throw new RuntimeException("Fecha y hora de préstamo son requeridas.");
        }

        Prestamo nuevoPrestamo = new Prestamo();
        nuevoPrestamo.setUsuario(prestamo.getUsuario());
        nuevoPrestamo.setAdministrador(prestamo.getAdministrador());
        nuevoPrestamo.setFechaPrestamo(prestamo.getFechaPrestamo());
        nuevoPrestamo.setHoraPrestamo(prestamo.getHoraPrestamo());
        nuevoPrestamo.setEstado(prestamo.getEstado() != null ? prestamo.getEstado() : "pendiente");
        nuevoPrestamo.setFechaDevolucionEstimada(prestamo.getFechaDevolucionEstimada());

        Prestamo prestamoGuardado = prestamoRepository.save(nuevoPrestamo);

        List<DetallePrestamo> detallesParaGuardar = new ArrayList<>();

        if (prestamo.getDetallesPrestamo() != null && !prestamo.getDetallesPrestamo().isEmpty()) {
            for (DetallePrestamo detalleRequest : prestamo.getDetallesPrestamo()) {
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

                equipo.setCantidad(equipo.getCantidad() - cantidadSolicitada);
                equipoRepository.save(equipo);

                DetallePrestamo nuevoDetalle = new DetallePrestamo();
                nuevoDetalle.setPrestamo(prestamoGuardado);
                nuevoDetalle.setEquipo(equipo);
                nuevoDetalle.setCantidad(cantidadSolicitada);

                detallesParaGuardar.add(nuevoDetalle);
            }

            detallePrestamoRepository.saveAll(detallesParaGuardar);
            prestamoGuardado.setDetallesPrestamo(detallesParaGuardar);

        } else {
            prestamoGuardado.setDetallesPrestamo(new ArrayList<>());
        }

        return new ResponseEntity<>(prestamoGuardado, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @Transactional
    public ResponseEntity<Prestamo> actualizarPrestamo(@PathVariable int id, @RequestBody Prestamo prestamo) {
        Optional<Prestamo> prestamoExistenteOptional = prestamoRepository.findById(id);
        if (!prestamoExistenteOptional.isPresent()) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }

        Prestamo prestamoActualizado = prestamoExistenteOptional.get();

        List<DetallePrestamo> detallesAntiguosCopia = new ArrayList<>(prestamoActualizado.getDetallesPrestamo());

        if (detallesAntiguosCopia != null && !detallesAntiguosCopia.isEmpty()) {
            for (DetallePrestamo detalleAntiguo : detallesAntiguosCopia) {
                Optional<Equipo> equipoOptional = equipoRepository.findById(detalleAntiguo.getEquipo().getIdEquipo());
                if (equipoOptional.isPresent()) {
                    Equipo equipo = equipoOptional.get();
                    equipo.setCantidad(equipo.getCantidad() + detalleAntiguo.getCantidad());
                    equipoRepository.save(equipo);
                } else {
                    System.err.println("ADVERTENCIA: Equipo con ID: " + detalleAntiguo.getEquipo().getIdEquipo() + " no encontrado al intentar recuperar stock antiguo para el préstamo " + id + ". Detalle ID: " + detalleAntiguo.getIdDetalle());
                }
            }
        }

        prestamoActualizado.getDetallesPrestamo().clear();

        List<DetallePrestamo> nuevosDetallesRecibidos = prestamo.getDetallesPrestamo();
        if (nuevosDetallesRecibidos != null && !nuevosDetallesRecibidos.isEmpty()) {
            for (DetallePrestamo detalleRequest : nuevosDetallesRecibidos) {
                if (detalleRequest.getEquipo() == null || detalleRequest.getEquipo().getIdEquipo() == 0 || detalleRequest.getCantidad() <= 0) {
                    throw new RuntimeException("Detalle de préstamo inválido: equipo o cantidad no especificados en la actualización.");
                }

                Optional<Equipo> equipoOptional = equipoRepository.findById(detalleRequest.getEquipo().getIdEquipo());

                if (!equipoOptional.isPresent()) {
                    throw new RuntimeException("Equipo no encontrado con ID: " + detalleRequest.getEquipo().getIdEquipo() + " al procesar nuevos detalles para el préstamo " + id);
                }

                Equipo equipo = equipoOptional.get();
                int cantidadSolicitada = detalleRequest.getCantidad();

                if (equipo.getCantidad() < cantidadSolicitada) {
                    throw new RuntimeException("Stock insuficiente (" + equipo.getCantidad() + ") para el equipo con ID: " + equipo.getIdEquipo() + " al actualizar préstamo " + id + ". Cantidad solicitada: " + cantidadSolicitada);
                }

                equipo.setCantidad(equipo.getCantidad() - cantidadSolicitada);
                equipoRepository.save(equipo);

                DetallePrestamo nuevoDetalle = new DetallePrestamo();
                nuevoDetalle.setPrestamo(prestamoActualizado);
                nuevoDetalle.setEquipo(equipo);
                nuevoDetalle.setCantidad(cantidadSolicitada);

                prestamoActualizado.getDetallesPrestamo().add(nuevoDetalle);
            }
        } else {
            prestamoActualizado.setDetallesPrestamo(new ArrayList<>());
        }

        prestamoActualizado.setUsuario(prestamo.getUsuario());
        prestamoActualizado.setAdministrador(prestamo.getAdministrador());
        if (prestamo.getEstado() != null) {
            prestamoActualizado.setEstado(prestamo.getEstado());
        }
        prestamoActualizado.setFechaDevolucionEstimada(prestamo.getFechaDevolucionEstimada());

        if (prestamo.getFechaPrestamo() != null) {
            try {
                Instant instant = prestamo.getFechaPrestamo().toInstant();
                LocalDateTime localDateTime = instant.atZone(ZoneId.systemDefault()).toLocalDateTime();
                prestamoActualizado.setFechaPrestamo(java.util.Date.from(localDateTime.atZone(ZoneId.systemDefault()).toInstant()));
                prestamoActualizado.setHoraPrestamo(localDateTime.toLocalTime());
            } catch (Exception e) {
                System.err.println("Error al parsear fecha/hora de la solicitud de actualización para préstamo " + id + ": " + e.getMessage());
                throw new RuntimeException("Formato de fecha u hora inválido.");
            }
        } else {
            System.err.println("FechaPrestamo es null en la solicitud de actualización para préstamo " + id);
            throw new RuntimeException("Fecha de préstamo es requerida.");
        }

        Prestamo prestamoGuardado = prestamoRepository.save(prestamoActualizado);
        return new ResponseEntity<>(prestamoGuardado, HttpStatus.OK);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Prestamo> obtenerPrestamoPorId(@PathVariable int id) {
        Optional<Prestamo> prestamo = prestamoRepository.findById(id);
        return prestamo.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/devolucion/cancelar/{id}")
    @Transactional
    public ResponseEntity<?> cancelarDevolucion(@PathVariable int id) {
        Optional<Prestamo> prestamoOptional = prestamoRepository.findById(id);
        if (!prestamoOptional.isPresent()) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
        Prestamo prestamo = prestamoOptional.get();
        if (!prestamo.getEstado().equals("devuelto")) {
            return new ResponseEntity<>("El préstamo no está en estado 'devuelto', no se puede cancelar la devolución.", HttpStatus.BAD_REQUEST);
        }
        prestamo.setEstado("pendiente");
        // **>>> Revertir el aumento de stock realizado al devolver <<<**
        List<DetallePrestamo> detallesPrestamo = detallePrestamoRepository.findByPrestamo(prestamo);
        if (detallesPrestamo != null && !detallesPrestamo.isEmpty()) {
            for (DetallePrestamo detalle : detallesPrestamo) {
                Optional<Equipo> equipoOptional = equipoRepository.findById(detalle.getEquipo().getIdEquipo());
                if (equipoOptional.isPresent()) {
                    Equipo equipo = equipoOptional.get();
                    // Restar la cantidad devuelta del stock (revertiendo la adición)
                    equipo.setCantidad(equipo.getCantidad() - detalle.getCantidad());
                    equipoRepository.save(equipo);
                } else {
                    System.err.println("ADVERTENCIA: Equipo con ID: " + detalle.getEquipo().getIdEquipo() + " no encontrado al cancelar la devolución del préstamo " + id);
                }
            }
        }

        // Opcionalmente, eliminar el registro de Devolucion
        Devolucion devolucion = devolucionRepository.findByPrestamo_IdPrestamo(id);
        if (devolucion != null) {
            devolucionRepository.delete(devolucion);
        }
        prestamoRepository.save(prestamo);
        return new ResponseEntity<>(HttpStatus.OK);
    }

    // ... (Tu código existente para eliminar préstamo si lo tienes) ...
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