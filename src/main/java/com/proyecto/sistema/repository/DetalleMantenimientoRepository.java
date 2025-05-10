package com.proyecto.sistema.repository;

import com.proyecto.sistema.model.DetalleMantenimiento;
import com.proyecto.sistema.model.Mantenimiento;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DetalleMantenimientoRepository extends JpaRepository<DetalleMantenimiento, Integer> {
    List<DetalleMantenimiento> findByMantenimiento(Mantenimiento mantenimiento);
}
