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
            "JOIN Equipos e ON dp.id_equipo = e.id_equipo " + // Nombre de la tabla Equipos (con S al final)
            "JOIN LaboratoriosE l ON e.id_laboratorio = l.id_laboratorio " + // Nombre de la tabla LaboratoriosE
            "JOIN Categorias_Equipos c ON e.id_categoria = c.id_categoria " + // Nombre de la tabla Categorias_Equipos
            "WHERE (:laboratorioId IS NULL OR l.id_laboratorio = :laboratorioId) " + // Filtro opcional por Laboratorio
            "AND (:categoriaId IS NULL OR c.id_categoria = :categoriaId) " +     // Filtro opcional por Categoría
            // Opcional: Si quieres filtrar por fecha de PRÉSTAMO, necesitarías JOIN a la tabla Prestamos y añadir filtro de fecha
            "JOIN Prestamos p ON dp.id_prestamo = p.id_prestamo " +
            "AND (:fechaInicio IS NULL OR p.fecha_prestamo >= :fechaInicio) " +
            "AND (:fechaFin IS NULL OR p.fecha_prestamo <= :fechaFin) " +
            "GROUP BY e.id_equipo, e.nombre " + // Agrupar también por nombre del equipo
            "ORDER BY cantidad_prestada DESC",
            nativeQuery = true)
    List<Object[]> obtenerEquiposMasPrestados(
            @Param("laboratorioId") Integer laboratorioId,
            @Param("categoriaId") Integer categoriaId,
            // Si añadiste filtros de fecha en la consulta, añádelos aquí
            @Param("fechaInicio") Date fechaInicio,
            @Param("fechaFin") Date fechaFin
    );
    // --- Modificar consulta nativa para "Usuarios que más prestaron" con filtros de Laboratorio y Categoría ---
    // El método probablemente se llama algo como obtenerUsuariosMasPrestaron
    // Asegúrate que este sea el nombre exacto de tu método
    @Query(value = "SELECT u.nombre, u.apellido, COUNT(dp.id_detalle) AS cantidad_prestamos " + // *** CAMBIADO id_detalle_prestamo a id_detalle ***
            "FROM Detalle_Prestamo dp " + // Usar el nombre de tabla correcto si es sensible a mayúsculas/minúsculas
            "JOIN Prestamos p ON dp.id_prestamo = p.id_prestamo " +
            "JOIN Usuarios u ON p.id_usuario = u.id_usuario " +
            "JOIN Equipos e ON dp.id_equipo = e.id_equipo " + // Nombre de la tabla Equipos (con S al final)
            "JOIN LaboratoriosE l ON e.id_laboratorio = l.id_laboratorio " + // Nombre de la tabla LaboratoriosE
            "JOIN Categorias_Equipos c ON e.id_categoria = c.id_categoria " + // Nombre de la tabla Categorias_Equipos
            "WHERE (:laboratorioId IS NULL OR l.id_laboratorio = :laboratorioId) " + // Filtro opcional por Laboratorio
            "AND (:categoriaId IS NULL OR c.id_categoria = :categoriaId) " +     // Filtro opcional por Categoría
            // Si añadiste filtros de fecha en la consulta, asegúrate de que estén aquí
            "JOIN Prestamos p ON dp.id_prestamo = p.id_prestamo " +
            "AND (:fechaInicio IS NULL OR p.fecha_prestamo >= :fechaInicio) " +
            "AND (:fechaFin IS NULL OR p.fecha_prestamo <= :fechaFin) " +
            "GROUP BY u.id_usuario, u.nombre, u.apellido " +
            "ORDER BY cantidad_prestamos DESC",
            nativeQuery = true)
    List<Object[]> obtenerUsuariosMasPrestaron(
            @Param("laboratorioId") Integer laboratorioId,
            @Param("categoriaId") Integer categoriaId
            // Si añadiste filtros de fecha, ponlos aquí
            , @Param("fechaInicio") Date fechaInicio
            , @Param("fechaFin") Date fechaFin
    );
}