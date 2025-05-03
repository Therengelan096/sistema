package com.proyecto.sistema.controller;

import com.proyecto.sistema.model.Equipo;
import com.proyecto.sistema.model.InstanciaEquipo;
import com.proyecto.sistema.repository.EquipoRepository;
import com.proyecto.sistema.repository.InstanciaEquipoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;
// Asegúrate de importar tus clases Laboratorio y CategoriaEquipo
// import com.proyecto.sistema.model.Laboratorio;
// import com.proyecto.sistema.model.CategoriaEquipo;
// import java.util.UUID;


@RestController
@RequestMapping("/equipos")
@CrossOrigin(origins = "*") // Ajustar en producción
public class EquipoController {

    @Autowired
    private EquipoRepository equipoRepository;

    @Autowired
    private InstanciaEquipoRepository instanciaEquipoRepository;

    // --- Métodos para gestionar TIPOS de Equipo ('equipos') ---

    // Listar todos los tipos de equipos con relaciones cargadas
    @GetMapping
    public List<Equipo> obtenerEquipos() {
        return equipoRepository.findAllWithCategoriaAndLaboratorio();
    }

    // Obtener UN tipo de equipo por su ID (útil para el formulario de edición de tipo)
    @GetMapping("/{id}")
    public ResponseEntity<Equipo> obtenerEquipoPorId(@PathVariable int id) {
        return equipoRepository.findById(id)
                .map(equipo -> {
                    // Forzar carga de relaciones LAZY para serialización
                    if (equipo.getCategoria() != null) equipo.getCategoria().getIdCategoria();
                    if (equipo.getLaboratorio() != null) equipo.getLaboratorio().getIdLaboratorio();
                    return ResponseEntity.ok(equipo);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // Crear un nuevo tipo de equipo y sus instancias iniciales
    @PostMapping
    @Transactional
    public ResponseEntity<Equipo> crearEquipoConInstancias(@RequestBody Equipo equipo) {
        Equipo nuevoTipoEquipo = equipoRepository.save(equipo);
        int cantidadInicial = equipo.getCantidad();

        List<InstanciaEquipo> nuevasInstancias = new ArrayList<>();
        for (int i = 0; i < cantidadInicial; i++) {
            InstanciaEquipo instancia = new InstanciaEquipo();
            instancia.setEquipo(nuevoTipoEquipo);
            instancia.setEstadoIndividual(equipo.getEstado());
            instancia.setFechaAdquisicion(new Date());

            // >>> LÓGICA PARA GENERAR CODIGO_ACTIVO ÚNICO <<<
            String codigoBase = nuevoTipoEquipo.getNombre() != null ? nuevoTipoEquipo.getNombre().replaceAll("[^a-zA-Z0-9]", "").toUpperCase() : "EQUIP";
            String codigoActivoGenerado = codigoBase.substring(0, Math.min(codigoBase.length(), 5)) + "-" + nuevoTipoEquipo.getIdEquipo() + "-" + (i + 1);
            // Alternativa segura: String codigoActivoGenerado = UUID.randomUUID().toString();
            instancia.setCodigoActivo(codigoActivoGenerado);

            // Si incluyes ubicacion_actual en InstanciaEquipo, setear aquí
            // instancia.setIdLaboratorioActual(equipo.getLaboratorio() != null ? equipo.getLaboratorio().getIdLaboratorio() : null);

            nuevasInstancias.add(instancia);
        }
        instanciaEquipoRepository.saveAll(nuevasInstancias);

        // Si no usas triggers para sincronizar Equipo.cantidad/estado, implementar lógica aquí

        return ResponseEntity.status(HttpStatus.CREATED).body(nuevoTipoEquipo);
    }

    // Actualizar un tipo de equipo existente (solo campos de tipo)
    @PutMapping("/{id}")
    public ResponseEntity<Equipo> actualizarEquipo(@PathVariable int id, @RequestBody Equipo equipoDetalles) {
        return equipoRepository.findById(id)
                .map(equipo -> {
                    equipo.setNombre(equipoDetalles.getNombre());
                    equipo.setCategoria(equipoDetalles.getCategoria());
                    // descomentar si Laboratorio principal es editable:
                    // equipo.setLaboratorio(equipoDetalles.getLaboratorio());
                    equipo.setDescripcion(equipoDetalles.getDescripcion());
                    // No actualizar estado ni cantidad (gestionados por instancias)
                    // equipo.setEstado(equipoDetalles.getEstado());
                    // equipo.setCantidad(equipoDetalles.getCantidad());
                    equipo.setMarca(equipoDetalles.getMarca());

                    Equipo actualizado = equipoRepository.save(equipo);

                    return ResponseEntity.ok(actualizado);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // --- Métodos para gestionar INSTANCIAS INDIVIDUALES ('instancias_equipo') ---
    // *** NOTA: SE REMUEVEN ENDPOINTS PARA OBTENER/ACTUALIZAR UNA INSTANCIA ESPECÍFICA ***

    // Listar TODAS las instancias individuales (aún puede ser útil para vistas generales)
    @GetMapping("/instancias")
    public List<InstanciaEquipo> obtenerInstancias() {
        // Considerar usar FETCH JOIN en repository si InstanciaEquipo.equipo es LAZY
        return instanciaEquipoRepository.findAll();
    }

    // Listar INSTANCIAS de un TIPO de equipo específico (SOLO LISTAR)
    @GetMapping("/{id}/instancias")
    public ResponseEntity<List<InstanciaEquipo>> obtenerInstanciasPorTipoEquipo(@PathVariable int id) {
        return equipoRepository.findById(id)
                .map(equipo -> {
                    List<InstanciaEquipo> instancias = instanciaEquipoRepository.findByEquipo(equipo);
                    // Si InstanciaEquipo.equipo es LAZY y no usas FETCH JOIN en findByEquipo, forzar carga aquí
                    // for (InstanciaEquipo instancia : instancias) { if (instancia.getEquipo() != null) instancia.getEquipo().getIdEquipo(); }
                    return ResponseEntity.ok(instancias);
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
