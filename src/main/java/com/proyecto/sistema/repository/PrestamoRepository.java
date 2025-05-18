package com.proyecto.sistema.repository;

import com.proyecto.sistema.model.Prestamo;
import com.proyecto.sistema.model.Usuario;
// import com.proyecto.sistema.model.Equipo;
// import com.proyecto.sistema.model.Laboratorio;
// import com.proyecto.sistema.model.CategoriaEquipo;
// import com.proyecto.sistema.model.DetallePrestamo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

// Usa java.sql.Date para consistencia con el controlador
import java.sql.Date;
import java.util.List;
import java.util.Optional; // Asegúrate de importar Optional si usas findByRu en UsuarioRepository

public interface PrestamoRepository extends JpaRepository<Prestamo, Integer> {

    // Métodos estándar de JpaRepository (dejarlos si los usas en el controlador)
    List<Prestamo> findByEstado(String estado);

    // Métodos derivados de JpaRepository para filtros de fecha (dejarlos si los usas)
    List<Prestamo> findByFechaPrestamoBetween(Date fechaInicio, Date fechaFin);
    List<Prestamo> findByFechaPrestamoGreaterThanEqual(Date fechaInicio);
    List<Prestamo> findByFechaPrestamoLessThanEqual(Date fechaFin);

    // Métodos derivados de JpaRepository para filtros de usuario y fecha/estado (dejarlos si los usas)
    List<Prestamo> findByUsuarioAndFechaPrestamoBetween(Usuario usuario, Date fechaInicio, Date fechaFin);
    List<Prestamo> findByUsuarioAndFechaPrestamoGreaterThanEqual(Usuario usuario, Date fechaInicio);
    List<Prestamo> findByUsuarioAndFechaPrestamoLessThanEqual(Usuario usuario, Date fechaFin);
    List<Prestamo> findByUsuarioAndEstado(Usuario usuario, String estado);
    List<Prestamo> findByUsuarioAndFechaPrestamoBetweenAndEstado(Usuario usuario, Date fechaInicio, Date fechaFin, String estado);
    List<Prestamo> findByUsuarioAndFechaPrestamoGreaterThanEqualAndEstado(Usuario usuario, Date fechaInicio, String estado);
    List<Prestamo> findByUsuarioAndFechaPrestamoLessThanEqualAndEstado(Usuario usuario, Date fechaFin, String estado);


    // Método derivado para buscar préstamos por usuario (dejarlos si los usas)
    @Query("SELECT p FROM Prestamo p WHERE p.usuario = :usuario") // Consulta JPQL
    List<Prestamo> findByUsuario(@Param("usuario") Usuario usuario);

    // --- Métodos para reportes (mantener SOLO las versiones con parámetros de filtro) ---

    // Consulta nativa para "Equipos que más prestaron" (¡Mantener solo esta versión!)
    @Query(value = "SELECT e.nombre, COUNT(dp.id_equipo) AS cantidad_prestada " +
            "FROM detalle_prestamo dp " +
            "JOIN Equipos e ON dp.id_equipo = e.id_equipo " +
            "JOIN LaboratoriosE l ON e.id_laboratorio = l.id_laboratorio " +
            "JOIN Categorias_Equipos c ON e.id_categoria = c.id_categoria " +
            "JOIN Prestamos p ON dp.id_prestamo = p.id_prestamo " + // Asegúrate que la tabla se llame 'Prestamos' y no 'prestamos' en tu BD
            "WHERE (:laboratorioId IS NULL OR l.id_laboratorio = :laboratorioId) " +
            "AND (:categoriaId IS NULL OR c.id_categoria = :categoriaId) " +
            "AND (:fechaInicio IS NULL OR p.fecha_prestamo >= :fechaInicio) " + // Asegúrate que la columna se llame 'fecha_prestamo'
            "AND (:fechaFin IS NULL OR p.fecha_prestamo <= :fechaFin) " +       // Asegúrate que la columna se llame 'fecha_prestamo'
            "GROUP BY e.id_equipo, e.nombre " +
            "ORDER BY cantidad_prestada DESC",
            nativeQuery = true)
    List<Object[]> obtenerEquiposMasPrestados(
            @Param("laboratorioId") Integer laboratorioId,
            @Param("categoriaId") Integer categoriaId,
            @Param("fechaInicio") Date fechaInicio,
            @Param("fechaFin") Date fechaFin
    );

