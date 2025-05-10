package com.proyecto.sistema.service;

import com.proyecto.sistema.model.Prestamo;
import com.proyecto.sistema.model.Usuario;
import com.proyecto.sistema.repository.PrestamoRepository;
import com.proyecto.sistema.repository.UsuarioRepository; // Necesario para obtener el objeto Usuario
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

@Service
public class PrestamoService {
    private final PrestamoRepository prestamoRepository;
    private final UsuarioRepository usuarioRepository; // Para obtener el objeto Usuario completo

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
    public void actualizarEstadosDePrestamosRetrasados() {
        LocalDate hoy = LocalDate.now();
        // Asumiendo que el estado "pendiente" está en tu enum/string de estados
        List<Prestamo> prestamosPendientes = prestamoRepository.findByEstado("pendiente");

        for (Prestamo prestamo : prestamosPendientes) {
            if (prestamo.getFechaDevolucionEstimada() != null) {
                // Convertir java.util.Date a LocalDate para comparar de forma segura
                LocalDate fechaDevEstimada = prestamo.getFechaDevolucionEstimada()
                        .toInstant()
                        .atZone(java.time.ZoneId.systemDefault())
                        .toLocalDate();
                if (fechaDevEstimada.isBefore(hoy)) {
                    prestamo.setEstado("retrasado"); // Asumiendo estado "retrasado"
                    prestamoRepository.save(prestamo);
                }
            }
        }
    }
}
