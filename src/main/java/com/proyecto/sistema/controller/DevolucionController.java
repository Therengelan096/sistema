package com.proyecto.sistema.controller;

import com.proyecto.sistema.model.DetallePrestamo; // Necesitas importar DetallePrestamo
import com.proyecto.sistema.model.Devolucion;
import com.proyecto.sistema.model.Equipo; // Necesitas importar Equipo
import com.proyecto.sistema.model.Prestamo;
import com.proyecto.sistema.repository.DetallePrestamoRepository; // Necesitas importar este repositorio
import com.proyecto.sistema.repository.DevolucionRepository;
import com.proyecto.sistema.repository.EquipoRepository; // Necesitas importar este repositorio
import com.proyecto.sistema.repository.PrestamoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional; // Importar Transactional
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Date;
import java.time.LocalTime;
import java.util.Optional;

@RestController
@RequestMapping("/devolucion")
public class DevolucionController {

    @Autowired
    private DevolucionRepository devolucionRepository;

    @Autowired
    private PrestamoRepository prestamoRepository;

    @Autowired
    private DetallePrestamoRepository detallePrestamoRepository; // Inyectar DetallePrestamoRepository

    @Autowired
    private EquipoRepository equipoRepository; // Inyectar EquipoRepository

    @GetMapping
    public List<Devolucion> obtenerDevoluciones() {
        return devolucionRepository.findAll();
    }

    @PostMapping("/registrar")
    @Transactional // Asegura que toda la operación sea atómica
    public ResponseEntity<?> registrarDevolucion(@RequestBody Devolucion devolucionRequest) {
        try {
            if (devolucionRequest.getPrestamo() == null || devolucionRequest.getPrestamo().getIdPrestamo() == 0) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("ID de Préstamo no especificado en la solicitud de devolución.");
            }
            int idPrestamo = devolucionRequest.getPrestamo().getIdPrestamo();

            Prestamo prestamo = prestamoRepository.findById(idPrestamo)
                    .orElseThrow(() -> new RuntimeException("Préstamo no encontrado con ID: " + idPrestamo + " para registrar devolución."));

            if ("devuelto".equals(prestamo.getEstado())) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body("Este préstamo (ID: " + idPrestamo + ") ya ha sido marcado como devuelto anteriormente.");
            }

            Devolucion nuevaDevolucion = new Devolucion();
            nuevaDevolucion.setPrestamo(prestamo);

            // Validar y asignar fecha y hora de devolución
            if (devolucionRequest.getFechaDevolucion() == null || devolucionRequest.getHoraDevolucion() == null) {
                throw new RuntimeException("Fecha y hora de devolución son requeridas.");
            }
            nuevaDevolucion.setFechaDevolucion(devolucionRequest.getFechaDevolucion());
            nuevaDevolucion.setHoraDevolucion(devolucionRequest.getHoraDevolucion());


            // >>> Lógica de mapeo de estado (mantengo la que pusimos como ejemplo robusto) <<<
            // Asegúrate de que los valores 'bueno' / 'dañado' / 'malo' coincidan con tu ENUM en BD
            String estadoRecibido = devolucionRequest.getEstadoEquipoAlDevolver();
            if (estadoRecibido != null) {
                String estadoNormalizado = estadoRecibido.trim().toLowerCase();
                // Ajusta aquí si tu ENUM es solo 'bueno' y 'malo', o si usas un enum Java
                if ("malo".equals(estadoNormalizado)) {
                    nuevaDevolucion.setEstadoEquipoAlDevolver("dañado"); // O "malo" si cambiaste el ENUM en BD
                } else if ("bueno".equals(estadoNormalizado)) {
                    nuevaDevolucion.setEstadoEquipoAlDevolver("bueno");
                } else {
                    // Rechazar otros valores no esperados
                    throw new RuntimeException("Estado de equipo al devolver inválido: '" + estadoRecibido + "'. Solo se permiten 'bueno' o 'malo'.");
                }
            } else {
                throw new RuntimeException("Estado del equipo al devolver no especificado.");
            }
            // >>> Fin Lógica de mapeo de estado <<<


