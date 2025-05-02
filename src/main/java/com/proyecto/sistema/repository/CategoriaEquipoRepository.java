package com.proyecto.sistema.repository;

import com.proyecto.sistema.model.CategoriaEquipo;
import com.proyecto.sistema.model.Laboratorio;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CategoriaEquipoRepository extends JpaRepository<CategoriaEquipo, Integer> {
    List<CategoriaEquipo> findByLaboratorios(Laboratorio laboratorio);
    @Query("SELECT ce FROM CategoriaEquipo ce JOIN ce.laboratorios lab WHERE lab.idLaboratorio = :laboratorioId")
    List<CategoriaEquipo> findByLaboratorioId(@Param("laboratorioId") Integer laboratorioId);

}