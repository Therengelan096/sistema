package com.proyecto.sistema.controller;

import com.proyecto.sistema.model.*;
import com.proyecto.sistema.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
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
    @Autowired
    private EquipoRepository equipoRepository;
    @Autowired
    private InstanciaEquipoRepository instanciaEquipoRepository;

    @GetMapping
    public ResponseEntity<Object> obtenerMantenimientos() {
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
    @Transactional
    public ResponseEntity<?> agregarMantenimiento(@RequestBody Map<String, Object> request) {
        try {
            // Validar datos requeridos
            if (!request.containsKey("equipo") || !request.containsKey("fechaMantenimiento")
                    || !request.containsKey("cantidad") || !request.containsKey("detalles")) {
                return new ResponseEntity<>("Faltan campos requeridos", HttpStatus.BAD_REQUEST);
            }
            // 1. Crear y guardar el mantenimiento principal
            Mantenimiento mantenimiento = new Mantenimiento();
            Equipo equipo;
            try {
                @SuppressWarnings("unchecked")
                Map<String, Object> equipoMap = (Map<String, Object>) request.get("equipo");
                if (!equipoMap.containsKey("id")) {
                    return new ResponseEntity<>("ID de equipo no proporcionado", HttpStatus.BAD_REQUEST);
                }
                int equipoId = ((Number) equipoMap.get("id")).intValue();
                equipo = equipoRepository.findById(equipoId)
                        .orElseThrow(() -> new RuntimeException("Equipo no encontrado"));
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
                if (mantenimiento.getCantidad() > equipo.getCantidad()) {
                    return new ResponseEntity<>(
                            "La cantidad de mantenimiento excede la cantidad de equipos disponibles",
                            HttpStatus.BAD_REQUEST);
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
                return new ResponseEntity<>(
                        "La cantidad de detalles no coincide con la cantidad especificada",
                        HttpStatus.BAD_REQUEST);
            }
            List<InstanciaEquipo> instanciasAActualizar = new ArrayList<>();
            for (Map<String, Object> detalleData : detallesRequest) {
                if (!detalleData.containsKey("instanciaEquipo") || !detalleData.containsKey("estadoInicial")
                        || !detalleData.containsKey("problema") || !detalleData.containsKey("fase")) {
                    return new ResponseEntity<>(
                            "Faltan campos requeridos en los detalles (instanciaEquipo, estadoInicial, problema, fase)",
                            HttpStatus.BAD_REQUEST);
                }
                DetalleMantenimiento detalle = new DetalleMantenimiento();
                detalle.setMantenimiento(mantenimientoGuardado);
                try {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> instanciaMap = (Map<String, Object>) detalleData.get("instanciaEquipo");
                    if (!instanciaMap.containsKey("id")) {
                        return new ResponseEntity<>(
                                "ID de instancia de equipo no proporcionado",
                                HttpStatus.BAD_REQUEST);
                    }
                    int instanciaId = ((Number) instanciaMap.get("id")).intValue();
                    InstanciaEquipo instancia = instanciaEquipoRepository.findById(instanciaId)
                            .orElseThrow(() -> new RuntimeException("Instancia de equipo no encontrada"));
                    if ("En Mantenimiento".equalsIgnoreCase(instancia.getEstadoIndividual())) {
                        return new ResponseEntity<>(
                                "La instancia de equipo con ID " + instanciaId + " ya está en mantenimiento",
                                HttpStatus.BAD_REQUEST);
                    }
                    detalle.setInstanciaEquipo(instancia);
                    instancia.setEstadoIndividual("En Mantenimiento");
                    instanciasAActualizar.add(instancia);
                    detalle.setEstadoInicial((String) detalleData.get("estadoInicial"));
                    detalle.setEstadoFinal((String) detalleData.get("estadoFinal"));
                    detalle.setProblema((String) detalleData.get("problema"));
                    detalle.setSolucion((String) detalleData.get("solucion"));
                    detalle.setFase((String) detalleData.get("fase"));
                    if (detalle.getEstadoInicial().isEmpty() || detalle.getProblema().isEmpty()
                            || detalle.getFase().isEmpty()) {
                        return new ResponseEntity<>(
                                "Los campos de detalle no pueden estar vacíos",
                                HttpStatus.BAD_REQUEST);
                    }
                    detalles.add(detalleMantenimientoRepository.save(detalle));
                } catch (Exception e) {
                    return new ResponseEntity<>(
                            "Error en el formato de los detalles: " + e.getMessage(),
                            HttpStatus.BAD_REQUEST);
                }
            }
            detalleMantenimientoRepository.saveAll(detalles);
            instanciaEquipoRepository.saveAll(instanciasAActualizar);
            equipo.setCantidad(equipo.getCantidad() - mantenimiento.getCantidad());
            equipoRepository.save(equipo);
            Map<String, Object> response = Map.of(
                    "mantenimiento", mantenimientoGuardado,
                    "detalles", detalles);
            return new ResponseEntity<>(response, HttpStatus.CREATED);
        } catch (Exception e) {
            return new ResponseEntity<>("Error al crear el mantenimiento: " + e.getMessage(),
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
    @PatchMapping("/detalleMantenimiento/{id}")
    @Transactional
    public ResponseEntity<?> actualizarDetalleMantenimiento(@PathVariable("id") int idDetalle,
                                                            @RequestBody Map<String, Object> request) {
        System.out.println("Actualizando detalleMantenimiento con ID: " + idDetalle);
        System.out.println("Datos recibidos: " + request);
        try {
            Optional<DetalleMantenimiento> detalleOptional = detalleMantenimientoRepository.findById(idDetalle);
            if (!detalleOptional.isPresent()) {
                return new ResponseEntity<>("Detalle de mantenimiento no encontrado", HttpStatus.NOT_FOUND);
            }
            DetalleMantenimiento detalle = detalleOptional.get();

            // Actualizar estado final y solución si están presentes en la request
            if (request.containsKey("estadoFinal")) {
                detalle.setEstadoFinal((String) request.get("estadoFinal"));
            }
            if (request.containsKey("solucion")) {
                detalle.setSolucion((String) request.get("solucion"));
            }

            // Establecer la fase a "reparado"
            detalle.setFase("reparado");
            // No necesitas guardar el resultado de save si solo vas a devolver un éxito simple
            detalleMantenimientoRepository.save(detalle); // Solo guardar, no usar el retorno para la respuesta

            // ... lógica para actualizar instancia y equipo ...
            InstanciaEquipo instanciaEquipo = detalle.getInstanciaEquipo();
            if (instanciaEquipo != null && "En Mantenimiento".equalsIgnoreCase(instanciaEquipo.getEstadoIndividual())) {
                instanciaEquipo.setEstadoIndividual("Disponible");
                instanciaEquipoRepository.save(instanciaEquipo);

                Equipo equipo = instanciaEquipo.getEquipo();
                if (equipo != null) {
                    equipo.setCantidad(equipo.getCantidad() + 1);
                    equipoRepository.save(equipo);
                }
            }

            // Devuelve una respuesta simple de éxito en lugar del objeto completo
            return ResponseEntity.ok(Map.of("message", "Reparación guardada exitosamente", "idDetalleMant", idDetalle));

        } catch (Exception e) {
            e.printStackTrace(); // Imprime el stack trace completo en el servidor
            return new ResponseEntity<>("Error al actualizar el detalle: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
