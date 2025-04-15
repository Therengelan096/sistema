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
import org.springframework.web.bind.annotation.*;

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

    @GetMapping
    public List<Prestamo> obtenerPrestamos() {
        return prestamoRepository.findAll();
    }

    @PostMapping
    public ResponseEntity<Prestamo> crearPrestamo(@RequestBody Prestamo prestamo) {
        // Guardar primero el préstamo principal
        Prestamo nuevoPrestamo = prestamoRepository.save(prestamo);

        // Guardar los detalles del préstamo
        if (prestamo.getDetallesPrestamo() != null) {
            for (DetallePrestamo detalle : prestamo.getDetallesPrestamo()) {
                detalle.setPrestamo(nuevoPrestamo); // Asocia el detalle al préstamo guardado
                detallePrestamoRepository.save(detalle);

                // Actualizar la cantidad del equipo (opcional, dependiendo de tu lógica)
                Optional<Equipo> equipoOptional = equipoRepository.findById(detalle.getEquipo().getIdEquipo());
                if (equipoOptional.isPresent()) {
                    Equipo equipo = equipoOptional.get();
                    if (equipo.getCantidad() >= detalle.getCantidad()) {
                        equipo.setCantidad(equipo.getCantidad() - detalle.getCantidad());
                        equipoRepository.save(equipo);
                    } else {
                        // Considera lanzar una excepción o manejar el error si no hay suficiente stock
                        System.err.println("No hay suficiente stock para el equipo con ID: " + equipo.getIdEquipo());
                        // Podrías eliminar el préstamo creado si falla algún detalle
                        prestamoRepository.delete(nuevoPrestamo);
                        return new ResponseEntity<>(HttpStatus.BAD_REQUEST); // O un código de error más específico
                    }
                } else {
                    System.err.println("Equipo no encontrado con ID: " + detalle.getEquipo().getIdEquipo());
                    prestamoRepository.delete(nuevoPrestamo);
                    return new ResponseEntity<>(HttpStatus.NOT_FOUND);
                }
            }
        }

        // Recargar el préstamo para incluir los detalles (opcional, depende de cómo quieras la respuesta)
        Optional<Prestamo> prestamoConDetalles = prestamoRepository.findById(nuevoPrestamo.getIdPrestamo());
        return prestamoConDetalles.map(p -> new ResponseEntity<>(p, HttpStatus.CREATED))
                .orElse(new ResponseEntity<>(nuevoPrestamo, HttpStatus.CREATED));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Prestamo> actualizarPrestamo(@PathVariable int id, @RequestBody Prestamo prestamo) {
        Optional<Prestamo> prestamoExistente = prestamoRepository.findById(id);
        if (prestamoExistente.isPresent()) {
            Prestamo prestamoActualizado = prestamoExistente.get();
            prestamoActualizado.setUsuario(prestamo.getUsuario());
            prestamoActualizado.setAdministrador(prestamo.getAdministrador());
            prestamoActualizado.setFechaPrestamo(prestamo.getFechaPrestamo());
            prestamoActualizado.setHoraPrestamo(prestamo.getHoraPrestamo());
            prestamoActualizado.setEstado(prestamo.getEstado());
            prestamoActualizado.setFechaDevolucionEstimada(prestamo.getFechaDevolucionEstimada());


            // Ejemplo simple: Eliminar todos los detalles antiguos y guardar los nuevos
            List<DetallePrestamo> detallesExistentes = detallePrestamoRepository.findByPrestamo(prestamoActualizado);
            detallePrestamoRepository.deleteAll(detallesExistentes);

            if (prestamo.getDetallesPrestamo() != null) {
                for (DetallePrestamo detalle : prestamo.getDetallesPrestamo()) {
                    detalle.setPrestamo(prestamoActualizado);
                    detallePrestamoRepository.save(detalle);

                }
            }

            Prestamo prestamoGuardado = prestamoRepository.save(prestamoActualizado);
            return new ResponseEntity<>(prestamoGuardado, HttpStatus.OK);
        } else {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Prestamo> obtenerPrestamoPorId(@PathVariable int id) {
        Optional<Prestamo> prestamo = prestamoRepository.findById(id);
        return prestamo.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}