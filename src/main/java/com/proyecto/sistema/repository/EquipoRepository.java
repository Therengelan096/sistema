package com.proyecto.sistema.repository;

import com.proyecto.sistema.model.CategoriaEquipo;
import com.proyecto.sistema.model.Equipo;
import com.proyecto.sistema.model.Laboratorio;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EquipoRepository extends JpaRepository<Equipo, Integer> {
    List<Equipo> findByLaboratorio(Laboratorio laboratorio);
    List<Equipo> findByLaboratorioAndCategoria(Laboratorio laboratorio, CategoriaEquipo categoria);
}