package com.proyecto.sistema.controller;

import com.proyecto.sistema.model.*;
import com.proyecto.sistema.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.stream.Collectors;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.*;
import java.util.HashMap;
import java.util.Map;


@RestController
@RequestMapping("/mantenimiento")
public class MantenimientoController {
    @Autowired
    private MantenimientoRepository mantenimientoRepository;

    @Autowired
    private DetalleMantenimientoRepository detalleMantenimientoRepository;

    @GetMapping
    public ResponseEntity<Object> obtenerMantenimientos()
    {
        try {
            List<Mantenimiento> mantenimientos = mantenimientoRepository.findAll();
            List<Map<String, Object>> response = mantenimientos.stream().map(m -> {
                Map<String, Object> mantenimientoMap = new HashMap<>();
                mantenimientoMap.put("idMantenimiento", m.getIdMantenimiento());
                mantenimientoMap.put("fechaMantenimiento", m.getFechaMantenimiento());
                mantenimientoMap.put("cantidad", m.getCantidad());

                if (m.getEquipo() != null) {
                    Map<String, Object> equipoMap = new HashMap<>();
                    equipoMap.put("idEquipo", m.getEquipo().getIdEquipo());

                    equipoMap.put("nombreEquipo", m.getEquipo().getNombre());
                    mantenimientoMap.put("equipo", equipoMap);
                }

                return mantenimientoMap;
            }).collect(Collectors.toList());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error al obtener los mantenimientos: " + e.getMessage());
        }

    }

