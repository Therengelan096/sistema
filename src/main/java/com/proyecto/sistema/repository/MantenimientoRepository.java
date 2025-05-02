package com.proyecto.sistema.repository;

import com.proyecto.sistema.model.Mantenimiento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Date;
import java.util.List;

public interface MantenimientoRepository extends JpaRepository<Mantenimiento, Integer> {
    List<Mantenimiento> findByFechaMantenimientoBetween(Date fechaInicio, Date fechaFin);
    List<Mantenimiento> findByFechaMantenimientoGreaterThanEqual(Date fechaInicio);
    List<Mantenimiento> findByFechaMantenimientoLessThanEqual(Date fechaFin);
    @Query("SELECT m FROM Mantenimiento m JOIN m.equipo e JOIN e.laboratorio l JOIN e.categoria c " + // Asumiendo que Mantenimiento tiene 'equipo', Equipo tiene 'laboratorio' y 'categoria'
            "WHERE (:fechaInicio IS NULL OR m.fechaMantenimiento >= :fechaInicio) " + // Filtro por Fecha Inicio
            "AND (:fechaFin IS NULL OR m.fechaMantenimiento <= :fechaFin) " +       // Filtro por Fecha Fin
            "AND (:laboratorioId IS NULL OR l.idLaboratorio = :laboratorioId) " + // Filtro por ID de Laboratorio del Equipo
            "AND (:categoriaId IS NULL OR c.idCategoria = :categoriaId)")       // Filtro por ID de Categoría del Equipo
    List<Mantenimiento> findFiltered(
            @Param("fechaInicio") Date fechaInicio, // Asegúrate que el tipo Date coincida con tu entidad
            @Param("fechaFin") Date fechaFin,       // Asegúrate que el tipo Date coincida con tu entidad
            @Param("laboratorioId") Integer laboratorioId,
            @Param("categoriaId") Integer categoriaId
    );
}