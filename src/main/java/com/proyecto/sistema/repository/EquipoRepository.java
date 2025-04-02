package com.proyecto.sistema.repository;

import com.proyecto.sistema.model.Equipo;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EquipoRepository extends JpaRepository<Equipo, Integer> {
}