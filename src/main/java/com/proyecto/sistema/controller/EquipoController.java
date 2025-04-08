package com.proyecto.sistema.controller;

import com.proyecto.sistema.model.Equipo;
import com.proyecto.sistema.repository.EquipoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/equipos")
@CrossOrigin(origins = "*")
public class EquipoController {

    @Autowired
    private EquipoRepository equipoRepository;

    // Listar todos los equipos
    @GetMapping
    public List<Equipo> obtenerEquipos() {
        return equipoRepository.findAll();
    }

    // Crear un nuevo equipo
    @PostMapping
    public Equipo crearEquipo(@RequestBody Equipo equipo) {
        return equipoRepository.save(equipo);
    }

    // Actualizar un equipo existente
    @PutMapping("/{id}")
    public ResponseEntity<Equipo> actualizarEquipo(@PathVariable int id, @RequestBody Equipo equipoDetalles) {
        return equipoRepository.findById(id)
                .map(equipo -> {
                    equipo.setNombre(equipoDetalles.getNombre());
                    equipo.setCategoria(equipoDetalles.getCategoria());
                    equipo.setLaboratorio(equipoDetalles.getLaboratorio());
                    equipo.setDescripcion(equipoDetalles.getDescripcion());
                    equipo.setEstado(equipoDetalles.getEstado());
                    Equipo actualizado = equipoRepository.save(equipo);
                    return ResponseEntity.ok(actualizado);
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