    // Consulta nativa para "Usuarios que más prestaron" (¡Mantener solo esta versión!)
    @Query(value = "SELECT u.nombre, u.apellido, COUNT(dp.id_detalle) AS cantidad_prestamos " + // Asegúrate que la tabla se llame 'Detalle_Prestamo' o 'detalle_prestamo'
            "FROM Detalle_Prestamo dp " +
            "JOIN Prestamos p ON dp.id_prestamo = p.id_prestamo " + // Asegúrate que la tabla se llame 'Prestamos'
            "JOIN Usuarios u ON p.id_usuario = u.id_usuario " +     // Asegúrate que la tabla se llame 'Usuarios'
            "JOIN Equipos e ON dp.id_equipo = e.id_equipo " +        // Asegúrate que la tabla se llame 'Equipos'
            "JOIN LaboratoriosE l ON e.id_laboratorio = l.id_laboratorio " + // Asegúrate que la tabla se llame 'LaboratoriosE'
            "JOIN Categorias_Equipos c ON e.id_categoria = c.id_categoria " + // Asegúrate que la tabla se llame 'Categorias_Equipos'
            "WHERE (:laboratorioId IS NULL OR l.id_laboratorio = :laboratorioId) " +
            "AND (:categoriaId IS NULL OR c.id_categoria = :categoriaId) " +
            "AND (:fechaInicio IS NULL OR p.fecha_prestamo >= :fechaInicio) " + // Asegúrate que la columna se llame 'fecha_prestamo'
            "AND (:fechaFin IS NULL OR p.fecha_prestamo <= :fechaFin) " +       // Asegúrate que la columna se llame 'fecha_prestamo'
            "GROUP BY u.id_usuario, u.nombre, u.apellido " +
            "ORDER BY cantidad_prestamos DESC",
            nativeQuery = true)
    List<Object[]> obtenerUsuariosMasPrestaron(
            @Param("laboratorioId") Integer laboratorioId,
            @Param("categoriaId") Integer categoriaId,
            @Param("fechaInicio") Date fechaInicio,
            @Param("fechaFin") Date fechaFin
    );

    // *** Asegúrate de que otros métodos llamados en el controlador existan aquí ***
    // List<Mantenimiento> findFiltered(Date fechaInicio, Date fechaFin, Integer laboratorioId, Integer categoriaId); // Ejemplo para mantenimientos

    // Métodos para reportes de usuario que usan filtros (Asegúrate que existan y filtren correctamente por Usuario y los parámetros)
    // List<Prestamo> findByUsuarioAndFechaPrestamoBetweenAndEstado(Usuario usuario, Date fechaInicio, Date fechaFin, String estado); // Ya definido arriba
    // List<Prestamo> findByUsuarioAndFechaPrestamoGreaterThanEqualAndEstado(Usuario usuario, Date fechaInicio, String estado); // Ya definido arriba
    // List<Prestamo> findByUsuarioAndFechaPrestamoLessThanEqualAndEstado(Usuario usuario, Date fechaFin, String estado); // Ya definido arriba
    // List<Sancion> findByUsuarioAndFechaSancionBetweenAndEstado(Usuario usuario, Date fechaInicio, Date fechaFin, String estado); // Asumiendo SancionRepository
    // List<Sancion> findByUsuarioAndFechaSancionGreaterThanEqualAndEstado(Usuario usuario, Date fechaInicio, String estado); // Asumiendo SancionRepository
    // List<Sancion> findByUsuarioAndFechaSancionLessThanEqualAndEstado(Usuario usuario, Date fechaFin, String estado); // Asumiendo SancionRepository
    // Optional<Usuario> findByRu(Integer ru); // Asumiendo UsuarioRepository

}