            nuevaDevolucion.setObservaciones(devolucionRequest.getObservaciones());

            // Guardar la nueva devolución
            Devolucion devolucionGuardada = devolucionRepository.save(nuevaDevolucion);

            // Actualizar el estado del Prestamo asociado
            prestamo.setEstado("devuelto");
            prestamoRepository.save(prestamo);

            // **>>> INICIO DEL CAMBIO: Recuperar stock de equipos al devolver <<<**

            // Obtener los detalles del préstamo para saber qué equipos y cuántos se devolvieron
            // findByPrestamo asegura que cargamos los detalles asociados a este préstamo gestionado
            List<DetallePrestamo> detallesPrestamo = detallePrestamoRepository.findByPrestamo(prestamo);

            if (detallesPrestamo != null && !detallesPrestamo.isEmpty()) {
                for (DetallePrestamo detalle : detallesPrestamo) {
                    Optional<Equipo> equipoOptional = equipoRepository.findById(detalle.getEquipo().getIdEquipo());
                    if (equipoOptional.isPresent()) {
                        Equipo equipo = equipoOptional.get();
                        // Sumar la cantidad devuelta al stock del equipo
                        equipo.setCantidad(equipo.getCantidad() + detalle.getCantidad());
                        equipoRepository.save(equipo); // Guarda el stock actualizado
                    } else {
                        // Esto no debería pasar si los datos están bien. Indica una inconsistencia.
                        System.err.println("ADVERTENCIA: Equipo con ID: " + detalle.getEquipo().getIdEquipo() + " no encontrado al intentar recuperar stock para el préstamo " + idPrestamo + ". Detalle ID: " + detalle.getIdDetalle());
                        // Dependiendo de la política, podrías lanzar una excepción aquí si esto es crítico
                        // throw new RuntimeException("Error de datos: Equipo no encontrado para el detalle de préstamo " + detalle.getIdDetalle());
                    }
                }
            } else {
                System.err.println("INFO: No se encontraron detalles de equipos para el préstamo " + idPrestamo + " al registrar la devolución. No se recuperó stock.");
            }
            // **>>> FIN DEL CAMBIO: Recuperar stock de equipos <<<**


            return ResponseEntity.status(HttpStatus.CREATED).body(devolucionGuardada);

        } catch (RuntimeException e) {
            // Captura excepciones lanzadas por nosotros o Spring/Hibernate y activa el rollback por @Transactional
            e.printStackTrace(); // Imprime la traza completa en el log del servidor
            String errorMessage = "Error en el servidor al registrar la devolución: " + e.getMessage();
            HttpStatus status = HttpStatus.INTERNAL_SERVER_ERROR; // Por defecto, error interno (500)

            // Puedes mapear ciertas RuntimeExceptions a otros códigos de estado si quieres dar más detalle al cliente
            if (e.getMessage() != null) {
                if (e.getMessage().contains("Préstamo no encontrado")) {
                    status = HttpStatus.NOT_FOUND; // 404
                } else if (e.getMessage().contains("ya ha sido marcado como devuelto")) {
                    status = HttpStatus.CONFLICT; // 409
                } else if (e.getMessage().contains("requerid") || e.getMessage().contains("inválido")) {
                    status = HttpStatus.BAD_REQUEST; // 400
                } else if (e.getMessage().contains("Stock insuficiente")) {
                    status = HttpStatus.BAD_REQUEST; // 400
                }
            }
            return ResponseEntity.status(status).body(errorMessage);

        }
        catch (Exception e) {
            // Captura cualquier otra excepción inesperada que no sea RuntimeException
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error interno inesperado al registrar la devolución: " + e.getMessage());
        }
    }
}