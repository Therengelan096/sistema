package com.proyecto.sistema.controller;

import com.proyecto.sistema.model.*;
import com.proyecto.sistema.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.Date;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/reportes") // El nombre del controlador no importa, lo importante es la ruta del método
public class ReporteController {
    // Inyección de Repositorios. Asegúrate de que todos están definidos y funcionales.
    @Autowired
    private PrestamoRepository prestamoRepository;
    @Autowired
    private UsuarioRepository usuarioRepository;
    @Autowired
    private SancionRepository sancionRepository;
    @Autowired
    private MantenimientoRepository mantenimientoRepository;
    @Autowired
    private LaboratorioRepository laboratorioRepository;
    @Autowired
    private CategoriaEquipoRepository categoriaEquipoRepository;

    // Endpoint para obtener todos los laboratorios
    // Mapeado a /reportes/laboratorios
    @GetMapping("/laboratorios")
    public ResponseEntity<List<Laboratorio>> getLaboratorios() {
        // Asumiendo que Laboratorio es tu entidad para la tabla LaboratoriosE y tiene un repository
        List<Laboratorio> laboratorios = laboratorioRepository.findAll(); // JpaRepository proporciona findAll()
        return ResponseEntity.ok(laboratorios);
    }

    // Mapeado a /reportes/categorias o /reportes/categorias?laboratorioId=X
    @GetMapping("/categorias")
    public ResponseEntity<List<CategoriaEquipo>> getCategoriasByLaboratorio(
            @RequestParam(value = "laboratorioId", required = false) Integer laboratorioId) {

        List<CategoriaEquipo> categorias;
        if (laboratorioId != null) {
            // Usar el método del repositorio que filtra por ID de laboratorio
            // Asegúrate de que findByLaboratorioId exista en CategoriaEquipoRepository con la @Query corregida
            categorias = categoriaEquipoRepository.findByLaboratorioId(laboratorioId);
        } else {
            // Si no se proporciona laboratorioId, obtener todas las categorías
            // Asegúrate de que findAll() exista en CategoriaEquipoRepository
            categorias = categoriaEquipoRepository.findAll();
        }
        return ResponseEntity.ok(categorias);
    }

