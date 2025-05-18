package com.proyecto.sistema.repository;

import com.proyecto.sistema.model.Prestamo;
import com.proyecto.sistema.model.Usuario;
// Asegúrate de importar todas las clases modelo que uses en consultas/métodos si no están ya importadas
import com.proyecto.sistema.model.Equipo;
import com.proyecto.sistema.model.Laboratorio;
import com.proyecto.sistema.model.CategoriaEquipo;
import com.proyecto.sistema.model.DetallePrestamo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository; // <-- Añadir esta importación si no estaba

import java.util.Date;
import java.util.List;
import java.time.LocalDateTime; // <-- ¡Importa java.time.LocalDateTime para los recordatorios!

@Repository // <-- Añadir esta anotación si no estaba
public interface PrestamoRepository extends JpaRepository<Prestamo, Integer> {

    List<Prestamo> findByEstado(String estado);

    // Métodos adicionales para los reportes (los que ya tenías sin parámetros)
    @Query(value = "SELECT e.nombre, COUNT(dp.id_equipo) AS cantidad_prestada FROM detalle_prestamo dp JOIN equipos e ON dp.id_equipo = e.id_equipo GROUP BY e.id_equipo ORDER BY cantidad_prestada DESC", nativeQuery = true)
    List<Object[]> obtenerEquiposMasPrestados();

    @Query(value = "SELECT u.nombre, u.apellido, COUNT(p.id_prestamo) AS cantidad_prestamos FROM prestamos p JOIN usuarios u ON p.id_usuario = u.id_usuario GROUP BY u.id_usuario ORDER BY cantidad_prestamos DESC", nativeQuery = true)
    List<Object[]> obtenerUsuariosMasPrestaron();

    // Métodos de búsqueda por fechaPrestamo y estado (los que ya tenías, usan java.util.Date)
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


    // --- Consultas nativas para reportes con parámetros (las que ya tenías corregidas) ---
    // Asegúrate que los nombres de tabla y columna en las consultas nativas coincidan exactamente con tu DB
    @Query(value = "SELECT e.nombre, COUNT(dp.id_equipo) AS cantidad_prestada " +
            "FROM detalle_prestamo dp " +
            "JOIN Equipos e ON dp.id_equipo = e.id_equipo " +
            "JOIN LaboratoriosE l ON e.id_laboratorio = l.id_laboratorio " + // Verifica nombre de tabla
            "JOIN Categorias_Equipos c ON e.id_categoria = c.id_categoria " + // Verifica nombre de tabla
            "JOIN Prestamos p ON dp.id_prestamo = p.id_prestamo " + // JOIN a Prestamos
            "WHERE (:laboratorioId IS NULL OR l.id_laboratorio = :laboratorioId) " +
            "AND (:categoriaId IS NULL OR c.id_categoria = :categoriaId) " +
            "AND (:fechaInicio IS NULL OR p.fecha_prestamo >= :fechaInicio) " +
            "AND (:fechaFin IS NULL OR p.fecha_prestamo <= :fechaFin) " +
            "GROUP BY e.id_equipo, e.nombre " +
            "ORDER BY cantidad_prestada DESC",
            nativeQuery = true)
    List<Object[]> obtenerEquiposMasPrestados(
            @Param("laboratorioId") Integer laboratorioId,
            @Param("categoriaId") Integer categoriaId,
            @Param("fechaInicio") Date fechaInicio, // Usa Date para compatibilidad con p.fecha_prestamo
            @Param("fechaFin") Date fechaFin // Usa Date
    );

    // --- Consulta nativa para "Usuarios que más prestaron" con parámetros ---
    @Query(value = "SELECT u.nombre, u.apellido, COUNT(dp.id_detalle) AS cantidad_prestamos " + // Contando detalles de préstamo
            "FROM Detalle_Prestamo dp "
            + "JOIN Prestamos p ON dp.id_prestamo = p.id_prestamo " // JOIN a Prestamos
            + "JOIN Usuarios u ON p.id_usuario = u.id_usuario "
            + "JOIN Equipos e ON dp.id_equipo = e.id_equipo " // Estos JOINs pueden no ser estrictamente necesarios para contar usuarios, pero mantenemos tu estructura
            + "JOIN LaboratoriosE l ON e.id_laboratorio = l.id_laboratorio "
            + "JOIN Categorias_Equipos c ON e.id_categoria = c.id_categoria "
            + "WHERE (:laboratorioId IS NULL OR l.id_laboratorio = :laboratorioId) "
            + "AND (:categoriaId IS NULL OR c.id_categoria = :categoriaId) "
            + "AND (:fechaInicio IS NULL OR p.fecha_prestamo >= :fechaInicio) "
            + "AND (:fechaFin IS NULL OR p.fecha_prestamo <= :fechaFin) "
            + "GROUP BY u.id_usuario, u.nombre, u.apellido "
            + "ORDER BY cantidad_prestamos DESC",
            nativeQuery = true)
    List<Object[]> obtenerUsuariosMasPrestaron(
            @Param("laboratorioId") Integer laboratorioId,
            @Param("categoriaId") Integer categoriaId,
            @Param("fechaInicio") Date fechaInicio, // Usa Date para compatibilidad
            @Param("fechaFin") Date fechaFin // Usa Date
    );


    // --- ¡NUEVOS MÉTODOS PARA LOS RECORDATORIOS USANDO LocalDateTime! ---
    // Estos métodos buscarán préstamos por su fechaDevolucionEstimada.
    // REQUIEREN que el campo 'fechaDevolucionEstimada' en tu modelo Prestamo sea de tipo java.time.LocalDateTime.

    /**
     * Busca préstamos cuya fecha de devolución estimada se encuentra dentro de un rango de fecha y hora.
     * Requiere que el campo fechaDevolucionEstimada en el modelo Prestamo sea LocalDateTime.
     *
     * @param startDateTime Inicio del rango (inclusivo).
     * @param endDateTime Fin del rango (inclusivo).
     * @return Lista de préstamos dentro del rango de fecha de devolución estimada.
     */
    List<Prestamo> findByFechaDevolucionEstimadaBetween(LocalDateTime startDateTime, LocalDateTime endDateTime);

    /**
     * Busca préstamos pendientes ('pendiente') cuya fecha de devolución estimada se encuentra dentro de un rango
     * de fecha y hora.
     * Esto es útil para encontrar préstamos próximos a vencer o ya vencidos que aún no se han devuelto.
     * Requiere que el campo fechaDevolucionEstimada en el modelo Prestamo sea LocalDateTime.
     *
     * @param estado El estado del préstamo (ej: "pendiente").
     * @param startDateTime Inicio del rango (inclusivo).
     * @param endDateTime Fin del rango (inclusivo).
     * @return Lista de préstamos con el estado especificado dentro del rango de fecha de devolución estimada.
     */
    List<Prestamo> findByEstadoAndFechaDevolucionEstimadaBetween(String estado, LocalDateTime startDateTime, LocalDateTime endDateTime);


    // --- OPCIONAL: Si agregaste un campo 'recordatorioEnviado' (boolean) a tu modelo Prestamo ---
    // Puedes usar este método para obtener solo préstamos con un estado específico (ej: 'pendiente')
    // a los que aún NO se les ha enviado un recordatorio dentro de un rango de fecha estimada de devolución.
    // REQUIERE QUE TENGAS EL CAMPO 'recordatorioEnviado' (boolean) EN TU MODELO Prestamo.
    // List<Prestamo> findByEstadoAndFechaDevolucionEstimadaBetweenAndRecordatorioEnviadoFalse(String estado, LocalDateTime startDateTime, LocalDateTime endDateTime);

}