package com.proyecto.sistema.repository;

import com.proyecto.sistema.model.CategoriaEquipo;
import com.proyecto.sistema.model.Laboratorio;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CategoriaEquipoRepository extends JpaRepository<CategoriaEquipo, Integer> {
    List<CategoriaEquipo> findByLaboratorios(Laboratorio laboratorio);
}