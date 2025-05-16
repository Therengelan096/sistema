package com.proyecto.sistema.controller;

import com.proyecto.sistema.model.*; // Importar todos los modelos necesarios (Usuario, Laboratorio, HorarioLaboratorio, etc.)
import com.proyecto.sistema.model.DiaSemana; // Importar el ENUM DiaSemana si está dentro de HorarioLaboratorio
import com.proyecto.sistema.repository.*; // Importar todos los repositorios necesarios (UsuarioRepository, LaboratorioRepository, HorarioLaboratorioRepository, etc.)
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalTime; // Importar si usas LocalTime
import java.sql.Date; // Usar java.sql.Date para el mapeo de fechas de BD
import java.util.List; // Mantener importaciones de util
import java.util.Map; // Mantener importaciones de util
import java.util.HashMap; // Mantener importaciones de util
import java.util.Arrays; // Mantener importaciones de util
import java.util.Optional; // Para Optional en la búsqueda de entidades

import java.util.ArrayList; // Importar ArrayList
import java.util.stream.Collectors; // Importar si usas streams


@RestController
@RequestMapping("/reportes")
public class ReporteController {

    // Inyección de Repositorios. Asegúrate de que todos están definidos y funcionales en tu proyecto.
    @Autowired
    private PrestamoRepository prestamoRepository;
    @Autowired
    private UsuarioRepository usuarioRepository;
    @Autowired
    private SancionRepository sancionRepository;
    @Autowired
    private MantenimientoRepository mantenimientoRepository; // Para reportes de mantenimiento
    @Autowired
    private LaboratorioRepository laboratorioRepository; // Para listar laboratorios
    @Autowired
    private CategoriaEquipoRepository categoriaEquipoRepository; // Para listar categorías y filtros

    // Inyección de HorarioLaboratorioRepository
    @Autowired
    private HorarioLaboratorioRepository horarioLaboratorioRepository;


    // --- ENDPOINTS PÚBLICOS ---

    // Endpoint para obtener todos los laboratorios (útil para el selector de laboratorio en reportes)
    // Mapeado a /reportes/laboratorios
    @GetMapping("/laboratorios")
    public ResponseEntity<List<Laboratorio>> getLaboratorios() {
        // Asumiendo que Laboratorio es tu entidad para la tabla LaboratoriosE y tiene un repository
        List<Laboratorio> laboratorios = laboratorioRepository.findAll();
        // Nota: @JsonIgnoreProperties en Laboratorio debe permitir serializar ID, nombre, ubicacion.
        return ResponseEntity.ok(laboratorios);
    }

    // Endpoint para obtener categorías (probablemente para otros reportes/filtros)
    // Mapeado a /reportes/categorias o /reportes/categorias?laboratorioId=X
    @GetMapping("/categorias")
    public ResponseEntity<List<CategoriaEquipo>> getCategoriasByLaboratorio(
            @RequestParam(value = "laboratorioId", required = false) Integer laboratorioId) {

        List<CategoriaEquipo> categorias;
        if (laboratorioId != null) {
            // Asegúrate de que findByLaboratorioId existe en CategoriaEquipoRepository (podría requerir un Join Fetch)
            categorias = categoriaEquipoRepository.findByLaboratorioId(laboratorioId);
        } else {
            categorias = categoriaEquipoRepository.findAll();
        }
        return ResponseEntity.ok(categorias);
    }


