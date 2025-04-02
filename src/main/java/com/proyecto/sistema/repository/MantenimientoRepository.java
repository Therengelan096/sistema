package com.proyecto.sistema.repository;

import com.proyecto.sistema.model.Mantenimiento;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MantenimientoRepository extends JpaRepository<Mantenimiento, Integer> {
}