    // Método principal para manejar la generación de reportes
    @PostMapping("/generarReporte")
    public ResponseEntity<?> generarReporte(@RequestBody Map<String, Object> reporteRequest) {
        try {
            // String tipoReporte = (String) reporteRequest.get("tipoReporte"); // No parece usarse
            List<String> reportesSeleccionados = (List<String>) reporteRequest.get("reportes");
            // Obtener el mapa de filtros. Asegurarse de que no sea null si no se envían filtros.
            Map<String, Object> filtros = (Map<String, Object>) reporteRequest.get("filtros");
            if (filtros == null) {
                filtros = new HashMap<>(); // Inicializar un mapa vacío si no hay filtros
            }

            Integer usuarioRu = reporteRequest.get("usuarioRu") != null ? (Integer) reporteRequest.get("usuarioRu") : null;


            Map<String, Object> reportesData = new HashMap<>();

            for (String reporteSeleccionado : reportesSeleccionados) {
                // Asegurarse de que todos los métodos llamados aquí acepten el mapa 'filtros'
                switch (reporteSeleccionado) {
                    case "equipos-mas-prestados":
                        reportesData.put("equiposMasPrestados", generarReporteEquiposMasPrestados(filtros));
                        break;
                    case "usuarios-mas-prestaron":
                        // Pasar filtros al método de generación (ahora solo hay una versión que acepta filtros)
                        reportesData.put("usuariosMasPrestaron", generarReportarUsuariosMasPrestaron(filtros)); // Corregido nombre si es necesario
                        break;
                    case "prestamos-por-fecha":
                        reportesData.put("prestamosPorFecha", generarReportePrestamosPorFecha(filtros));
                        break;
                    case "mantenimientos":
                        // Pasar filtros al método de generación (ya implementado)
                        reportesData.put("mantenimientos", generarReporteMantenimientos(filtros));
                        break;
                    case "prestamos-fecha-fecha":
                        // Pasar filtros al método de generación
                        reportesData.put("prestamosFechaFecha", generarReportePrestamosPorRangoDeFechas(filtros));
                        break;
                    case "administradores-prestamo":
                        // Pasar filtros al método de generación
                        reportesData.put("administradoresPrestamo", generarReporteAdministradoresPrestamo(filtros));
                        break;
                    case "sanciones-activas-inactivas":
                        // Pasar filtros al método de generación (se pasa el mapa, aunque no se usen filtros aquí)
                        reportesData.put("sancionesActivasInactivas", generarReporteSancionesActivasInactivas(filtros));
                        break;
                    // --- Casos para reportes de Usuario (ya manejan filtros, se pasa el mapa) ---
                    case "historial-prestamos-usuario":
                        if (usuarioRu != null) {
                            reportesData.put("historialPrestamosUsuario", generarReporteHistorialPrestamosUsuario(usuarioRu, filtros));
                        }
                        break;
                    case "sanciones-usuario":
                        if (usuarioRu != null) {
                            reportesData.put("sancionesUsuario", generarReporteSancionesUsuario(usuarioRu, filtros));
                        }
                        break;
                    case "info-usuario":
                        // info-usuario no usa filtros globales, pero si el método lo espera por consistencia, pásalo.
                        // Tu método generarReporteInfoUsuario(int ru) NO acepta filtros. Está bien así.
                        if (usuarioRu != null) {
                            reportesData.put("infoUsuario", generarReporteInfoUsuario(usuarioRu));
                        }
                        break;
                    // Agrega aquí los demás casos para cada tipo de reporte si tienes más
                }
            }
            return ResponseEntity.ok(reportesData);
        } catch (RuntimeException e) {
            // Captura RuntimeException para mensajes de error controlados (ej: Usuario no encontrado, formato de fecha incorrecto)
            // Esto envía un 400 Bad Request con el mensaje de error de la excepción
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                    "timestamp", new Date(),
                    "status", HttpStatus.BAD_REQUEST.value(),
                    "error", "Bad Request",
                    "message", e.getMessage() // Envía el mensaje de la RuntimeException
            ));
        }
        catch (Exception e) {
            // Captura cualquier otra excepción general
            e.printStackTrace(); // Imprimir stack trace en el servidor para depuración
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "timestamp", new Date(),
                    "status", HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "error", "Internal Server Error",
                    // Envía un mensaje de error genérico en producción
                    "message", "Error inesperado al generar el reporte."
                    // En desarrollo, podrías enviar e.getMessage() o e.toString() para más detalles:
                    // "message", "Error inesperado al generar el reporte: " + e.getMessage()
            ));
        }
    }

    // --- Métodos para generar cada tipo de reporte (Modificados para aceptar filtros) ---

    // --- Método para "Equipos más prestados" ---
    // Modificado: Ahora acepta el mapa de filtros
    private Map<String, Object> generarReporteEquiposMasPrestados(Map<String, Object> filtros) {
        // Lógica para obtener los equipos más prestados

        // --- Extraer y Parsear Filtros Globales ---
        Integer laboratorioId = null;
        Integer categoriaId = null;
        // Date fechaInicio = null; // Si tu consulta nativa en el repositorio soporta fechas de préstamo
        // Date fechaFin = null;   // Si tu consulta nativa en el repositorio soporta fechas de préstamo

        // Extraer y parsear filtro de Laboratorio (igual que en Mantenimientos)
        if (filtros.containsKey("laboratorio") && filtros.get("laboratorio") != null && !filtros.get("laboratorio").toString().isEmpty()) {
            try {
                laboratorioId = Integer.parseInt(filtros.get("laboratorio").toString());
            } catch (NumberFormatException e) {
                throw new RuntimeException("Formato de ID de Laboratorio global incorrecto.");
            }
        }
        // Extraer y parsear filtro de Categoría (igual que en Mantenimientos)
        if (filtros.containsKey("categoria") && filtros.get("categoria") != null && !filtros.get("categoria").toString().isEmpty()) {
            try {
                categoriaId = Integer.parseInt(filtros.get("categoria").toString());
            } catch (NumberFormatException e) {
                throw new RuntimeException("Formato de ID de Categoría global incorrecto.");
            }
        }
        // Extraer y parsear filtros de Fecha si tu consulta nativa los soporta
        // if (filtros.containsKey("fechaInicio") && ...) { ... parse fechaInicio }
        // if (filtros.containsKey("fechaFin") && ...) { ... parse fechaFin }
        // --- Fin de Extraer y Parsear Filtros Globales ---


        List<Object[]> resultados;
        // *** Llamar al método del repositorio con los filtros ***
        // ASUME: El método obtenerEquiposMasPrestados en PrestamoRepository
        // ha sido modificado (con @Query nativeQuery=true) para aceptar Integer laboratorioId, Integer categoriaId
        // y que la consulta nativa usa esos parámetros para filtrar los resultados.
        resultados = prestamoRepository.obtenerEquiposMasPrestados(laboratorioId, categoriaId);
        // Si tu consulta nativa soporta fechas, pásalos aquí también:
        // resultados = prestamoRepository.obtenerEquiposMasPrestados(laboratorioId, categoriaId, fechaInicio, fechaFin);


        List<Map<String, Object>> datos = new ArrayList<>();
        // Asumiendo que la consulta nativa retorna [nombre_equipo, cantidad_prestada] (Object[0], Object[1])
        for (Object[] resultado : resultados) {
            Map<String, Object> equipo = new HashMap<>();
            equipo.put("nombre", resultado[0]);
            equipo.put("cantidadPrestada", resultado[1]);
            datos.add(equipo);
        }
        Map<String, Object> reporte = new HashMap<>();
        reporte.put("titulo", "Equipos que más prestaron"); // Ajusta el título si es diferente
        reporte.put("tipo", "tabla");
        // Asegúrate de que la cabecera coincida con las claves que pones en 'datos'
        reporte.put("cabecera", Arrays.asList("Nombre del Equipo", "Cantidad de veces Prestado"));

        reporte.put("datos", datos);
        return reporte;
    }


    // --- Método para "Usuarios que más prestaron" ---
    // Modificado: Acepta el mapa de filtros (elimina el método sin filtros si existe)
    private Map<String, Object> generarReportarUsuariosMasPrestaron(Map<String, Object> filtros) { // Corregido nombre si es necesario
        // Lógica para obtener los usuarios que más prestaron

        // --- Extraer y Parsear Filtros Globales ---
        Integer laboratorioId = null;
        Integer categoriaId = null;
        // Date fechaInicio = null; // Si tu consulta nativa soporta fechas de préstamo
        // Date fechaFin = null;   // Si tu consulta nativa soporta fechas de préstamo

        // Extraer y parsear filtro de Laboratorio (igual que en Mantenimientos)
        if (filtros.containsKey("laboratorio") && filtros.get("laboratorio") != null && !filtros.get("laboratorio").toString().isEmpty()) {
            try {
                laboratorioId = Integer.parseInt(filtros.get("laboratorio").toString());
            } catch (NumberFormatException e) {
                throw new RuntimeException("Formato de ID de Laboratorio global incorrecto.");
            }
        }
        // Extraer y parsear filtro de Categoría (igual que en Mantenimientos)
        if (filtros.containsKey("categoria") && filtros.get("categoria") != null && !filtros.get("categoria").toString().isEmpty()) {
            try {
                categoriaId = Integer.parseInt(filtros.get("categoria").toString());
            } catch (NumberFormatException e) {
                throw new RuntimeException("Formato de ID de Categoría global incorrecto.");
            }
        }
        // Extraer y parsear filtros de Fecha si tu consulta nativa los soporta
        // if (filtros.containsKey("fechaInicio") && filtros.get("fechaInicio") != null && !filtros.get("fechaInicio").toString().isEmpty()) { ... parse fechaInicio }
        // if (filtros.containsKey("fechaFin") && filtros.get("fechaFin") != null && !filtros.get("fechaFin").toString().isEmpty()) { ... parse fechaFin }
        // --- Fin de Extraer y Parsear Filtros Globales ---

        List<Object[]> resultados;
        // *** Llamar al método del repositorio con los filtros ***
        // ASUME: El método obtenerUsuariosMasPrestaron en PrestamoRepository
        // ha sido modificado (con @Query nativeQuery=true) para aceptar Integer laboratorioId, Integer categoriaId
        // y que la consulta nativa usa esos parámetros para filtrar los resultados.
        resultados = prestamoRepository.obtenerUsuariosMasPrestaron(laboratorioId, categoriaId);
        // Si tu consulta nativa soporta fechas, pásalos aquí también:
        // resultados = prestamoRepository.obtenerUsuariosMasPrestaron(laboratorioId, categoriaId, fechaInicio, fechaFin);


        List<Map<String, Object>> datos = new ArrayList<>();
        // Asumiendo que la consulta nativa retorna [nombre_usuario, apellido_usuario, cantidad_prestamos]
        for (Object[] resultado : resultados) {
            Map<String, Object> usuario = new HashMap<>();
            usuario.put("nombre", resultado[0]);
            usuario.put("apellido", resultado[1]);
            usuario.put("cantidadPrestamos", resultado[2]);
            datos.add(usuario);
        }
        Map<String, Object> reporte = new HashMap<>();
        reporte.put("titulo", "Usuarios que más prestaron"); // Ajusta el título si es diferente
        reporte.put("tipo", "tabla");
        // Asegúrate de que la cabecera coincida con las claves que pones en 'datos'
        reporte.put("cabecera", Arrays.asList("Nombre", "Apellido", "Cantidad de Préstamos"));

        reporte.put("datos", datos);
        return reporte;
    }


    // --- Método para "Préstamos por Fecha" ---
    // Ya acepta filtros, añadir extracción de Lab/Cat (aunque no se usen en el repo actual)
    private Map<String, Object> generarReportePrestamosPorFecha(Map<String, Object> filtros) {
        // Lógica para obtener los préstamos por fecha

        // --- Extraer y Parsear Filtros Globales ---
        Date fechaInicio = null;
        Date fechaFin = null;
        Integer laboratorioId = null; // Añadir extracción de Lab/Cat para consistencia
        Integer categoriaId = null;   // Añadir extracción de Lab/Cat para consistencia

        if (filtros.containsKey("fechaInicio") && filtros.get("fechaInicio") != null && !filtros.get("fechaInicio").toString().isEmpty()) {
            try {
                fechaInicio = java.sql.Date.valueOf(filtros.get("fechaInicio").toString());
            } catch (IllegalArgumentException e) {
                throw new RuntimeException("Formato de fecha de inicio global incorrecto. Use YYYY-MM-DD.");
            }
        }
        if (filtros.containsKey("fechaFin") && filtros.get("fechaFin") != null && !filtros.get("fechaFin").toString().isEmpty()) {
            try {
                fechaFin = java.sql.Date.valueOf(filtros.get("fechaFin").toString());
            } catch (IllegalArgumentException e) {
                throw new RuntimeException("Formato de fecha de fin global incorrecto. Use YYYY-MM-DD.");
            }
        }
        // Extraer y parsear filtro de Laboratorio (igual que en Mantenimientos)
        if (filtros.containsKey("laboratorio") && filtros.get("laboratorio") != null && !filtros.get("laboratorio").toString().isEmpty()) {
            try {
                laboratorioId = Integer.parseInt(filtros.get("laboratorio").toString());
            } catch (NumberFormatException e) {
                throw new RuntimeException("Formato de ID de Laboratorio global incorrecto.");
            }
        }
        // Extraer y parsear filtro de Categoría (igual que en Mantenimientos)
        if (filtros.containsKey("categoria") && filtros.get("categoria") != null && !filtros.get("categoria").toString().isEmpty()) {
            try {
                categoriaId = Integer.parseInt(filtros.get("categoria").toString());
            } catch (NumberFormatException e) {
                throw new RuntimeException("Formato de ID de Categoría global incorrecto.");
            }
        }
        // --- Fin de Extraer y Parsear Filtros Globales ---


        List<Prestamo> prestamos;
        // *** NOTA: Aquí necesitas modificar el método del repositorio si quieres filtrar por Lab/Cat ***
        // Los métodos findByFechaPrestamoBetween, GreaterThanEqual, LessThanEqual, findAll en PrestamoRepository
        // actualmente NO aceptan filtros de Laboratorio o Categoría.
        // Si quieres que esos filtros funcionen para este reporte, necesitas añadir nuevos métodos
        // en PrestamoRepository con @Query JPQL que se unan a DetallePrestamo, Equipo, Laboratorio, CategoriaEquipo
        // y usen los parámetros fechaInicio, fechaFin, laboratorioId, categoriaId.
        if (fechaInicio != null && fechaFin != null) {
            // Llama a un método que acepte todos los filtros si existe:
            // prestamos = prestamoRepository.findFilteredByFechaAndLabCat(fechaInicio, fechaFin, laboratorioId, categoriaId);
            // Sino, llama al método existente solo con fechas:
            prestamos = prestamoRepository.findByFechaPrestamoBetween(fechaInicio, fechaFin); // Implementa este método si no existe

        } else if (fechaInicio != null) {
            // Llama a un método que acepte todos los filtros si existe:
            // prestamos = prestamoRepository.findFilteredByFechaInicioAndLabCat(fechaInicio, laboratorioId, categoriaId);
            // Sino, llama al método existente solo con fechas:
            prestamos = prestamoRepository.findByFechaPrestamoGreaterThanEqual(fechaInicio);

        } else if (fechaFin != null) {
            // Llama a un método que acepte todos los filtros si existe:
            // prestamos = prestamoRepository.findFilteredByFechaFinAndLabCat(fechaFin, laboratorioId, categoriaId);
            // Sino, llama al método existente solo con fechas:
            prestamos = prestamoRepository.findByFechaPrestamoLessThanEqual(fechaFin);

        }
        else {
            // Llama a un método que acepte todos los filtros si existe:
            // prestamos = prestamoRepository.findFilteredByLabCat(laboratorioId, categoriaId);
            // Sino, llama al método existente sin filtros:
            prestamos = prestamoRepository.findAll(); // Cuidado: Este findAll no filtra por Lab/Cat
        }

        List<Map<String, Object>> datos = new ArrayList<>();
        for (Prestamo prestamo : prestamos) {
            Map<String, Object> prestamoData = new HashMap<>();
            prestamoData.put("idPrestamo", prestamo.getIdPrestamo());
            prestamoData.put("usuario", prestamo.getUsuario() != null ? prestamo.getUsuario().getNombre() + " " + prestamo.getUsuario().getApellido() : "N/A"); // Manejar si usuario es null
            prestamoData.put("fechaPrestamo", prestamo.getFechaPrestamo());
            prestamoData.put("horaPrestamo", prestamo.getHoraPrestamo());
            prestamoData.put("estado", prestamo.getEstado());
            // Opcional: Añadir Lab/Cat del equipo prestado si es relevante para este reporte (requiere unir con DetallePrestamo y Equipo)
            // Esto es complejo y requeriría obtener los detalles del préstamo y los equipos asociados.
            // Si este reporte solo lista préstamos por fecha, no es necesario añadir detalles de equipos.
            datos.add(prestamoData);
        }
        Map<String, Object> reporte = new HashMap<>();
        reporte.put("titulo", "Préstamos por Fecha");
        reporte.put("tipo", "tabla");
        // Asegúrate de que esta cabecera coincida con las claves que pones en 'datos'
        reporte.put("cabecera", Arrays.asList("ID Préstamo", "Usuario", "Fecha de Préstamo", "Hora de Préstamo","Estado"));
        reporte.put("datos", datos);
        return reporte;
    }

    // --- Método para "Mantenimientos" ---
    // Ya implementado el parseo y uso de filtros correctamente con findFiltered en el repositorio.
    private Map<String, Object> generarReporteMantenimientos(Map<String, Object> filtros) {
        // Lógica para obtener los mantenimientos
        Date fechaInicio = null;
        Date fechaFin = null;
        Integer laboratorioId = null;
        Integer categoriaId = null;

        // --- Extraer y Parsear Filtros Globales ---
        if (filtros.containsKey("fechaInicio") && filtros.get("fechaInicio") != null && !filtros.get("fechaInicio").toString().isEmpty()) {
            try {
                fechaInicio = java.sql.Date.valueOf(filtros.get("fechaInicio").toString());
            } catch (IllegalArgumentException e) {
                throw new RuntimeException("Formato de Fecha Inicio global incorrecto. Use YYYY-MM-DD.");
            }
        }
        if (filtros.containsKey("fechaFin") && filtros.get("fechaFin") != null && !filtros.get("fechaFin").toString().isEmpty()) {
            try {
                fechaFin = java.sql.Date.valueOf(filtros.get("fechaFin").toString());
            } catch (IllegalArgumentException e) {
                throw new RuntimeException("Formato de Fecha Fin global incorrecto. Use YYYY-MM-DD.");
            }
        }
        if (filtros.containsKey("laboratorio") && filtros.get("laboratorio") != null && !filtros.get("laboratorio").toString().isEmpty()) {
            try {
                laboratorioId = Integer.parseInt(filtros.get("laboratorio").toString());
            } catch (NumberFormatException e) {
                throw new RuntimeException("Formato de ID de Laboratorio global incorrecto.");
            }
        }
        if (filtros.containsKey("categoria") && filtros.get("categoria") != null && !filtros.get("categoria").toString().isEmpty()) {
            try {
                categoriaId = Integer.parseInt(filtros.get("categoria").toString());
            } catch (NumberFormatException e) {
                throw new RuntimeException("Formato de ID de Categoría global incorrecto.");
            }
        }
        // --- Fin de Extraer y Parsear Filtros Globales ---

        List<Mantenimiento> mantenimientos;
        // *** Llamar al método filtrado del repositorio (Este ya funciona con todos los filtros) ***
        // ASUME: findFiltered en MantenimientoRepository existe y usa todos los parámetros.
        mantenimientos = mantenimientoRepository.findFiltered(fechaInicio, fechaFin, laboratorioId, categoriaId);

        List<Map<String, Object>> datos = new ArrayList<>();
        for (Mantenimiento mantenimiento : mantenimientos) {
            Map<String, Object> mantenimientoData = new HashMap<>();
            mantenimientoData.put("idMantenimiento", mantenimiento.getIdMantenimiento());
            // Asegurarse de que las relaciones no sean nulas antes de acceder a propiedades
            mantenimientoData.put("equipo", mantenimiento.getEquipo() != null ? mantenimiento.getEquipo().getNombre() : "N/A");
            mantenimientoData.put("fechaMantenimiento", mantenimiento.getFechaMantenimiento());
            mantenimientoData.put("estadoInicial", mantenimiento.getEstadoInicial());
            mantenimientoData.put("estadoFinal", mantenimiento.getEstadoFinal());
            mantenimientoData.put("descripcionProblema", mantenimiento.getDescripcionProblema());
            mantenimientoData.put("solucionAplicada", mantenimiento.getSolucionAplicada());
            // Opcional: Añadir Lab/Cat del equipo mantenido si es relevante
            // mantenimientoData.put("laboratorio", mantenimiento.getEquipo() != null && mantenimiento.getEquipo().getLaboratorio() != null ? mantenimiento.getEquipo().getLaboratorio().getNombre() : "N/A");
            // mantenimientoData.put("categoria", mantenimiento.getEquipo() != null && mantenimiento.getEquipo().getCategoria() != null ? mantenimiento.getEquipo().getCategoria().getNombreCategoria() : "N/A");
            datos.add(mantenimientoData);
        }
        Map<String, Object> reporte = new HashMap<>();
        reporte.put("titulo", "Mantenimientos");
        reporte.put("tipo", "tabla");
        // Asegúrate de que esta cabecera coincida con las claves que pones en 'datos'
        reporte.put("cabecera", Arrays.asList("ID Mantenimiento", "Equipo", "Fecha de Mantenimiento", "Estado Inicial", "Estado Final", "Descripción del Problema", "Solución Aplicada"));
        // Si añadiste columnas opcionales, agrégalas aquí
        // Arrays.asList("ID Mantenimiento", "Equipo", "Laboratorio", "Categoría", "Fecha de Mantenimiento", ...)
        reporte.put("datos", datos);
        return reporte;
    }

    // --- Método para "Préstamos por Rango de Fechas" ---
    // Ya acepta filtros, añadir extracción de Lab/Cat (aunque no se usen en el repo actual)
    private Map<String, Object> generarReportePrestamosPorRangoDeFechas(Map<String, Object> filtros) {
        Date fechaInicio = null;
        Date fechaFin = null;
        Integer laboratorioId = null; // Añadir extracción de Lab/Cat para consistencia
        Integer categoriaId = null;   // Añadir extracción de Lab/Cat para consistencia

        if (filtros.containsKey("fechaInicio") && filtros.get("fechaInicio") != null && !filtros.get("fechaInicio").toString().isEmpty()) {
            try {
                fechaInicio = java.sql.Date.valueOf(filtros.get("fechaInicio").toString());
            } catch (IllegalArgumentException e) {
                throw new RuntimeException("Formato de fecha de inicio global incorrecto. Use YYYY-MM-DD.");
            }
        }
        if (filtros.containsKey("fechaFin") && filtros.get("fechaFin") != null && !filtros.get("fechaFin").toString().isEmpty()) {
            try {
                fechaFin = java.sql.Date.valueOf(filtros.get("fechaFin").toString());
            } catch (IllegalArgumentException e) {
                throw new RuntimeException("Formato de fecha de fin global incorrecto. Use YYYY-MM-DD.");
            }
        }
        // Extraer y parsear filtro de Laboratorio
        if (filtros.containsKey("laboratorio") && filtros.get("laboratorio") != null && !filtros.get("laboratorio").toString().isEmpty()) {
            try {
                laboratorioId = Integer.parseInt(filtros.get("laboratorio").toString());
            } catch (NumberFormatException e) {
                throw new RuntimeException("Formato de ID de Laboratorio global incorrecto.");
            }
        }
        // Extraer y parsear filtro de Categoría
        if (filtros.containsKey("categoria") && filtros.get("categoria") != null && !filtros.get("categoria").toString().isEmpty()) {
            try {
                categoriaId = Integer.parseInt(filtros.get("categoria").toString());
            } catch (NumberFormatException e) {
                throw new RuntimeException("Formato de ID de Categoría global incorrecto.");
            }
        }

        List<Prestamo> prestamos;
        // *** NOTA: Aquí necesitas modificar el método del repositorio si quieres filtrar por Lab/Cat ***
        // El método findByFechaPrestamoBetween en PrestamoRepository
        // actualmente NO acepta filtros de Laboratorio o Categoría.
        // Si quieres que esos filtros funcionen para este reporte, necesitas añadir un nuevo método
        // en PrestamoRepository con @Query JPQL que se una a DetallePrestamo, Equipo, Laboratorio, CategoriaEquipo
        // y use los parámetros fechaInicio, fechaFin, laboratorioId, categoriaId.
        if (fechaInicio != null && fechaFin != null) {
            // Llama a un método que acepte todos los filtros si existe:
            // prestamos = prestamoRepository.findFilteredByRangeAndLabCat(fechaInicio, fechaFin, laboratorioId, categoriaId);
            // Sino, llama al método existente solo con fechas:
            prestamos = prestamoRepository.findByFechaPrestamoBetween(fechaInicio, fechaFin); // Implementa este método si no existe
        } else {
            // Llama a un método que acepte todos los filtros si existe (sin rango de fechas pero con Lab/Cat):
            // prestamos = prestamoRepository.findFilteredByLabCat(laboratorioId, categoriaId);
            // Sino, llama al método existente sin filtros:
            prestamos = prestamoRepository.findAll(); // Cuidado: Este findAll no filtra por Lab/Cat
        }

        List<Map<String, Object>> datos = new ArrayList<>();
        for (Prestamo prestamo : prestamos) {
            Map<String, Object> prestamoData = new HashMap<>();
            prestamoData.put("idPrestamo", prestamo.getIdPrestamo());
            prestamoData.put("usuario", prestamo.getUsuario() != null ? prestamo.getUsuario().getNombre() + " " + prestamo.getUsuario().getApellido() : "N/A");
            prestamoData.put("fechaPrestamo", prestamo.getFechaPrestamo());
            prestamoData.put("horaPrestamo", prestamo.getHoraPrestamo());
            prestamoData.put("administrador", prestamo.getAdministrador() != null ? prestamo.getAdministrador().getNombre() : "N/A"); // Asumiendo Prestamo.getAdministrador() y Administrador.getNombre()
            // Opcional: Añadir Lab/Cat del equipo prestado si es relevante
            // prestamoData.put("laboratorioEquipo", ...);
            // prestamoData.put("categoriaEquipo", ...);
            datos.add(prestamoData);
        }
        Map<String, Object> reporte = new HashMap<>();
        reporte.put("titulo", "Préstamos por Rango de Fechas");
        reporte.put("tipo", "tabla");
        // Asegúrate de que esta cabecera coincida con las claves que pones en 'datos'
        reporte.put("cabecera", Arrays.asList("ID Préstamo", "Usuario", "Fecha de Préstamo","Hora de Préstamo", "Administrador"));
        // Si añadiste columnas opcionales, agrégalas aquí
        reporte.put("datos", datos);
        return reporte;
    }

    // --- Método para "Administradores que Prestaron" ---
    // Ya acepta filtros, añadir extracción de Lab/Cat (aunque no se usen en el repo actual)
    private Map<String, Object> generarReporteAdministradoresPrestamo(Map<String, Object> filtros) {
        Date fechaInicio = null;
        Date fechaFin = null;
        Integer laboratorioId = null; // Añadir extracción de Lab/Cat para consistencia
        Integer categoriaId = null;   // Añadir extracción de Lab/Cat para consistencia

        if (filtros.containsKey("fechaInicio") && filtros.get("fechaInicio") != null && !filtros.get("fechaInicio").toString().isEmpty()) {
            try {
                fechaInicio = java.sql.Date.valueOf(filtros.get("fechaInicio").toString());
            } catch (IllegalArgumentException e) {
                throw new RuntimeException("Formato de fecha de inicio global incorrecto. Use YYYY-MM-DD.");
            }
        }
        if (filtros.containsKey("fechaFin") && filtros.get("fechaFin") != null && !filtros.get("fechaFin").toString().isEmpty()) {
            try {
                fechaFin = java.sql.Date.valueOf(filtros.get("fechaFin").toString());
            } catch (IllegalArgumentException e) {
                throw new RuntimeException("Formato de fecha de fin global incorrecto. Use YYYY-MM-DD.");
            }
        }
        // Extraer y parsear filtro de Laboratorio
        if (filtros.containsKey("laboratorio") && filtros.get("laboratorio") != null && !filtros.get("laboratorio").toString().isEmpty()) {
            try {
                laboratorioId = Integer.parseInt(filtros.get("laboratorio").toString());
            } catch (NumberFormatException e) {
                throw new RuntimeException("Formato de ID de Laboratorio global incorrecto.");
            }
        }
        // Extraer y parsear filtro de Categoría
        if (filtros.containsKey("categoria") && filtros.get("categoria") != null && !filtros.get("categoria").toString().isEmpty()) {
            try {
                categoriaId = Integer.parseInt(filtros.get("categoria").toString());
            } catch (NumberFormatException e) {
                throw new RuntimeException("Formato de ID de Categoría global incorrecto.");
            }
        }

        List<Prestamo> prestamos;
        // *** NOTA: Aquí necesitas modificar el método del repositorio si quieres filtrar por Lab/Cat ***
        // Los métodos findByFechaPrestamoBetween, findAll en PrestamoRepository
        // actualmente NO aceptan filtros de Laboratorio o Categoría.
        // Si quieres que esos filtros funcionen para este reporte, necesitas añadir nuevos métodos
        // en PrestamoRepository con @Query JPQL que se unan a DetallePrestamo, Equipo, Laboratorio, CategoriaEquipo
        // y usen los parámetros fechaInicio, fechaFin, laboratorioId, categoriaId (además de filtrar por administrador si es el caso).
        if (fechaInicio != null && fechaFin != null) {
            // Llama a un método que acepte todos los filtros si existe:
            // prestamos = prestamoRepository.findFilteredByRangeAndLabCatAndAdmin(fechaInicio, fechaFin, laboratorioId, categoriaId);
            // Sino, llama al método existente solo con fechas:
            prestamos = prestamoRepository.findByFechaPrestamoBetween(fechaInicio, fechaFin); // Implementa este método si no existe
        } else {
            // Llama a un método que acepte todos los filtros si existe (sin rango de fechas pero con Lab/Cat/Admin):
            // prestamos = prestamoRepository.findFilteredByLabCatAndAdmin(laboratorioId, categoriaId);
            // Sino, llama al método existente sin filtros:
            prestamos = prestamoRepository.findAll(); // Cuidado: Este findAll no filtra por Lab/Cat/Admin
        }


        List<Map<String, Object>> datos = new ArrayList<>();
        for (Prestamo prestamo : prestamos) {
            Map<String, Object> prestamoData = new HashMap<>();
            // Asegurarse de que las relaciones no sean nulas
            prestamoData.put("administrador", prestamo.getAdministrador() != null ? prestamo.getAdministrador().getNombre() : "N/A");
            prestamoData.put("fechaPrestamo", prestamo.getFechaPrestamo());
            prestamoData.put("horaPrestamo", prestamo.getHoraPrestamo());
            prestamoData.put("usuario", prestamo.getUsuario() != null ? prestamo.getUsuario().getNombre() +" "+ prestamo.getUsuario().getApellido() : "N/A");
            // Opcional: Añadir Lab/Cat del equipo prestado si es relevante
            // prestamoData.put("laboratorioEquipo", ...);
            // prestamoData.put("categoriaEquipo", ...);
            datos.add(prestamoData);
        }
        Map<String, Object> reporte = new HashMap<>();
        reporte.put("titulo", "Administradores que Prestaron");
        reporte.put("tipo", "tabla");
        // Asegúrate de que esta cabecera coincida con las claves que pones en 'datos'
        reporte.put("cabecera", Arrays.asList("Administrador", "Fecha de Préstamo","Hora de Préstamo", "Usuario"));
        // Si añadiste columnas opcionales, agrégalas aquí
        reporte.put("datos", datos);
        return reporte;
    }

    // --- Método para "Sanciones Activas/Inactivas" ---
    // Modificado: Acepta filtros (aunque no se usen), retorna tabla detallada
    private Map<String, Object> generarReporteSancionesActivasInactivas(Map<String, Object> filtros) { // Ahora acepta filtros
        // Lógica para obtener las sanciones activas e inactivas
        // No hay filtros lógicos (Fecha, Lab, Cat) para este reporte de resumen/lista de sanciones,
        // pero aceptamos el mapa de filtros por consistencia si se pasan.

        // Obtener TODAS las sanciones activas e inactivas para listarlas
        List<Sancion> sancionesActivas = sancionRepository.findByEstado("activa"); // Asume este método existe
        List<Sancion> sancionesInactivas = sancionRepository.findByEstado("inactiva"); // Asume este método existe

        List<Sancion> todasLasSanciones = new ArrayList<>();
        todasLasSanciones.addAll(sancionesActivas);
        todasLasSanciones.addAll(sancionesInactivas);

        List<Map<String, Object>> datos = new ArrayList<>();

        // Recorrer todas las sanciones y añadirlas a la lista de datos
        for (Sancion sancion : todasLasSanciones) {
            Map<String, Object> sancionData = new HashMap<>();
            sancionData.put("idSancion", sancion.getIdSancion());
            // Asumiendo que Sancion.getUsuario() existe y Usuario.getNombre/Apellido existe
            sancionData.put("usuario", sancion.getUsuario() != null ? sancion.getUsuario().getNombre() + " " + sancion.getUsuario().getApellido() : "N/A");
            sancionData.put("motivoSancion", sancion.getMotivoSancion());
            sancionData.put("fechaSancion", sancion.getFechaSancion());
            sancionData.put("estado", sancion.getEstado()); // Será "activa" o "inactiva"
            datos.add(sancionData);
        }

        Map<String, Object> reporte = new HashMap<>();
        reporte.put("titulo", "Detalle de Sanciones por Estado"); // Título más descriptivo
        reporte.put("tipo", "tabla"); // <--- ¡Cambiamos el tipo a tabla!
        // Definir cabeceras para la tabla que lista sanciones
        // Asegúrate de que esta cabecera coincida con las claves que pones en 'datos'
        reporte.put("cabecera", Arrays.asList("ID Sanción", "Usuario", "Motivo de Sanción", "Fecha de Sanción", "Estado"));
        reporte.put("datos", datos); // Enviar la lista de mapas de datos

        // Opcional: Si también quieres el conteo en el mismo reporte (quizás en el título o como texto adicional)
        // String conteoTexto = "Total Activas: " + sancionesActivas.size() + ", Total Inactivas: " + sancionesInactivas.size();
        // reporte.put("conteoResumen", conteoTexto); // Añadir como campo extra si es necesario en el frontend

        return reporte;
    }

    // --- Métodos para reportes de Usuario (ya manejan filtros específicos de usuario) ---

    private Map<String, Object> generarReporteHistorialPrestamosUsuario(int ru, Map<String, Object> filtros) {
        // Lógica para obtener el historial de préstamos de un usuario
        Usuario usuario = usuarioRepository.findByRu(ru).orElse(null);
        if (usuario == null) {
            throw new RuntimeException("Usuario no encontrado con RU: " + ru);
        }
        Date fechaInicio = null;
        Date fechaFin = null;
        String estado = (String) filtros.get("estadoPrestamo"); // Filtro específico de usuario


        if (filtros.containsKey("fechaInicioPrestamos") && filtros.get("fechaInicioPrestamos") != null && !filtros.get("fechaInicioPrestamos").toString().isEmpty()) {
            try {
                fechaInicio = java.sql.Date.valueOf(filtros.get("fechaInicioPrestamos").toString());
            } catch (IllegalArgumentException e) {
                throw new RuntimeException("Formato de fecha de inicio del historial de préstamos incorrecto. Use YYYY-MM-DD.");
            }
        }
        if (filtros.containsKey("fechaFinPrestamos") && filtros.get("fechaFinPrestamos") != null && !filtros.get("fechaFinPrestamos").toString().isEmpty()) {
            try {
                fechaFin = java.sql.Date.valueOf(filtros.get("fechaFinPrestamos").toString());
            } catch (IllegalArgumentException e) {
                throw new RuntimeException("Formato de fecha de fin del historial de préstamos incorrecto. Use YYYY-MM-DD.");
            }
        }

        // Lógica para llamar a diferentes métodos del repositorio según los filtros combinados
        List<Prestamo> prestamos;
        if (fechaInicio != null && fechaFin != null && estado != null && !estado.isEmpty()) {
            // Asegúrate de que este método exista en PrestamoRepository
            prestamos = prestamoRepository.findByUsuarioAndFechaPrestamoBetweenAndEstado(usuario, fechaInicio, fechaFin, estado);
        }
        else if (fechaInicio != null && fechaFin != null){
            // Asegúrate de que este método exista en PrestamoRepository
            prestamos = prestamoRepository.findByUsuarioAndFechaPrestamoBetween(usuario, fechaInicio, fechaFin);
        }
        else if (fechaInicio != null && estado != null && !estado.isEmpty()){
            // Asegúrate de que este método exista en PrestamoRepository
            prestamos = prestamoRepository.findByUsuarioAndFechaPrestamoGreaterThanEqualAndEstado(usuario, fechaInicio, estado);
        }
        else if (fechaFin != null && estado != null && !estado.isEmpty()){
            // Asegúrate de que este método exista en PrestamoRepository
            prestamos = prestamoRepository.findByUsuarioAndFechaPrestamoLessThanEqualAndEstado(usuario, fechaFin, estado);
        }
        else if (fechaInicio != null) {
            // Asegúrate de que este método exista en PrestamoRepository
            prestamos = prestamoRepository.findByUsuarioAndFechaPrestamoGreaterThanEqual(usuario, fechaInicio);
        } else if (fechaFin != null) {
            // Asegúrate de que este método exista en PrestamoRepository
            prestamos = prestamoRepository.findByUsuarioAndFechaPrestamoLessThanEqual(usuario, fechaFin);
        }
        else if (estado != null && !estado.isEmpty()){
            // Asegúrate de que este método exista en PrestamoRepository
            prestamos = prestamoRepository.findByUsuarioAndEstado(usuario, estado);
        }
        else {
            // Asegúrate de que este método exista en PrestamoRepository
            prestamos = prestamoRepository.findByUsuario(usuario);
        }


        List<Map<String, Object>> datos = new ArrayList<>();
        for (Prestamo prestamo : prestamos) {
            Map<String, Object> prestamoData = new HashMap<>();
            prestamoData.put("idPrestamo", prestamo.getIdPrestamo());
            prestamoData.put("fechaPrestamo", prestamo.getFechaPrestamo());
            prestamoData.put("horaPrestamo", prestamo.getHoraPrestamo());
            prestamoData.put("estado", prestamo.getEstado());
            prestamoData.put("fechaDevolucionEstimada", prestamo.getFechaDevolucionEstimada()); // Asumiendo Prestamo.getFechaDevolucionEstimada()
            datos.add(prestamoData);
        }
        Map<String, Object> reporte = new HashMap<>();
        reporte.put("titulo", "Historial de Préstamos del Usuario " + (usuario != null ? usuario.getNombre() + " " + usuario.getApellido() : ""));
        reporte.put("tipo", "tabla");
        // Asegúrate de que esta cabecera coincida con las claves que pones en 'datos'
        reporte.put("cabecera", Arrays.asList("ID Préstamo", "Fecha de Préstamo", "Hora de Préstamo","Estado", "Fecha de Devolución Estimada"));
        reporte.put("datos", datos);
        return reporte;
    }

    private Map<String, Object> generarReporteSancionesUsuario(int ru, Map<String, Object> filtros) {
        // Lógica para obtener las sanciones de un usuario
        Usuario usuario = usuarioRepository.findByRu(ru).orElse(null);
        if (usuario == null) {
            throw new RuntimeException("Usuario no encontrado con RU: " + ru);
        }

        Date fechaInicio = null;
        Date fechaFin = null;
        String estado = (String) filtros.get("estadoSancion"); // Filtro específico de usuario


        if (filtros.containsKey("fechaInicioSanciones") && filtros.get("fechaInicioSanciones") != null && !filtros.get("fechaInicioSanciones").toString().isEmpty()) {
            try {
                fechaInicio = java.sql.Date.valueOf(filtros.get("fechaInicioSanciones").toString());
            } catch (IllegalArgumentException e) {
                throw new RuntimeException("Formato de fecha de inicio de sanciones incorrecto. Use YYYY-MM-DD.");
            }
        }
        if (filtros.containsKey("fechaFinSanciones") && filtros.get("fechaFinSanciones") != null && !filtros.get("fechaFinSanciones").toString().isEmpty()) {
            try {
                fechaFin = java.sql.Date.valueOf(filtros.get("fechaFinSanciones").toString());
            } catch (IllegalArgumentException e) {
                throw new RuntimeException("Formato de fecha de fin de sanciones incorrecto. Use YYYY-MM-DD.");
            }
        }

        // Lógica para llamar a diferentes métodos del repositorio según los filtros combinados
        List<Sancion> sanciones;
        if (fechaInicio != null && fechaFin != null && estado != null && !estado.isEmpty()) {
            // Asegúrate de que este método exista en SancionRepository
            sanciones = sancionRepository.findByUsuarioAndFechaSancionBetweenAndEstado(usuario, fechaInicio, fechaFin, estado);
        }
        else if (fechaInicio != null && fechaFin != null){
            // Asegúrate de que este método exista en SancionRepository
            sanciones = sancionRepository.findByUsuarioAndFechaSancionBetween(usuario, fechaInicio, fechaFin);
        }
        else if (fechaInicio != null && estado != null && !estado.isEmpty()){
            // Asegúrate de que este método exista en SancionRepository
            sanciones = sancionRepository.findByUsuarioAndFechaSancionGreaterThanEqualAndEstado(usuario, fechaInicio, estado);
        }
        else if (fechaFin != null && estado != null && !estado.isEmpty()){
            // Asegúrate de que este método exista en SancionRepository
            sanciones = sancionRepository.findByUsuarioAndFechaSancionLessThanEqualAndEstado(usuario, fechaFin, estado);
        }
        else if (fechaInicio != null) {
            // Asegúrate de que este método exista en SancionRepository
            sanciones = sancionRepository.findByUsuarioAndFechaSancionGreaterThanEqual(usuario, fechaInicio);
        } else if (fechaFin != null) {
            // Asegúrate de que este método exista en SancionRepository
            sanciones = sancionRepository.findByUsuarioAndFechaSancionLessThanEqual(usuario, fechaFin);
        }
        else if (estado != null && !estado.isEmpty()){
            // Asegúrate de que este método exista en SancionRepository
            sanciones = sancionRepository.findByUsuarioAndEstado(usuario, estado);
        }
        else {
            // Asegúrate de que este método exista en SancionRepository
            sanciones = sancionRepository.findByUsuario(usuario);
        }
        List<Map<String, Object>> datos = new ArrayList<>();
        for (Sancion sancion : sanciones) {
            Map<String, Object> sancionData = new HashMap<>();
            sancionData.put("idSancion", sancion.getIdSancion());
            sancionData.put("motivoSancion", sancion.getMotivoSancion());
            sancionData.put("fechaSancion", sancion.getFechaSancion());
            sancionData.put("estado", sancion.getEstado());
            datos.add(sancionData);
        }
        Map<String, Object> reporte = new HashMap<>();
        reporte.put("titulo", "Sanciones del Usuario " + (usuario != null ? usuario.getNombre() + " " + usuario.getApellido() : ""));
        reporte.put("tipo", "tabla");
        // Asegúrate de que esta cabecera coincida con las claves que pones en 'datos'
        reporte.put("cabecera", Arrays.asList("ID Sanción", "Motivo de Sanción", "Fecha de Sanción", "Estado"));
        reporte.put("datos", datos);
        return reporte;
    }

    private Map<String, Object> generarReporteInfoUsuario(int ru) {
        // Lógica para obtener la información de un usuario
        Usuario usuario = usuarioRepository.findByRu(ru).orElse(null);
        if (usuario == null) {
            // Mantener el lanzamiento de RuntimeException para que el catch general lo maneje
            throw new RuntimeException("Usuario no encontrado con RU: " + ru);
        }
        Map<String, Object> reporte = new HashMap<>();
        reporte.put("titulo", "Información del Usuario");
        reporte.put("tipo", "texto");
        // Construye el string con más datos personales
        StringBuilder datosUsuario = new StringBuilder();
        datosUsuario.append("Nombre: ").append(usuario.getNombre()).append("\n");
        datosUsuario.append("Apellido: ").append(usuario.getApellido()).append("\n");
        datosUsuario.append("RU: ").append(usuario.getRu()).append("\n");
        datosUsuario.append("CI: ").append(usuario.getCi()).append("\n");
        datosUsuario.append("Email: ").append(usuario.getCorreo()).append("\n");
        // Añadir los nuevos campos, verificando si no son nulos para evitar "null" en el reporte
        if (usuario.getCarrera() != null && !usuario.getCarrera().isEmpty()) {
            datosUsuario.append("Carrera: ").append(usuario.getCarrera()).append("\n");
        }
        if (usuario.getTelefono() != null && usuario.getTelefono().trim().length() > 0) { // Verificar también que no sea solo espacios
            datosUsuario.append("Teléfono: ").append(usuario.getTelefono()).append("\n");
        }
        // Nota: materia, paralelo, semestre pueden ser nulos, verifica antes de añadirlos
        if (usuario.getMateria() != null && usuario.getMateria().trim().length() > 0) {
            datosUsuario.append("Materia: ").append(usuario.getMateria()).append("\n");
        }
        if (usuario.getParalelo() != null && usuario.getParalelo().trim().length() > 0) {
            datosUsuario.append("Paralelo: ").append(usuario.getParalelo()).append("\n");
        }
        if (usuario.getSemestre() != null && usuario.getSemestre().trim().length() > 0) {
            datosUsuario.append("Semestre: ").append(usuario.getSemestre()).append("\n");
        }
        reporte.put("datos", datosUsuario.toString()); // Usa el StringBuilder
        return reporte;
    }

}