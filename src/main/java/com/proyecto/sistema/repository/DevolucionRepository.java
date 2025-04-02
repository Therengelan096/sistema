package com.proyecto.sistema.repository;

import com.proyecto.sistema.model.Devolucion;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DevolucionRepository extends JpaRepository<Devolucion, Integer> {
}