    @PostMapping
    public ResponseEntity<?> agregarMantenimiento(@RequestBody Map<String, Object> request) {
        try {
            // Validar datos requeridos
            if (!request.containsKey("equipo") || !request.containsKey("fechaMantenimiento") ||
                    !request.containsKey("cantidad") || !request.containsKey("detalles")) {
                return new ResponseEntity<>("Faltan campos requeridos", HttpStatus.BAD_REQUEST);
            }

            // 1. Crear y guardar el mantenimiento principal
            Mantenimiento mantenimiento = new Mantenimiento();

            try {
                // Convertir y establecer el equipo
                @SuppressWarnings("unchecked")
                Map<String, Object> equipoMap = (Map<String, Object>) request.get("equipo");
                if (!equipoMap.containsKey("id")) {
                    return new ResponseEntity<>("ID de equipo no proporcionado", HttpStatus.BAD_REQUEST);
                }
                Equipo equipo = new Equipo();
                equipo.setIdEquipo(((Number) equipoMap.get("id")).intValue());
                mantenimiento.setEquipo(equipo);

                // Convertir la fecha de String a Date
                String fechaStr = (String) request.get("fechaMantenimiento");
                try {
                    SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd");
                    Date fecha = dateFormat.parse(fechaStr);
                    mantenimiento.setFechaMantenimiento(fecha);
                } catch (ParseException e) {
                    return new ResponseEntity<>("Formato de fecha inválido. Use yyyy-MM-dd",
                            HttpStatus.BAD_REQUEST);
                }

                // Convertir y establecer la cantidad
                mantenimiento.setCantidad(((Number) request.get("cantidad")).intValue());
                if (mantenimiento.getCantidad() <= 0) {
                    return new ResponseEntity<>("La cantidad debe ser mayor a 0", HttpStatus.BAD_REQUEST);
                }

            } catch (Exception e) {
                return new ResponseEntity<>("Error en el formato de los datos: " + e.getMessage(),
                        HttpStatus.BAD_REQUEST);
            }


            Mantenimiento mantenimientoGuardado = mantenimientoRepository.save(mantenimiento);

            // 2. Crear los detalles basados en la cantidad
            List<DetalleMantenimiento> detalles = new ArrayList<>();
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> detallesRequest = (List<Map<String, Object>>) request.get("detalles");

            if (detallesRequest == null || detallesRequest.size() != mantenimiento.getCantidad()) {
                return new ResponseEntity<>("La cantidad de detalles no coincide con la cantidad especificada",
                        HttpStatus.BAD_REQUEST);
            }

            for (Map<String, Object> detalleData : detallesRequest) {
                if (!detalleData.containsKey("instanciaEquipo") || !detalleData.containsKey("estadoInicial") ||
                        !detalleData.containsKey("estadoFinal") || !detalleData.containsKey("problema") ||
                        !detalleData.containsKey("solucion") || !detalleData.containsKey("fase")) {
                    return new ResponseEntity<>("Faltan campos requeridos en los detalles",
                            HttpStatus.BAD_REQUEST);
                }

                DetalleMantenimiento detalle = new DetalleMantenimiento();
                detalle.setMantenimiento(mantenimientoGuardado);

                try {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> instanciaMap = (Map<String, Object>) detalleData.get("instanciaEquipo");
                    if (!instanciaMap.containsKey("id")) {
                        return new ResponseEntity<>("ID de instancia de equipo no proporcionado",
                                HttpStatus.BAD_REQUEST);
                    }
                    InstanciaEquipo instancia = new InstanciaEquipo();
                    instancia.setIdInstancia(((Number) instanciaMap.get("id")).intValue());
                    detalle.setInstanciaEquipo(instancia);

                    detalle.setEstadoInicial((String) detalleData.get("estadoInicial"));
                    detalle.setEstadoFinal((String) detalleData.get("estadoFinal"));
                    detalle.setProblema((String) detalleData.get("problema"));
                    detalle.setSolucion((String) detalleData.get("solucion"));
                    detalle.setFase((String) detalleData.get("fase"));

                    if (detalle.getEstadoInicial().isEmpty() || detalle.getEstadoFinal().isEmpty() ||
                            detalle.getProblema().isEmpty() || detalle.getSolucion().isEmpty() ||
                            detalle.getFase().isEmpty()) {
                        return new ResponseEntity<>("Los campos de detalle no pueden estar vacíos",
                                HttpStatus.BAD_REQUEST);
                    }

                    detalles.add(detalleMantenimientoRepository.save(detalle));
                } catch (Exception e) {
                    return new ResponseEntity<>("Error en el formato de los detalles: " + e.getMessage(),
                            HttpStatus.BAD_REQUEST);
                }
            }

            Map<String, Object> response = Map.of(
                    "mantenimiento", mantenimientoGuardado,
                    "detalles", detalles
            );

            return new ResponseEntity<>(response, HttpStatus.CREATED);
        } catch (Exception e) {
            return new ResponseEntity<>("Error al crear el mantenimiento: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> actualizarMantenimiento(
            @PathVariable("id") int id,
            @RequestBody Map<String, Object> request) {
        Optional<Mantenimiento> mantenimientoData = mantenimientoRepository.findById(id);

        if (!mantenimientoData.isPresent()) {
            return new ResponseEntity<>("Mantenimiento no encontrado", HttpStatus.NOT_FOUND);
        }

        try {
            if (!request.containsKey("equipo") || !request.containsKey("fechaMantenimiento") ||
                    !request.containsKey("cantidad") || !request.containsKey("detalles")) {
                return new ResponseEntity<>("Faltan campos requeridos", HttpStatus.BAD_REQUEST);
            }

            Mantenimiento mantenimiento = mantenimientoData.get();

            try {
                @SuppressWarnings("unchecked")
                Map<String, Object> equipoMap = (Map<String, Object>) request.get("equipo");
                if (!equipoMap.containsKey("id")) {
                    return new ResponseEntity<>("ID de equipo no proporcionado", HttpStatus.BAD_REQUEST);
                }
                Equipo equipo = new Equipo();
                equipo.setIdEquipo(((Number) equipoMap.get("id")).intValue());
                mantenimiento.setEquipo(equipo);

                String fechaStr = (String) request.get("fechaMantenimiento");
                try {
                    SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd");
                    Date fecha = dateFormat.parse(fechaStr);
                    mantenimiento.setFechaMantenimiento(fecha);
                } catch (ParseException e) {
                    return new ResponseEntity<>("Formato de fecha inválido. Use yyyy-MM-dd",
                            HttpStatus.BAD_REQUEST);
                }

                mantenimiento.setCantidad(((Number) request.get("cantidad")).intValue());
                if (mantenimiento.getCantidad() <= 0) {
                    return new ResponseEntity<>("La cantidad debe ser mayor a 0", HttpStatus.BAD_REQUEST);
                }


            } catch (Exception e) {
                return new ResponseEntity<>("Error en el formato de los datos: " + e.getMessage(),
                        HttpStatus.BAD_REQUEST);
            }

            Mantenimiento mantenimientoActualizado = mantenimientoRepository.save(mantenimiento);

            List<DetalleMantenimiento> detallesActualizados = new ArrayList<>();
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> detallesRequest = (List<Map<String, Object>>) request.get("detalles");

            if (detallesRequest == null || detallesRequest.size() != mantenimiento.getCantidad()) {
                return new ResponseEntity<>("La cantidad de detalles no coincide con la cantidad especificada",
                        HttpStatus.BAD_REQUEST);
            }

            for (Map<String, Object> detalleData : detallesRequest) {
                if (!detalleData.containsKey("instanciaEquipo") || !detalleData.containsKey("estadoInicial") ||
                        !detalleData.containsKey("estadoFinal") || !detalleData.containsKey("problema") ||
                        !detalleData.containsKey("solucion") || !detalleData.containsKey("fase")) {
                    return new ResponseEntity<>("Faltan campos requeridos en los detalles",
                            HttpStatus.BAD_REQUEST);
                }

                try {
                    DetalleMantenimiento detalle;
                    if (detalleData.containsKey("idDetalleMant")) {
                        detalle = detalleMantenimientoRepository
                                .findById(((Number) detalleData.get("idDetalleMant")).intValue())
                                .orElse(new DetalleMantenimiento());
                    } else {
                        detalle = new DetalleMantenimiento();
                    }

                    detalle.setMantenimiento(mantenimientoActualizado);

                    @SuppressWarnings("unchecked")
                    Map<String, Object> instanciaMap = (Map<String, Object>) detalleData.get("instanciaEquipo");
                    if (!instanciaMap.containsKey("id")) {
                        return new ResponseEntity<>("ID de instancia de equipo no proporcionado",
                                HttpStatus.BAD_REQUEST);
                    }
                    InstanciaEquipo instancia = new InstanciaEquipo();
                    instancia.setIdInstancia(((Number) instanciaMap.get("id")).intValue());
                    detalle.setInstanciaEquipo(instancia);

                    detalle.setEstadoInicial((String) detalleData.get("estadoInicial"));
                    detalle.setEstadoFinal((String) detalleData.get("estadoFinal"));
                    detalle.setProblema((String) detalleData.get("problema"));
                    detalle.setSolucion((String) detalleData.get("solucion"));
                    detalle.setFase((String) detalleData.get("fase"));

                    if (detalle.getEstadoInicial().isEmpty() || detalle.getEstadoFinal().isEmpty() ||
                            detalle.getProblema().isEmpty() || detalle.getSolucion().isEmpty() ||
                            detalle.getFase().isEmpty()) {
                        return new ResponseEntity<>("Los campos de detalle no pueden estar vacíos",
                                HttpStatus.BAD_REQUEST);
                    }
                    detallesActualizados.add(detalleMantenimientoRepository.save(detalle));
                } catch (Exception e) {
                    return new ResponseEntity<>("Error en el formato de los detalles: " + e.getMessage(),
                            HttpStatus.BAD_REQUEST);
                }
            }
            Map<String, Object> response = Map.of(
                    "mantenimiento", mantenimientoActualizado,
                    "detalles", detallesActualizados
            );
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>("Error al actualizar el mantenimiento: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    @GetMapping("/{id}/detalles")
    public ResponseEntity<Object> obtenerDetallesMantenimiento(@PathVariable("id") int idMantenimiento) {
        try {
            Mantenimiento mantenimiento = mantenimientoRepository.findById(idMantenimiento)
                    .orElseThrow(() -> new RuntimeException("Mantenimiento no encontrado"));

            List<Map<String, Object>> response = detalleMantenimientoRepository
                    .findByMantenimiento(mantenimiento)
                    .stream()
                    .map(d -> {
                        Map<String, Object> detalle = new HashMap<>();
                        detalle.put("idDetalleMant", d.getIdDetalleMant());
                        detalle.put("estadoInicial", d.getEstadoInicial());
                        detalle.put("estadoFinal", d.getEstadoFinal());
                        detalle.put("problema", d.getProblema());
                        detalle.put("solucion", d.getSolucion());
                        detalle.put("fase", d.getFase());

                        if (d.getInstanciaEquipo() != null) {
                            Map<String, Object> instancia = new HashMap<>();
                            instancia.put("id", d.getInstanciaEquipo().getIdInstancia());
                            instancia.put("codigoActivo", d.getInstanciaEquipo().getCodigoActivo());
                            detalle.put("instanciaEquipo", instancia);
                        }

                        return detalle;
                    }).collect(Collectors.toList());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error al obtener los detalles: " + e.getMessage());
        }
    }


    @GetMapping("/detalleMantenimiento/{id}")
    public ResponseEntity<?> obtenerDetallePorId(@PathVariable("id") int idDetalle) {
        try {
            Optional<DetalleMantenimiento> detalle = detalleMantenimientoRepository.findById(idDetalle);

            if (!detalle.isPresent()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("Detalle de mantenimiento no encontrado");
            }

            Map<String, Object> response = new HashMap<>();
            DetalleMantenimiento d = detalle.get();
            response.put("idDetalleMant", d.getIdDetalleMant());
            response.put("estadoInicial", d.getEstadoInicial());
            response.put("estadoFinal", d.getEstadoFinal());
            response.put("problema", d.getProblema());
            response.put("solucion", d.getSolucion());
            response.put("fase", d.getFase());

            if (d.getInstanciaEquipo() != null) {
                Map<String, Object> instancia = new HashMap<>();
                instancia.put("id", d.getInstanciaEquipo().getIdInstancia());
                instancia.put("codigoActivo", d.getInstanciaEquipo().getCodigoActivo());
                response.put("instanciaEquipo", instancia);
            }

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error al obtener el detalle: " + e.getMessage());
        }
    }

    @PutMapping("/detalleMantenimiento/{id}")
    public ResponseEntity<?> actualizarDetalle(
            @PathVariable("id") int idDetalle,
            @RequestBody Map<String, Object> request) {
        try {
            Optional<DetalleMantenimiento> detalleData = detalleMantenimientoRepository.findById(idDetalle);

            if (!detalleData.isPresent()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("Detalle de mantenimiento no encontrado");
            }

            DetalleMantenimiento detalle = detalleData.get();

            if (request.containsKey("estadoInicial")) {
                String estadoInicial = (String) request.get("estadoInicial");
                if (estadoInicial == null || estadoInicial.trim().isEmpty()) {
                    return ResponseEntity.badRequest().body("El estado inicial no puede estar vacío");
                }
                detalle.setEstadoInicial(estadoInicial);
            }

            if (request.containsKey("estadoFinal")) {
                String estadoFinal = (String) request.get("estadoFinal");
                if (estadoFinal == null || estadoFinal.trim().isEmpty()) {
                    return ResponseEntity.badRequest().body("El estado final no puede estar vacío");
                }
                detalle.setEstadoFinal(estadoFinal);
            }

            if (request.containsKey("problema")) {
                String problema = (String) request.get("problema");
                if (problema == null || problema.trim().isEmpty()) {
                    return ResponseEntity.badRequest().body("El problema no puede estar vacío");
                }
                detalle.setProblema(problema);
            }

            if (request.containsKey("solucion")) {
                String solucion = (String) request.get("solucion");
                if (solucion == null || solucion.trim().isEmpty()) {
                    return ResponseEntity.badRequest().body("La solución no puede estar vacía");
                }
                detalle.setSolucion(solucion);
            }

            DetalleMantenimiento detalleActualizado = detalleMantenimientoRepository.save(detalle);

            Map<String, Object> response = new HashMap<>();
            response.put("mensaje", "Detalle actualizado correctamente");
            response.put("detalle", detalleActualizado);
            response.put("idMantenimiento", detalleActualizado.getMantenimiento().getIdMantenimiento());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error al actualizar el detalle: " + e.getMessage());
        }
    }
}