package com.proyecto.sistema.repository;

import com.proyecto.sistema.model.Sancion;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SancionRepository extends JpaRepository<Sancion, Integer> {
}