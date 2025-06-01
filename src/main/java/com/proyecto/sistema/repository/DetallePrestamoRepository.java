package com.proyecto.sistema.repository;

import com.proyecto.sistema.model.DetallePrestamo;
import com.proyecto.sistema.model.Prestamo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Map;

public interface DetallePrestamoRepository extends JpaRepository<DetallePrestamo, Integer> {
    // Puedes añadir métodos de consulta personalizados si es necesario
    List<DetallePrestamo> findByPrestamo(Prestamo prestamo);
    @Query(value = "SELECT e.nombre, COUNT(dp.id_detalle) as cantidad " +
            "FROM equipos e " +
            "JOIN Detalle_Prestamo dp ON e.id_equipo = dp.id_equipo " +
            "GROUP BY e.id_equipo, e.nombre " +
            "ORDER BY cantidad DESC " +
            "LIMIT 10", nativeQuery = true)
    List<Object[]> findEquiposMasSolicitados();



}