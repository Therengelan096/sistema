package com.proyecto.sistema.repository;

import com.proyecto.sistema.model.Prestamo;
import com.proyecto.sistema.model.Usuario;
import com.proyecto.sistema.model.Equipo;
import com.proyecto.sistema.model.Laboratorio;
import com.proyecto.sistema.model.CategoriaEquipo;
import com.proyecto.sistema.model.DetallePrestamo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Date;
import java.util.List;

public interface PrestamoRepository extends JpaRepository<Prestamo, Integer> {
    List<Prestamo> findByEstado(String estado);
    // Métodos adicionales para los reportes (los agregamos aquí)
    @Query(value = "SELECT e.nombre, COUNT(dp.id_equipo) AS cantidad_prestada FROM detalle_prestamo dp JOIN equipos e ON dp.id_equipo = e.id_equipo GROUP BY e.id_equipo ORDER BY cantidad_prestada DESC", nativeQuery = true)
    List<Object[]> obtenerEquiposMasPrestados();

    @Query(value = "SELECT u.nombre, u.apellido, COUNT(p.id_prestamo) AS cantidad_prestamos FROM prestamos p JOIN usuarios u ON p.id_usuario = u.id_usuario GROUP BY u.id_usuario ORDER BY cantidad_prestamos DESC", nativeQuery = true)
    List<Object[]> obtenerUsuariosMasPrestaron();

    List<Prestamo> findByFechaPrestamoBetween(Date fechaInicio, Date fechaFin);
    List<Prestamo> findByFechaPrestamoGreaterThanEqual(Date fechaInicio);
    List<Prestamo> findByFechaPrestamoLessThanEqual(Date fechaFin);

    List<Prestamo> findByUsuarioAndFechaPrestamoBetween(Usuario usuario, Date fechaInicio, Date fechaFin);
    List<Prestamo> findByUsuarioAndFechaPrestamoGreaterThanEqual(Usuario usuario, Date fechaInicio);
    List<Prestamo> findByUsuarioAndFechaPrestamoLessThanEqual(Usuario usuario, Date fechaFin);
    List<Prestamo> findByUsuarioAndEstado(Usuario usuario, String estado);

    List<Prestamo> findByUsuarioAndFechaPrestamoBetweenAndEstado(Usuario usuario, Date fechaInicio, Date fechaFin, String estado);
    List<Prestamo> findByUsuarioAndFechaPrestamoGreaterThanEqualAndEstado(Usuario usuario, Date fechaInicio, String estado);
    List<Prestamo> findByUsuarioAndFechaPrestamoLessThanEqualAndEstado(Usuario usuario, Date fechaFin, String estado);

    @Query("SELECT p FROM Prestamo p WHERE p.usuario = :usuario") // Consulta JPQL
    List<Prestamo> findByUsuario(@Param("usuario") Usuario usuario);
    //aca
    // Asegúrate que este sea el nombre exacto de tu método
    @Query(value = "SELECT e.nombre, COUNT(dp.id_equipo) AS cantidad_prestada " +
            "FROM detalle_prestamo dp " +
            "JOIN Equipos e ON dp.id_equipo = e.id_equipo " +
            "JOIN LaboratoriosE l ON e.id_laboratorio = l.id_laboratorio " +
            "JOIN Categorias_Equipos c ON e.id_categoria = c.id_categoria " +
            "JOIN Prestamos p ON dp.id_prestamo = p.id_prestamo " + // *** MOVIDO AQUÍ: Antes del WHERE ***
            "WHERE (:laboratorioId IS NULL OR l.id_laboratorio = :laboratorioId) " +
            "AND (:categoriaId IS NULL OR c.id_categoria = :categoriaId) " +
            // Las condiciones de fecha ahora están en el WHERE, ¡después de todos los JOIN!
            "AND (:fechaInicio IS NULL OR p.fecha_prestamo >= :fechaInicio) " +
            "AND (:fechaFin IS NULL OR p.fecha_prestamo <= :fechaFin) " +
            "GROUP BY e.id_equipo, e.nombre " +
            "ORDER BY cantidad_prestada DESC",
            nativeQuery = true)
    List<Object[]> obtenerEquiposMasPrestados(
            @Param("laboratorioId") Integer laboratorioId,
            @Param("categoriaId") Integer categoriaId,
            @Param("fechaInicio") Date fechaInicio,
            @Param("fechaFin") Date fechaFin
    );

    // --- Consulta nativa para "Usuarios que más prestaron" CORREGIDA ---
    @Query(value = "SELECT u.nombre, u.apellido, COUNT(dp.id_detalle) AS cantidad_prestamos " +
            "FROM Detalle_Prestamo dp " +
            "JOIN Prestamos p ON dp.id_prestamo = p.id_prestamo " + // *** MOVIDO AQUÍ: Antes del WHERE ***
            "JOIN Usuarios u ON p.id_usuario = u.id_usuario " +
            "JOIN Equipos e ON dp.id_equipo = e.id_equipo " +
            "JOIN LaboratoriosE l ON e.id_laboratorio = l.id_laboratorio " +
            "JOIN Categorias_Equipos c ON e.id_categoria = c.id_categoria " +
            "WHERE (:laboratorioId IS NULL OR l.id_laboratorio = :laboratorioId) " +
            "AND (:categoriaId IS NULL OR c.id_categoria = :categoriaId) " +
            // Las condiciones de fecha ahora están en el WHERE, ¡después de todos los JOIN!
            "AND (:fechaInicio IS NULL OR p.fecha_prestamo >= :fechaInicio) " +
            "AND (:fechaFin IS NULL OR p.fecha_prestamo <= :fechaFin) " +
            "GROUP BY u.id_usuario, u.nombre, u.apellido " +
            "ORDER BY cantidad_prestamos DESC",
            nativeQuery = true)
    List<Object[]> obtenerUsuariosMasPrestaron(
            @Param("laboratorioId") Integer laboratorioId,
            @Param("categoriaId") Integer categoriaId,
            @Param("fechaInicio") Date fechaInicio,
            @Param("fechaFin") Date fechaFin
    );
}