    // Método principal para generar reportes (Actualizado el switch case para incluir horario-laboratorio)
    // Mapeado a POST /reportes/generarReporte
    @PostMapping("/generarReporte")
    public ResponseEntity<?> generarReporte(@RequestBody Map<String, Object> reporteRequest) {
        try {
            List<String> reportesSeleccionados = (List<String>) reporteRequest.get("reportes");
            Map<String, Object> filtros = (Map<String, Object>) reporteRequest.get("filtros");
            if (filtros == null) {
                filtros = new HashMap<>();
            }

            Integer usuarioRu = reporteRequest.get("usuarioRu") != null ? (Integer) reporteRequest.get("usuarioRu") : null;

            Map<String, Object> reportesData = new HashMap<>();

            // Itera sobre los reportes seleccionados y llama al método privado correspondiente
            for (String reporteSeleccionado : reportesSeleccionados) {
                switch (reporteSeleccionado) {
                    case "equipos-mas-prestados":
                        reportesData.put("equiposMasPrestados", generarReporteEquiposMasPrestados(filtros));
                        break;
                    case "usuarios-mas-prestaron":
                        reportesData.put("usuariosMasPrestaron", generarReportarUsuariosMasPrestaron(filtros));
                        break;
                    case "prestamos-por-fecha": // Este nombre parece duplicar prestamos-fecha-fecha en el switch, revisar
                        reportesData.put("prestamosPorFecha", generarReportePrestamosPorFecha(filtros));
                        break;
                    case "mantenimientos":
                        reportesData.put("mantenimientos", generarReporteMantenimientos(filtros));
                        break;
                    case "prestamos-fecha-fecha":
                        reportesData.put("prestamosFechaFecha", generarReportePrestamosPorRangoDeFechas(filtros));
                        break;
                    case "administradores-prestamo":
                        reportesData.put("administradoresPrestamo", generarReporteAdministradoresPrestamo(filtros));
                        break;
                    case "sanciones-activas-inactivas":
                        reportesData.put("sancionesActivasInactivas", generarReporteSancionesActivasInactivas(filtros));
                        break;
                    // Casos para reportes ESTADÍSTICOS (Gráficos)
                    // *** ESTOS DEBEN COINCIDIR CON LOS 'value' de tus checkboxes ESTADÍSTICOS en HTML (¡en camelCase!) ***
                    case "equiposMasPrestados": // Debe coincidir con el 'value' del checkbox estadístico en HTML
                        // *** CORRECCIÓN: Llama al método generador y PONE EL RESULTADO DIRECTO en el mapa 'reportesData' ***
                        reportesData.put("equiposMasPrestados", generarReporteEquiposMasPrestados(filtros));
                        break;

                    case "usuariosMasPrestaron": // Debe coincidir con el 'value' del checkbox estadístico en HTML
                        // *** CORRECCIÓN: Llama al método generador y PONE EL RESULTADO DIRECTO en el mapa 'reportesData' ***
                        reportesData.put("usuariosMasPrestaron", generarReportarUsuariosMasPrestaron(filtros));
                        break;
                    // --- Casos para reportes de Usuario ---
                    case "historial-prestamos-usuario":
                        if (usuarioRu != null) {
                            reportesData.put("historialPrestamosUsuario", generarReporteHistorialPrestamosUsuario(usuarioRu, filtros));
                        } else {
                            // Opcional: Lanzar un error si se intenta generar un reporte de usuario sin RU
                            System.err.println("Intento de generar reporte de usuario sin RU: " + reporteSeleccionado);
                            // throw new RuntimeException("El reporte '" + reporteSeleccionado + "' requiere un RU de usuario.");
                        }
                        break;
                    case "sanciones-usuario":
                        if (usuarioRu != null) {
                            reportesData.put("sancionesUsuario", generarReporteSancionesUsuario(usuarioRu, filtros));
                        } else {
                            System.err.println("Intento de generar reporte de usuario sin RU: " + reporteSeleccionado);
                            // throw new RuntimeException("El reporte '" + reporteSeleccionado + "' requiere un RU de usuario.");
                        }
                        break;
                    case "info-usuario":
                        if (usuarioRu != null) {
                            reportesData.put("infoUsuario", generarReporteInfoUsuario(usuarioRu));
                        } else {
                            System.err.println("Intento de generar reporte de usuario sin RU: " + reporteSeleccionado);
                            // throw new RuntimeException("El reporte '" + reporteSeleccionado + "' requiere un RU de usuario.");
                        }
                        break;
                    // --- NUEVO CASE: Para el reporte de horario de laboratorio ---
                    case "horario-laboratorio":
                        // Este reporte usa filtros globales, especialmente el ID del laboratorio y los días
                        reportesData.put("horario-laboratorio", generarReporteHorarioLaboratorio(filtros));
                        break;
                    // --- FIN NUEVO CASE ---

                    default:
                        System.err.println("Reporte seleccionado no reconocido: " + reporteSeleccionado);
                        // Considera lanzar una excepción aquí si un reporte no reconocido es un error grave
                        // throw new RuntimeException("Tipo de reporte no válido: " + reporteSeleccionado);
                        break;
                }
            }
            return ResponseEntity.ok(reportesData);

        } catch (RuntimeException e) {
            // Manejar errores esperados (ej. validación de filtros)
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                    "timestamp", new java.util.Date(), // Usar java.util.Date
                    "status", HttpStatus.BAD_REQUEST.value(),
                    "error", "Bad Request",
                    "message", e.getMessage() // Mostrar el mensaje de la RuntimeException
            ));
        }
        catch (Exception e) {
            // Manejar otros errores inesperados del servidor
            e.printStackTrace(); // Imprimir stack trace en el log del servidor
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "timestamp", new java.util.Date(), // Usar java.util.Date
                    "status", HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "error", "Internal Server Error",
                    "message", "Error inesperado al generar el reporte." // Mensaje genérico para el usuario
            ));
        }
    }


    // --- MÉTODOS PRIVADOS PARA GENERAR REPORTES ---
    // Estos métodos son llamados por generarReporte() según los reportes seleccionados.
    // Cada uno debe retornar un Map<String, Object> con la estructura:
    // { "titulo": "...", "tipo": "tabla"|"lista"|"texto", "cabecera": [...], "datos": [...] }
    // O la estructura correspondiente para tipos no tabulares.


    // Implementación del método de equipos más prestados
    private Map<String, Object> generarReporteEquiposMasPrestados(Map<String, Object> filtros) {
        Integer laboratorioId = null;
        Integer categoriaId = null;
        java.sql.Date fechaInicio = null; // Usar java.sql.Date si tu repositorio lo espera
        java.sql.Date fechaFin = null;
        // Date fechaInicio = null; // Si tu consulta nativa soporta fechas de préstamo
        // Date fechaFin = null;   // Si tu consulta nativa soporta fechas de préstamo

        // --- Extraer y Parsear Filtros Globales (Mejorado el parseo) ---
        // Asegúrate de que las claves aquí ("laboratorio", "categoria", "fechaInicio", "fechaFin")
        // coincidan con las claves que envías desde el frontend en el objeto 'filtros'.
        if (filtros.containsKey("laboratorio") && filtros.get("laboratorio") != null && !filtros.get("laboratorio").toString().isEmpty()) {
            try {
                Object labFilter = filtros.get("laboratorio");
                if (labFilter instanceof Integer) {
                    laboratorioId = (Integer) labFilter;
                } else if (labFilter instanceof String) {
                    String labIdStr = (String) labFilter;
                    if (!labIdStr.isEmpty()){
                        laboratorioId = Integer.parseInt(labIdStr);
                    }
                } else {
                    throw new RuntimeException("Tipo de dato inesperado o formato incorrecto para filtro de laboratorio.");
                }
            } catch (NumberFormatException e) {
                throw new RuntimeException("Formato de ID de Laboratorio global incorrecto.");
            }
        }
        if (filtros.containsKey("categoria") && filtros.get("categoria") != null && !filtros.get("categoria").toString().isEmpty()) {
            try {
                Object catFilter = filtros.get("categoria");
                if (catFilter instanceof Integer) {
                    categoriaId = (Integer) catFilter;
                } else if (catFilter instanceof String) {
                    String catIdStr = (String) catFilter;
                    if (!catIdStr.isEmpty()){
                        categoriaId = Integer.parseInt(catIdStr);
                    }
                } else {
                    throw new RuntimeException("Tipo de dato inesperado o formato incorrecto para filtro de categoría.");
                }
            } catch (NumberFormatException e) {
                throw new RuntimeException("Formato de ID de Categoría global incorrecto.");
            }
        }
        // Nota: Si este reporte soporta filtros de fecha, debes extraerlos aquí también.
        // --- NUEVA LÓGICA para extraer y parsear fechas ---
        if (filtros.containsKey("fechaInicio") && filtros.get("fechaInicio") != null && !filtros.get("fechaInicio").toString().isEmpty()) {
            try {
                // Asume que la fecha llega como String "YYYY-MM-DD"
                fechaInicio = java.sql.Date.valueOf(filtros.get("fechaInicio").toString());
            } catch (IllegalArgumentException e) {
                // Manejar error si el formato de fecha es incorrecto
                throw new RuntimeException("Formato de Fecha de Inicio global incorrecto: " + filtros.get("fechaInicio").toString());
            }
        }
        if (filtros.containsKey("fechaFin") && filtros.get("fechaFin") != null && !filtros.get("fechaFin").toString().isEmpty()) {
            try {
                // Asume que la fecha llega como String "YYYY-MM-DD"
                fechaFin = java.sql.Date.valueOf(filtros.get("fechaFin").toString());
            } catch (IllegalArgumentException e) {
                // Manejar error si el formato de fecha es incorrecto
                throw new RuntimeException("Formato de Fecha de Fin global incorrecto: " + filtros.get("fechaFin").toString());
            }
        }
        // --- FIN NUEVA LÓGICA ---


        // *** Llamar al método del repositorio con los filtros ***
        // ASUME: El método obtenerEquiposMasPrestados en PrestamoRepository
        // ha sido modificado (con @Query nativeQuery=true) para aceptar Integer laboratorioId, Integer categoriaId
        // y que la consulta nativa usa esos parámetros para filtrar los resultados.
        //List<Object[]> resultados = prestamoRepository.obtenerEquiposMasPrestados(laboratorioId, categoriaId);
        // Si tu consulta nativa soporta fechas, pásalos aquí también:
        List<Object[]> resultados = prestamoRepository.obtenerEquiposMasPrestados(laboratorioId, categoriaId, fechaInicio, fechaFin);


        List<Map<String, Object>> datos = new ArrayList<>();
        // Asumiendo que la consulta nativa retorna [nombre_equipo, cantidad_prestada] (Object[0], Object[1])
        for (Object[] resultado : resultados) {
            Map<String, Object> equipo = new HashMap<>();
            // Asegúrate de manejar posibles nulos si la consulta nativa puede retornarlos
            equipo.put("nombre", resultado[0] != null ? resultado[0].toString() : "N/A");
            equipo.put("cantidadPrestada", resultado[1] != null ? resultado[1] : 0); // Debería ser un número
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


    // Implementación del método de usuarios que más prestaron
    private Map<String, Object> generarReportarUsuariosMasPrestaron(Map<String, Object> filtros) { // Corregido nombre si es necesario
        Integer laboratorioId = null;
        Integer categoriaId = null;
        java.sql.Date fechaInicio = null; // Usar java.sql.Date si tu repositorio lo espera
        java.sql.Date fechaFin = null;
        // Date fechaInicio = null; // Si tu consulta nativa soporta fechas de préstamo
        // Date fechaFin = null;   // Si tu consulta nativa soporta fechas de préstamo

        // --- Extraer y Parsear Filtros Globales (Mejorado el parseo) ---
        // Asegúrate de que las claves aquí ("laboratorio", "categoria", "fechaInicio", "fechaFin")
        // coincidan con las claves que envías desde el frontend en el objeto 'filtros'.
        if (filtros.containsKey("laboratorio") && filtros.get("laboratorio") != null && !filtros.get("laboratorio").toString().isEmpty()) {
            try {
                Object labFilter = filtros.get("laboratorio");
                if (labFilter instanceof Integer) {
                    laboratorioId = (Integer) labFilter;
                } else if (labFilter instanceof String) {
                    String labIdStr = (String) labFilter;
                    if (!labIdStr.isEmpty()){
                        laboratorioId = Integer.parseInt(labIdStr);
                    }
                } else {
                    throw new RuntimeException("Tipo de dato inesperado o formato incorrecto para filtro de laboratorio.");
                }
            } catch (NumberFormatException e) {
                throw new RuntimeException("Formato de ID de Laboratorio global incorrecto.");
            }
        }
        if (filtros.containsKey("categoria") && filtros.get("categoria") != null && !filtros.get("categoria").toString().isEmpty()) {
            try {
                Object catFilter = filtros.get("categoria");
                if (catFilter instanceof Integer) {
                    categoriaId = (Integer) catFilter;
                } else if (catFilter instanceof String) {
                    String catIdStr = (String) catFilter;
                    if (!catIdStr.isEmpty()){
                        categoriaId = Integer.parseInt(catIdStr);
                    }
                } else {
                    throw new RuntimeException("Tipo de dato inesperado o formato incorrecto para filtro de categoría.");
                }
            } catch (NumberFormatException e) {
                throw new RuntimeException("Formato de ID de Categoría global incorrecto.");
            }
        }
        // Nota: Si este reporte soporta filtros de fecha, debes extraerlos aquí también.
        // --- NUEVA LÓGICA para extraer y parsear fechas ---
        if (filtros.containsKey("fechaInicio") && filtros.get("fechaInicio") != null && !filtros.get("fechaInicio").toString().isEmpty()) {
            try {
                // Asume que la fecha llega como String "YYYY-MM-DD"
                fechaInicio = java.sql.Date.valueOf(filtros.get("fechaInicio").toString());
            } catch (IllegalArgumentException e) {
                // Manejar error si el formato de fecha es incorrecto
                throw new RuntimeException("Formato de Fecha de Inicio global incorrecto: " + filtros.get("fechaInicio").toString());
            }
        }
        if (filtros.containsKey("fechaFin") && filtros.get("fechaFin") != null && !filtros.get("fechaFin").toString().isEmpty()) {
            try {
                // Asume que la fecha llega como String "YYYY-MM-DD"
                fechaFin = java.sql.Date.valueOf(filtros.get("fechaFin").toString());
            } catch (IllegalArgumentException e) {
                // Manejar error si el formato de fecha es incorrecto
                throw new RuntimeException("Formato de Fecha de Fin global incorrecto: " + filtros.get("fechaFin").toString());
            }
        }
        // --- FIN NUEVA LÓGICA ---

        // *** Llamar al método del repositorio con los filtros ***
        // ASUME: El método obtenerUsuariosMasPrestaron en PrestamoRepository
        // ha sido modificado (con @Query nativeQuery=true) para aceptar Integer laboratorioId, Integer categoriaId
        // y que la consulta nativa usa esos parámetros para filtrar los resultados.
        //List<Object[]> resultados = prestamoRepository.obtenerUsuariosMasPrestaron(laboratorioId, categoriaId);
        // Si tu consulta nativa soporta fechas, pásalos aquí también:
        List<Object[]> resultados = prestamoRepository.obtenerUsuariosMasPrestaron(laboratorioId, categoriaId, fechaInicio, fechaFin);


        List<Map<String, Object>> datos = new ArrayList<>();
        // Asumiendo que la consulta nativa retorna [nombre_usuario, apellido_usuario, cantidad_prestamos]
        for (Object[] resultado : resultados) {
            Map<String, Object> usuario = new HashMap<>();
            // Asegúrate de manejar posibles nulos
            usuario.put("nombre", resultado[0] != null ? resultado[0].toString() : "N/A");
            usuario.put("apellido", resultado[1] != null ? resultado[1].toString() : "N/A");
            usuario.put("cantidadPrestamos", resultado[2] != null ? resultado[2] : 0); // Debería ser un número
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


    // Implementación del método de préstamos por fecha (Probablemente necesite refinarse en el repositorio para usar filtros Lab/Cat)
    private Map<String, Object> generarReportePrestamosPorFecha(Map<String, Object> filtros) {
        Date fechaInicio = null;
        Date fechaFin = null;
        Integer laboratorioId = null;
        Integer categoriaId = null;

        // --- Extraer y Parsear Filtros Globales ---
        // Asegúrate de que las claves aquí ("laboratorio", "categoria", "fechaInicio", "fechaFin")
        // coincidan con las claves que envías desde el frontend en el objeto 'filtros'.
        if (filtros.containsKey("fechaInicio") && filtros.get("fechaInicio") instanceof String && !((String)filtros.get("fechaInicio")).isEmpty()) {
            try {
                fechaInicio = java.sql.Date.valueOf((String)filtros.get("fechaInicio"));
            } catch (IllegalArgumentException e) {
                throw new RuntimeException("Formato de Fecha Inicio global incorrecto. UseYYYY-MM-DD.");
            }
        }
        if (filtros.containsKey("fechaFin") && filtros.get("fechaFin") instanceof String && !((String)filtros.get("fechaFin")).isEmpty()) {
            try {
                fechaFin = java.sql.Date.valueOf((String)filtros.get("fechaFin"));
            } catch (IllegalArgumentException e) {
                throw new RuntimeException("Formato de Fecha Fin global incorrecto. UseYYYY-MM-DD.");
            }
        }
        if (filtros.containsKey("laboratorio") && filtros.get("laboratorio") != null && !filtros.get("laboratorio").toString().isEmpty()) {
            try {
                Object labFilter = filtros.get("laboratorio");
                if (labFilter instanceof Integer) {
                    laboratorioId = (Integer) labFilter;
                } else if (labFilter instanceof String) {
                    String labIdStr = (String) labFilter;
                    if (!labIdStr.isEmpty()){
                        laboratorioId = Integer.parseInt(labIdStr);
                    }
                } else {
                    throw new RuntimeException("Tipo de dato inesperado o formato incorrecto para filtro de laboratorio.");
                }
            } catch (NumberFormatException e) {
                throw new RuntimeException("Formato de ID de Laboratorio global incorrecto.");
            }
        }
        if (filtros.containsKey("categoria") && filtros.get("categoria") != null && !filtros.get("categoria").toString().isEmpty()) {
            try {
                Object catFilter = filtros.get("categoria");
                if (catFilter instanceof Integer) {
                    categoriaId = (Integer) catFilter;
                } else if (catFilter instanceof String) {
                    String catIdStr = (String) catFilter;
                    if (!catIdStr.isEmpty()){
                        categoriaId = Integer.parseInt(catIdStr);
                    }
                } else {
                    throw new RuntimeException("Tipo de dato inesperado o formato incorrecto para filtro de categoría.");
                }
            } catch (NumberFormatException e) {
                throw new RuntimeException("Formato de ID de Categoría global incorrecto.");
            }
        }
        // --- Fin de Extraer y Parsear Filtros Globales ---


        List<Prestamo> prestamos;
        // *** NOTA: Necesitas modificar métodos del repositorio para que acepten filtros combinados ***
        // Lógica para llamar a métodos de PrestamoRepository que usen fechaInicio, fechaFin, laboratorioId, categoriaId
        // Usando solo los filtros de fecha que soporta por defecto JpaRepository si no tienes métodos personalizados:
        if (fechaInicio != null && fechaFin != null) {
            prestamos = prestamoRepository.findByFechaPrestamoBetween(fechaInicio, fechaFin);
        } else if (fechaInicio != null) {
            prestamos = prestamoRepository.findByFechaPrestamoGreaterThanEqual(fechaInicio);
        } else if (fechaFin != null) {
            prestamos = prestamoRepository.findByFechaPrestamoLessThanEqual(fechaFin);
        }
        else {
            // Si no hay fechas, y los métodos de repo no filtran por Lab/Cat, obtendrá todos.
            prestamos = prestamoRepository.findAll();
        }

        List<Map<String, Object>> datos = new ArrayList<>();
        for (Prestamo prestamo : prestamos) {
            Map<String, Object> prestamoData = new HashMap<>();
            // Asegurarse de que las relaciones no sean nulas antes de acceder a propiedades
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

    // Implementación del método de mantenimientos
    private Map<String, Object> generarReporteMantenimientos(Map<String, Object> filtros) {
        Date fechaInicio = null;
        Date fechaFin = null;
        Integer laboratorioId = null;
        Integer categoriaId = null;

        // --- Extraer y Parsear Filtros Globales ---
        // Asegúrate de que las claves aquí ("laboratorio", "categoria", "fechaInicio", "fechaFin")
        // coincidan con las claves que envías desde el frontend en el objeto 'filtros'.
        if (filtros.containsKey("fechaInicio") && filtros.get("fechaInicio") instanceof String && !((String)filtros.get("fechaInicio")).isEmpty()) {
            try {
                fechaInicio = java.sql.Date.valueOf((String)filtros.get("fechaInicio"));
            } catch (IllegalArgumentException e) {
                throw new RuntimeException("Formato de Fecha Inicio global incorrecto. UseYYYY-MM-DD.");
            }
        }
        if (filtros.containsKey("fechaFin") && filtros.get("fechaFin") instanceof String && !((String)filtros.get("fechaFin")).isEmpty()) {
            try {
                fechaFin = java.sql.Date.valueOf((String)filtros.get("fechaFin"));
            } catch (IllegalArgumentException e) {
                throw new RuntimeException("Formato de Fecha Fin global incorrecto. UseYYYY-MM-DD.");
            }
        }
        if (filtros.containsKey("laboratorio") && filtros.get("laboratorio") != null && !filtros.get("laboratorio").toString().isEmpty()) {
            try {
                Object labFilter = filtros.get("laboratorio");
                if (labFilter instanceof Integer) {
                    laboratorioId = (Integer) labFilter;
                } else if (labFilter instanceof String) {
                    String labIdStr = (String) labFilter;
                    if (!labIdStr.isEmpty()){
                        laboratorioId = Integer.parseInt(labIdStr);
                    }
                } else {
                    throw new RuntimeException("Tipo de dato inesperado o formato incorrecto para filtro de laboratorio.");
                }
            } catch (NumberFormatException e) {
                throw new RuntimeException("Formato de ID de Laboratorio global incorrecto.");
            }
        }
        if (filtros.containsKey("categoria") && filtros.get("categoria") != null && !filtros.get("categoria").toString().isEmpty()) {
            try {
                Object catFilter = filtros.get("categoria");
                if (catFilter instanceof Integer) {
                    categoriaId = (Integer) catFilter;
                } else if (catFilter instanceof String) {
                    String catIdStr = (String) catFilter;
                    if (!catIdStr.isEmpty()){
                        categoriaId = Integer.parseInt(catIdStr);
                    }
                } else {
                    throw new RuntimeException("Tipo de dato inesperado o formato incorrecto para filtro de categoría.");
                }
            } catch (NumberFormatException e) {
                throw new RuntimeException("Formato de ID de Categoría global incorrecto.");
            }
        }
        // --- Fin de Extraer y Parsear Filtros Globales ---


        List<Mantenimiento> mantenimientos;
        // *** Llamar al método filtrado del repositorio ***
        // ASUME: findFiltered en MantenimientoRepository existe y usa todos los parámetros.
        mantenimientos = mantenimientoRepository.findFiltered(fechaInicio, fechaFin, laboratorioId, categoriaId);

        List<Map<String, Object>> datos = new ArrayList<>();
        for (Mantenimiento mantenimiento : mantenimientos) {
            Map<String, Object> mantenimientoData = new HashMap<>();
            mantenimientoData.put("idMantenimiento", mantenimiento.getIdMantenimiento());
            // Asegurarse de que las relaciones no sean nulas antes de acceder a propiedades
            mantenimientoData.put("equipo", mantenimiento.getEquipo() != null ? mantenimiento.getEquipo().getNombre() : "N/A");
            mantenimientoData.put("fechaMantenimiento", mantenimiento.getFechaMantenimiento());
            mantenimientoData.put("cantidad", mantenimiento.getCantidad());
            // Nota: estadoInicial, estadoFinal, etc. son parte de DetalleMantenimiento.
            // Si quieres esos detalles, necesitarías cargar los DetalleMantenimiento asociados aquí.
            datos.add(mantenimientoData);
        }
        Map<String, Object> reporte = new HashMap<>();
        reporte.put("titulo", "Reporte de Mantenimientos");
        reporte.put("tipo", "tabla");
        reporte.put("cabecera", Arrays.asList("ID Mantenimiento", "Equipo", "Fecha", "Cantidad"));
        reporte.put("datos", datos);
        return reporte;
    }


    // Implementación del método de préstamos por rango de fechas
    private Map<String, Object> generarReportePrestamosPorRangoDeFechas(Map<String, Object> filtros) {
        Date fechaInicio = null;
        Date fechaFin = null;
        Integer laboratorioId = null;
        Integer categoriaId = null;

        // --- Extraer y Parsear Filtros Globales ---
        // Asegúrate de que las claves aquí ("laboratorio", "categoria", "fechaInicio", "fechaFin")
        // coincidan con las claves que envías desde el frontend en el objeto 'filtros'.
        if (filtros.containsKey("fechaInicio") && filtros.get("fechaInicio") instanceof String && !((String)filtros.get("fechaInicio")).isEmpty()) {
            try {
                fechaInicio = java.sql.Date.valueOf((String)filtros.get("fechaInicio"));
            } catch (IllegalArgumentException e) {
                throw new RuntimeException("Formato de Fecha Inicio global incorrecto. UseYYYY-MM-DD.");
            }
        }
        if (filtros.containsKey("fechaFin") && filtros.get("fechaFin") instanceof String && !((String)filtros.get("fechaFin")).isEmpty()) {
            try {
                fechaFin = java.sql.Date.valueOf((String)filtros.get("fechaFin"));
            } catch (IllegalArgumentException e) {
                throw new RuntimeException("Formato de Fecha Fin global incorrecto. UseYYYY-MM-DD.");
            }
        }
        if (filtros.containsKey("laboratorio") && filtros.get("laboratorio") != null && !filtros.get("laboratorio").toString().isEmpty()) {
            try {
                Object labFilter = filtros.get("laboratorio");
                if (labFilter instanceof Integer) {
                    laboratorioId = (Integer) labFilter;
                } else if (labFilter instanceof String) {
                    String labIdStr = (String) labFilter;
                    if (!labIdStr.isEmpty()){
                        laboratorioId = Integer.parseInt(labIdStr);
                    }
                } else {
                    throw new RuntimeException("Tipo de dato inesperado o formato incorrecto para filtro de laboratorio.");
                }
            } catch (NumberFormatException e) {
                throw new RuntimeException("Formato de ID de Laboratorio global incorrecto.");
            }
        }
        if (filtros.containsKey("categoria") && filtros.get("categoria") != null && !filtros.get("categoria").toString().isEmpty()) {
            try {
                Object catFilter = filtros.get("categoria");
                if (catFilter instanceof Integer) {
                    categoriaId = (Integer) catFilter;
                } else if (catFilter instanceof String) {
                    String catIdStr = (String) catFilter;
                    if (!catIdStr.isEmpty()){
                        categoriaId = Integer.parseInt(catIdStr);
                    }
                } else {
                    throw new RuntimeException("Tipo de dato inesperado o formato incorrecto para filtro de categoría.");
                }
            } catch (NumberFormatException e) {
                throw new RuntimeException("Formato de ID de Categoría global incorrecto.");
            }
        }
        // --- Fin de Extraer y Parsear Filtros Globales ---


        List<Prestamo> prestamos;
        // *** NOTA: Necesitas modificar métodos del repositorio para que acepten filtros combinados ***
        // Lógica para llamar a métodos de PrestamoRepository que usen fechaInicio, fechaFin, laboratorioId, categoriaId
        // Usando solo los filtros de fecha que soporta por defecto JpaRepository si no tienes métodos personalizados:
        if (fechaInicio != null && fechaFin != null) {
            prestamos = prestamoRepository.findByFechaPrestamoBetween(fechaInicio, fechaFin);
        } else if (fechaInicio != null) {
            prestamos = prestamoRepository.findByFechaPrestamoGreaterThanEqual(fechaInicio);
        } else if (fechaFin != null) {
            prestamos = prestamoRepository.findByFechaPrestamoLessThanEqual(fechaFin);
        }
        else {
            // Si no hay fechas, y los métodos de repo no filtran por Lab/Cat, obtendrá todos.
            prestamos = prestamoRepository.findAll();
        }


        List<Map<String, Object>> datos = new ArrayList<>();
        for (Prestamo prestamo : prestamos) {
            Map<String, Object> prestamoData = new HashMap<>();
            // Asegurarse de que las relaciones no sean nulas antes de acceder a propiedades
            prestamoData.put("idPrestamo", prestamo.getIdPrestamo());
            prestamoData.put("usuario", prestamo.getUsuario() != null ? prestamo.getUsuario().getNombre() + " " + prestamo.getUsuario().getApellido() : "N/A");
            prestamoData.put("fechaPrestamo", prestamo.getFechaPrestamo());
            prestamoData.put("horaPrestamo", prestamo.getHoraPrestamo());
            prestamoData.put("administrador", prestamo.getAdministrador() != null ? prestamo.getAdministrador().getUsuario() : "N/A"); // Mostrar usuario del admin
            prestamoData.put("estado", prestamo.getEstado()); // Añadir estado
            prestamoData.put("fechaDevolucionEstimada", prestamo.getFechaDevolucionEstimada()); // Asumiendo Prestamo.getFechaDevolucionEstimada()
            // Opcional: Añadir Lab/Cat del equipo prestado (requiere unir con DetallePrestamo y Equipo)
            // Esto es complejo ya que un préstamo puede tener varios equipos de diferentes labs/cats.
            // Si es relevante, deberías generar filas por detalle de préstamo en lugar de por préstamo.
            datos.add(prestamoData);
        }
        Map<String, Object> reporte = new HashMap<>();
        reporte.put("titulo", "Préstamos por Rango de Fechas");
        reporte.put("tipo", "tabla");
        // Asegúrate de que esta cabecera coincida con las claves que pones en 'datos'
        reporte.put("cabecera", Arrays.asList("ID Préstamo", "Usuario", "Fecha Préstamo","Hora Préstamo", "Administrador", "Estado", "Fecha Devolución Estimada"));
        reporte.put("datos", datos);
        return reporte;
    }

    // Implementación del método de administradores que prestaron
    private Map<String, Object> generarReporteAdministradoresPrestamo(Map<String, Object> filtros) {
        Date fechaInicio = null;
        Date fechaFin = null;
        Integer laboratorioId = null;
        Integer categoriaId = null;

        // --- Extraer y Parsear Filtros Globales ---
        // Asegúrate de que las claves aquí ("laboratorio", "categoria", "fechaInicio", "fechaFin")
        // coincidan con las claves que envías desde el frontend en el objeto 'filtros'.
        if (filtros.containsKey("fechaInicio") && filtros.get("fechaInicio") instanceof String && !((String)filtros.get("fechaInicio")).isEmpty()) {
            try {
                fechaInicio = java.sql.Date.valueOf((String)filtros.get("fechaInicio"));
            } catch (IllegalArgumentException e) {
                throw new RuntimeException("Formato de Fecha Inicio global incorrecto. UseYYYY-MM-DD.");
            }
        }
        if (filtros.containsKey("fechaFin") && filtros.get("fechaFin") instanceof String && !((String)filtros.get("fechaFin")).isEmpty()) {
            try {
                fechaFin = java.sql.Date.valueOf((String)filtros.get("fechaFin"));
            } catch (IllegalArgumentException e) {
                throw new RuntimeException("Formato de Fecha Fin global incorrecto. UseYYYY-MM-DD.");
            }
        }
        if (filtros.containsKey("laboratorio") && filtros.get("laboratorio") != null && !filtros.get("laboratorio").toString().isEmpty()) {
            try {
                Object labFilter = filtros.get("laboratorio");
                if (labFilter instanceof Integer) {
                    laboratorioId = (Integer) labFilter;
                } else if (labFilter instanceof String) {
                    String labIdStr = (String) labFilter;
                    if (!labIdStr.isEmpty()){
                        laboratorioId = Integer.parseInt(labIdStr);
                    }
                } else {
                    throw new RuntimeException("Tipo de dato inesperado o formato incorrecto para filtro de laboratorio.");
                }
            } catch (NumberFormatException e) {
                throw new RuntimeException("Formato de ID de Laboratorio global incorrecto.");
            }
        }
        if (filtros.containsKey("categoria") && filtros.get("categoria") != null && !filtros.get("categoria").toString().isEmpty()) {
            try {
                Object catFilter = filtros.get("categoria");
                if (catFilter instanceof Integer) {
                    categoriaId = (Integer) catFilter;
                } else if (catFilter instanceof String) {
                    String catIdStr = (String) catFilter;
                    if (!catIdStr.isEmpty()){
                        categoriaId = Integer.parseInt(catIdStr);
                    }
                } else {
                    throw new RuntimeException("Tipo de dato inesperado o formato incorrecto para filtro de categoría.");
                }
            } catch (NumberFormatException e) {
                throw new RuntimeException("Formato de ID de Categoría global incorrecto.");
            }
        }
        // --- Fin de Extraer y Parsear Filtros Globales ---


        // Este reporte probablemente quiere AGREGAR préstamos por administrador, no listar todos.
        // Necesitarías una consulta nativa o JPQL que agrupe por administrador y cuente préstamos.
        // Ejemplo:
        // List<Object[]> resultados = prestamoRepository.countPrestamosByAdministrador(fechaInicio, fechaFin, laboratorioId, categoriaId);

        // Si tu reporte es solo una lista de *préstamos* mostrando qué administrador los hizo (como sugiere tu código actual):
        List<Prestamo> prestamos;
        // Similar a otros reportes, necesitas métodos filtrados en PrestamoRepository
        if (fechaInicio != null && fechaFin != null) {
            prestamos = prestamoRepository.findByFechaPrestamoBetween(fechaInicio, fechaFin); // No filtra por admin por defecto
        } else {
            prestamos = prestamoRepository.findAll(); // Tampoco filtra por admin por defecto
        }


        List<Map<String, Object>> datos = new ArrayList<>();
        for (Prestamo prestamo : prestamos) {
            Map<String, Object> prestamoData = new HashMap<>();
            // Asegurarse de que las relaciones no sean nulas
            // Asumiendo que Administrador tiene getUsuario() que es el nombre de login (o getNombre() si aplica)
            prestamoData.put("administrador", prestamo.getAdministrador() != null ? prestamo.getAdministrador().getUsuario() : "N/A"); // Mostrar usuario del admin
            prestamoData.put("fechaPrestamo", prestamo.getFechaPrestamo());
            prestamoData.put("horaPrestamo", prestamo.getHoraPrestamo());
            prestamoData.put("usuario", prestamo.getUsuario() != null ? prestamo.getUsuario().getNombre() +" "+ prestamo.getUsuario().getApellido() : "N/A");
            // Opcional: Añadir Lab/Cat del equipo prestado
            datos.add(prestamoData);
        }
        Map<String, Object> reporte = new HashMap<>();
        // El título debería reflejar si es un conteo o una lista
        reporte.put("titulo", "Préstamos Realizados por Administrador"); // Ajusta el título

        reporte.put("tipo", "tabla");
        // Asegúrate de que esta cabecera coincida con las claves que pones en 'datos'
        reporte.put("cabecera", Arrays.asList("Administrador", "Fecha Préstamo","Hora Préstamo", "Usuario"));
        reporte.put("datos", datos);
        return reporte;
    }

    // Implementación del método de sanciones activas/inactivas
    private Map<String, Object> generarReporteSancionesActivasInactivas(Map<String, Object> filtros) {
        // Este reporte probablemente solo lista, pero si quisieras filtrar por fecha, lab, cat
        // deberías añadir lógica de extracción de filtros aquí y modificar el repositorio.

        // Acepta filtros, pero no se usan lógicamente para este reporte de listado general de todas las sanciones
        List<Sancion> todasLasSanciones = sancionRepository.findAll(); // Obtener todas las sanciones

        List<Map<String, Object>> datos = new ArrayList<>();

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
        reporte.put("tipo", "tabla");
        reporte.put("cabecera", Arrays.asList("ID Sanción", "Usuario", "Motivo de Sanción", "Fecha de Sanción", "Estado"));
        reporte.put("datos", datos);

        // Opcional: Si quieres añadir el conteo resumen como parte de este reporte
        // long activas = todasLasSanciones.stream().filter(s -> "activa".equals(s.getEstado())).count();
        // long inactivas = todasLasSanciones.stream().filter(s -> "inactiva".equals(s.getEstado())).count();
        // reporte.put("conteoResumen", "Total Activas: " + activas + ", Total Inactivas: " + inactivas);


        return reporte;
    }

    // Implementación de métodos para reportes de Usuario (Historial, Sanciones, Info)

    private Map<String, Object> generarReporteHistorialPrestamosUsuario(int ru, Map<String, Object> filtros) {
        Usuario usuario = usuarioRepository.findByRu(ru).orElse(null);
        if (usuario == null) {
            throw new RuntimeException("Usuario no encontrado con RU: " + ru);
        }
        Date fechaInicio = null;
        Date fechaFin = null;
        String estado = null; // Variable para el estado del préstamo

        // --- Extraer y Parsear Filtros (específicos de usuario) ---
        // Asegúrate de que las claves aquí ("estadoPrestamoUsuario", "fechaInicioPrestamosUsuario", etc.)
        // coincidan con las claves que envías desde el frontend en el objeto 'filtros'.
        if (filtros.containsKey("estadoPrestamoUsuario") && filtros.get("estadoPrestamoUsuario") instanceof String && !((String) filtros.get("estadoPrestamoUsuario")).isEmpty()) {
            estado = (String) filtros.get("estadoPrestamoUsuario");
        }

        if (filtros.containsKey("fechaInicioPrestamosUsuario") && filtros.get("fechaInicioPrestamosUsuario") instanceof String && !((String)filtros.get("fechaInicioPrestamosUsuario")).isEmpty()) {
            try {
                fechaInicio = java.sql.Date.valueOf((String)filtros.get("fechaInicioPrestamosUsuario"));
            } catch (IllegalArgumentException e) {
                throw new RuntimeException("Formato de fecha de inicio del historial de préstamos incorrecto. UseYYYY-MM-DD.");
            }
        }
        if (filtros.containsKey("fechaFinPrestamosUsuario") && filtros.get("fechaFinPrestamosUsuario") instanceof String && !((String)filtros.get("fechaFinPrestamosUsuario")).isEmpty()) {
            try {
                fechaFin = java.sql.Date.valueOf((String)filtros.get("fechaFinPrestamosUsuario"));
            } catch (IllegalArgumentException e) {
                throw new RuntimeException("Formato de fecha de fin del historial de préstamos incorrecto. UseYYYY-MM-DD.");
            }
        }
        // --- Fin de Extraer y Parsear Filtros ---

        // Lógica para llamar a diferentes métodos del repositorio según los filtros combinados
        List<Prestamo> prestamos;
        // Necesitas métodos en PrestamoRepository que combinen buscar por Usuario Y los filtros de fecha/estado.
        // Implementación actual (llamando a métodos que probablemente no filtran por todas las combinaciones):
        if (fechaInicio != null && fechaFin != null && estado != null) {
            // ASUME: findByUsuarioAndFechaPrestamoBetweenAndEstado existe y filtra por los 4 parámetros
            prestamos = prestamoRepository.findByUsuarioAndFechaPrestamoBetweenAndEstado(usuario, fechaInicio, fechaFin, estado);
        } else if (fechaInicio != null && fechaFin != null){
            // ASUME: findByUsuarioAndFechaPrestamoBetween existe y filtra por Usuario y fechas
            prestamos = prestamoRepository.findByUsuarioAndFechaPrestamoBetween(usuario, fechaInicio, fechaFin);
        } else if (fechaInicio != null && estado != null){
            // ASUME: findByUsuarioAndFechaPrestamoGreaterThanEqualAndEstado existe y filtra por Usuario, fecha inicio y estado
            prestamos = prestamoRepository.findByUsuarioAndFechaPrestamoGreaterThanEqualAndEstado(usuario, fechaInicio, estado);
        } else if (fechaFin != null && estado != null){
            // ASUME: findByUsuarioAndFechaPrestamoLessThanEqualAndEstado existe y filtra por Usuario, fecha fin y estado
            prestamos = prestamoRepository.findByUsuarioAndFechaPrestamoLessThanEqualAndEstado(usuario, fechaFin, estado);
        } else if (fechaInicio != null) {
            // ASUME: findByUsuarioAndFechaPrestamoGreaterThanEqual existe y filtra por Usuario y fecha inicio
            prestamos = prestamoRepository.findByUsuarioAndFechaPrestamoGreaterThanEqual(usuario, fechaInicio);
        } else if (fechaFin != null) {
            // ASUME: findByUsuarioAndFechaPrestamoLessThanEqual existe y filtra por Usuario y fecha fin
            prestamos = prestamoRepository.findByUsuarioAndFechaPrestamoLessThanEqual(usuario, fechaFin);
        } else if (estado != null){
            // ASUME: findByUsuarioAndEstado existe y filtra por Usuario y estado
            prestamos = prestamoRepository.findByUsuarioAndEstado(usuario, estado);
        }
        else {
            // ASUME: findByUsuario existe y filtra solo por Usuario
            prestamos = prestamoRepository.findByUsuario(usuario); // Método base solo por usuario
        }


        List<Map<String, Object>> datos = new ArrayList<>();
        for (Prestamo prestamo : prestamos) {
            Map<String, Object> prestamoData = new HashMap<>();
            prestamoData.put("idPrestamo", prestamo.getIdPrestamo());
            prestamoData.put("fechaPrestamo", prestamo.getFechaPrestamo());
            prestamoData.put("horaPrestamo", prestamo.getHoraPrestamo());
            prestamoData.put("estado", prestamo.getEstado());
            prestamoData.put("fechaDevolucionEstimada", prestamo.getFechaDevolucionEstimada()); // Asumiendo Prestamo.getFechaDevolucionEstimada()
            // Opcional: Añadir detalles de equipo del préstamo si es necesario (requiere unir con DetallePrestamo)
            datos.add(prestamoData);
        }
        Map<String, Object> reporte = new HashMap<>();
        reporte.put("titulo", "Historial de Préstamos del Usuario " + (usuario != null ? usuario.getNombre() + " " + usuario.getApellido() : ""));
        reporte.put("tipo", "tabla");
        reporte.put("cabecera", Arrays.asList("ID Préstamo", "Fecha Préstamo", "Hora Préstamo","Estado", "Fecha Devolución Estimada"));
        reporte.put("datos", datos);
        return reporte;
    }

    private Map<String, Object> generarReporteSancionesUsuario(int ru, Map<String, Object> filtros) {
        Usuario usuario = usuarioRepository.findByRu(ru).orElse(null);
        if (usuario == null) {
            throw new RuntimeException("Usuario no encontrado con RU: " + ru);
        }

        Date fechaInicio = null;
        Date fechaFin = null;
        String estado = null; // Variable para el estado de la sanción

        // --- Extraer y Parsear Filtros (específicos de usuario) ---
        // Asegúrate de que las claves aquí ("estadoSancionUsuario", "fechaInicioSancionesUsuario", etc.)
        // coincidan con las claves que envías desde el frontend en el objeto 'filtros'.
        if (filtros.containsKey("estadoSancionUsuario") && filtros.get("estadoSancionUsuario") instanceof String && !((String) filtros.get("estadoSancionUsuario")).isEmpty()) {
            estado = (String) filtros.get("estadoSancionUsuario");
        }

        if (filtros.containsKey("fechaInicioSancionesUsuario") && filtros.get("fechaInicioSancionesUsuario") instanceof String && !((String)filtros.get("fechaInicioSancionesUsuario")).isEmpty()) {
            try {
                fechaInicio = java.sql.Date.valueOf((String)filtros.get("fechaInicioSancionesUsuario"));
            } catch (IllegalArgumentException e) {
                throw new RuntimeException("Formato de fecha de inicio de sanciones incorrecto. UseYYYY-MM-DD.");
            }
        }
        if (filtros.containsKey("fechaFinSancionesUsuario") && filtros.get("fechaFinSancionesUsuario") instanceof String && !((String)filtros.get("fechaFinSancionesUsuario")).isEmpty()) {
            try {
                fechaFin = java.sql.Date.valueOf((String)filtros.get("fechaFinSancionesUsuario"));
            } catch (IllegalArgumentException e) {
                throw new RuntimeException("Formato de fecha de fin de sanciones incorrecto. UseYYYY-MM-DD.");
            }
        }
        // --- Fin de Extraer y Parsear Filtros ---

        // Lógica para llamar a diferentes métodos del repositorio según los filtros combinados
        List<Sancion> sanciones;
        // Necesitas métodos en SancionRepository que combinen buscar por Usuario Y los filtros de fecha/estado.
        // Implementación actual (llamando a métodos que probablemente no filtran por todas las combinaciones):
        if (fechaInicio != null && fechaFin != null && estado != null) {
            // ASUME: findByUsuarioAndFechaSancionBetweenAndEstado existe y filtra por los 4 parámetros
            sanciones = sancionRepository.findByUsuarioAndFechaSancionBetweenAndEstado(usuario, fechaInicio, fechaFin, estado);
        } else if (fechaInicio != null && fechaFin != null){
            // ASUME: findByUsuarioAndFechaSancionBetween existe y filtra por Usuario y fechas
            sanciones = sancionRepository.findByUsuarioAndFechaSancionBetween(usuario, fechaInicio, fechaFin);
        } else if (fechaInicio != null && estado != null){
            // ASUME: findByUsuarioAndFechaSancionGreaterThanEqualAndEstado existe y filtra por Usuario, fecha inicio y estado
            sanciones = sancionRepository.findByUsuarioAndFechaSancionGreaterThanEqualAndEstado(usuario, fechaInicio, estado);
        } else if (fechaFin != null && estado != null){
            // ASUME: findByUsuarioAndFechaSancionLessThanEqualAndEstado existe y filtra por Usuario, fecha fin y estado
            sanciones = sancionRepository.findByUsuarioAndFechaSancionLessThanEqualAndEstado(usuario, fechaFin, estado);
        } else if (fechaInicio != null) {
            // ASUME: findByUsuarioAndFechaSancionGreaterThanEqual existe y filtra por Usuario y fecha inicio
            sanciones = sancionRepository.findByUsuarioAndFechaSancionGreaterThanEqual(usuario, fechaInicio);
        } else if (fechaFin != null) {
            // ASUME: findByUsuarioAndFechaSancionLessThanEqual existe y filtra por Usuario y fecha fin
            sanciones = sancionRepository.findByUsuarioAndFechaSancionLessThanEqual(usuario, fechaFin);
        } else if (estado != null){
            // ASUME: findByUsuarioAndEstado existe y filtra por Usuario y estado
            sanciones = sancionRepository.findByUsuarioAndEstado(usuario, estado);
        }
        else {
            // ASUME: findByUsuario existe y filtra solo por Usuario
            sanciones = sancionRepository.findByUsuario(usuario); // Método base solo por usuario
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
        reporte.put("cabecera", Arrays.asList("ID Sanción", "Motivo de Sanción", "Fecha de Sanción", "Estado"));
        reporte.put("datos", datos);
        return reporte;
    }

    private Map<String, Object> generarReporteInfoUsuario(int ru) {
        Usuario usuario = usuarioRepository.findByRu(ru).orElse(null);
        if (usuario == null) {
            throw new RuntimeException("Usuario no encontrado con RU: " + ru);
        }
        Map<String, Object> reporte = new HashMap<>();
        reporte.put("titulo", "Información del Usuario");
        reporte.put("tipo", "texto"); // Tipo "texto" para este reporte

        StringBuilder datosUsuario = new StringBuilder();
        datosUsuario.append("Nombre: ").append(usuario.getNombre()).append("\n");
        datosUsuario.append("Apellido: ").append(usuario.getApellido()).append("\n");
        datosUsuario.append("RU: ").append(usuario.getRu()).append("\n");
        datosUsuario.append("CI: ").append(usuario.getCi()).append("\n");
        datosUsuario.append("Email: ").append(usuario.getCorreo()).append("\n");

        if (usuario.getCarrera() != null && !usuario.getCarrera().isEmpty()) {
            datosUsuario.append("Carrera: ").append(usuario.getCarrera()).append("\n");
        }
        if (usuario.getTelefono() != null && usuario.getTelefono().trim().length() > 0) {
            datosUsuario.append("Teléfono: ").append(usuario.getTelefono()).append("\n");
        }
        if (usuario.getMateria() != null && usuario.getMateria().trim().length() > 0) {
            datosUsuario.append("Materia: ").append(usuario.getMateria()).append("\n");
        }
        if (usuario.getParalelo() != null && usuario.getParalelo().trim().length() > 0) {
            datosUsuario.append("Paralelo: ").append(usuario.getParalelo()).append("\n");
        }
        if (usuario.getSemestre() != null && usuario.getSemestre().trim().length() > 0) {
            datosUsuario.append("Semestre: ").append(usuario.getSemestre()).append("\n");
        }
        reporte.put("datos", datosUsuario.toString());

        return reporte;
    }

    // --- MÉTODO PRIVADO: Para generar el reporte de horario de laboratorio (MODIFICADO para filtro de días) ---
    // Este método va aquí, junto con los otros métodos privados después del método público generarReporte().
    private Map<String, Object> generarReporteHorarioLaboratorio(Map<String, Object> filtros) {
        Integer laboratorioId = null;
        List<String> diasSemanaStr = null; // Variable para los días como strings recibidos del frontend
        List<DiaSemana> diasSemanaEnum = null; // Variable para los días como ENUMs para el repositorio

        // Extraer y parsear el filtro de Laboratorio
        if (filtros.containsKey("laboratorio") && filtros.get("laboratorio") != null && !filtros.get("laboratorio").toString().isEmpty()) {
            try {
                Object labFilter = filtros.get("laboratorio");
                if (labFilter instanceof Integer) {
                    laboratorioId = (Integer) labFilter;
                } else if (labFilter instanceof String) {
                    String labIdStr = (String) labFilter;
                    if (!labIdStr.isEmpty()){
                        laboratorioId = Integer.parseInt(labIdStr);
                    }
                } else {
                    throw new RuntimeException("Tipo de dato inesperado o formato incorrecto para filtro de laboratorio.");
                }
            } catch (NumberFormatException e) {
                throw new RuntimeException("Formato de ID de Laboratorio global incorrecto para reporte de horario.");
            }
        }

        // Validar que se proporcionó un ID de laboratorio (es obligatorio para este reporte)
        if (laboratorioId == null) {
            throw new RuntimeException("Se debe seleccionar un Laboratorio para generar el Reporte de Horario.");
        }

        // Opcional: Verificar si el laboratorio con este ID realmente existe
        Optional<Laboratorio> laboratorioOpt = laboratorioRepository.findById(laboratorioId);
        if (!laboratorioOpt.isPresent()) {
            throw new RuntimeException("Laboratorio con ID " + laboratorioId + " no encontrado para reporte de horario.");
        }
        Laboratorio laboratorio = laboratorioOpt.get();


        // --- NUEVO: Extraer y procesar filtro de Días de la Semana ---
        // La clave 'diasSemana' debe coincidir con la clave usada en el frontend para este filtro.
        if (filtros.containsKey("diasSemana") && filtros.get("diasSemana") instanceof List) {
            diasSemanaStr = (List<String>) filtros.get("diasSemana");
            // Convertir la lista de strings a una lista de ENUMs DiaSemana
            if (diasSemanaStr != null && !diasSemanaStr.isEmpty()) {
                try {
                    diasSemanaEnum = diasSemanaStr.stream()
                            .map(String::toUpperCase) // Asegurarse de que estén en mayúsculas para coincidir con el ENUM
                            .map(DiaSemana::valueOf) // Convertir String a ENUM
                            .collect(Collectors.toList());
                } catch (IllegalArgumentException e) {
                    // Esto ocurrirá si un string de día no coincide con un valor del ENUM DiaSemana
                    throw new RuntimeException("Valor de día de la semana no válido encontrado en los filtros: " + e.getMessage());
                }
            }
        }
        // --- FIN NUEVO ---


        // Consultar el repositorio, usando el nuevo método si hay días seleccionados
        List<HorarioLaboratorio> horarioList;
        if (diasSemanaEnum != null && !diasSemanaEnum.isEmpty()) {
            // Usar el método que filtra por laboratorio Y días
            horarioList = horarioLaboratorioRepository.findByLaboratorioIdLaboratorioAndDiaSemanaInOrderByDiaSemanaAscHoraInicioAsc(laboratorioId, diasSemanaEnum);
        } else {
            // Si no se seleccionaron días, usar el método existente que filtra solo por laboratorio
            horarioList = horarioLaboratorioRepository.findByLaboratorioIdLaboratorioOrderByDiaSemanaAscHoraInicioAsc(laboratorioId);
        }


        // Preparar los datos en el formato esperado por el frontend (lista de mapas)
        List<Map<String, Object>> datos = new ArrayList<>();
        for (HorarioLaboratorio horario : horarioList) {
            Map<String, Object> horarioData = new HashMap<>();
            horarioData.put("diaSemana", horario.getDiaSemana() != null ? horario.getDiaSemana().toString() : "N/A"); // Convertir Enum a String
            horarioData.put("horaInicio", horario.getHoraInicio());
            horarioData.put("horaFin", horario.getHoraFin());
            horarioData.put("ocupado", horario.isOcupado());
            datos.add(horarioData);
        }

        Map<String, Object> reporte = new HashMap<>();
        reporte.put("titulo", "Horario Agendado de: " + laboratorio.getNombre());
        reporte.put("tipo", "tabla");
        reporte.put("cabecera", Arrays.asList("Día", "Hora Inicio", "Hora Fin", "Estado"));
        reporte.put("datos", datos);

        return reporte;
    }
    // --- FIN MÉTODO MODIFICADO ---

}