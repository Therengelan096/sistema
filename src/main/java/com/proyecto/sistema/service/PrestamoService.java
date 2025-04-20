package com.proyecto.sistema.service;

// PrestamoService.java
import com.proyecto.sistema.model.Prestamo;
import com.proyecto.sistema.repository.PrestamoRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.util.List;

@Service
public class PrestamoService {
    private final PrestamoRepository prestamoRepository;
    public PrestamoService(PrestamoRepository prestamoRepository) {
        this.prestamoRepository = prestamoRepository;
    }
    @Transactional
    @Scheduled(cron = "0 0 * * * *") // Se ejecuta al inicio de cada hora (ejemplo)
    public void actualizarEstadosDePrestamosRetrasados() {
        LocalDate hoy = LocalDate.now();
        List<Prestamo> prestamosPendientes = prestamoRepository.findByEstado("pendiente");

        for (Prestamo prestamo : prestamosPendientes) {
            if (prestamo.getFechaDevolucionEstimada() != null &&
                    prestamo.getFechaDevolucionEstimada().toInstant().atZone(java.time.ZoneId.systemDefault()).toLocalDate().isBefore(hoy)) {
                prestamo.setEstado("retrasado");
                prestamoRepository.save(prestamo);
            }
        }
    }
}