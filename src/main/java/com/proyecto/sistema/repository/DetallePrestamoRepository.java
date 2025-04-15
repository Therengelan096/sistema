package com.proyecto.sistema.repository;

import com.proyecto.sistema.model.DetallePrestamo;
import com.proyecto.sistema.model.Prestamo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DetallePrestamoRepository extends JpaRepository<DetallePrestamo, Integer> {
    // Puedes añadir métodos de consulta personalizados si es necesario
    List<DetallePrestamo> findByPrestamo(Prestamo prestamo);
}