package com.proyecto.sistema.service;

import com.proyecto.sistema.model.Prestamo;
import com.proyecto.sistema.model.Usuario;
import com.proyecto.sistema.repository.PrestamoRepository;
import com.proyecto.sistema.repository.UsuarioRepository; // Necesario para obtener el objeto Usuario
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate; // Importa LocalDate
// import java.time.Instant; // <-- Ya no es necesaria
// import java.time.ZoneId; // <-- Ya no es necesaria

import java.util.Collections;
import java.util.List;
import java.util.Optional;

@Service
public class PrestamoService {
    private final PrestamoRepository prestamoRepository;
    private final UsuarioRepository usuarioRepository;

    @Autowired
    public PrestamoService(PrestamoRepository prestamoRepository, UsuarioRepository usuarioRepository) {
        this.prestamoRepository = prestamoRepository;
        this.usuarioRepository = usuarioRepository;
    }

    @Transactional(readOnly = true)
    public List<Prestamo> obtenerPrestamosPorIdUsuario(Integer idUsuario) {
        if (idUsuario == null) {
            return Collections.emptyList();
        }
        Optional<Usuario> usuarioOpt = usuarioRepository.findById(idUsuario);
        if (usuarioOpt.isPresent()) {
            // Asumiendo que PrestamoRepository tiene: List<Prestamo> findByUsuario(Usuario usuario);
            return prestamoRepository.findByUsuario(usuarioOpt.get());
        }
        return Collections.emptyList();
    }

    @Transactional
    @Scheduled(cron = "0 0 * * * *") // Se ejecuta al inicio de cada hora (ejemplo)
    // Este scheduler actualiza estados a "retrasado", NO envia correos de recordatorio
    public void actualizarEstadosDePrestamosRetrasados() {
        LocalDate hoy = LocalDate.now();
        // Asumiendo que el estado "pendiente" está en tu enum/string de estados
        List<Prestamo> prestamosPendientes = prestamoRepository.findByEstado("pendiente");

        for (Prestamo prestamo : prestamosPendientes) {
            // --- ¡Línea 52 corregida! ---
            // Obtiene la parte de la fecha (LocalDate) directamente de LocalDateTime
            if (prestamo.getFechaDevolucionEstimada() != null) {
                LocalDate fechaDevEstimada = prestamo.getFechaDevolucionEstimada().toLocalDate(); // <-- Corrección aquí

                if (fechaDevEstimada.isBefore(hoy)) {
                    prestamo.setEstado("retrasado"); // Asumiendo estado "retrasado"
                    prestamoRepository.save(prestamo);
                }
            }
        }
    }

    // --- NOTA IMPORTANTE ---
    // Este PrestamoService contiene una tarea programada (@Scheduled) para actualizar estados a "retrasado".
    // La logica para ENVIAR los correos de recordatorio la implementamos en un servicio SEPARADO
    // llamado ReminderService, que tendra SU PROPIO metodo @Scheduled y SU PROPIA logica
    // para buscar prestamos proximos a vencer y enviar emails usando EmailService.
    // No debes mezclar ambas logicas en el mismo metodo @Scheduled a menos que quieras que ocurran al mismo tiempo.

}