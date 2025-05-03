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
    // Obtener un equipo por su ID
    @GetMapping("/{id}") // << Añade esta anotación con la ruta de la variable {id}
    public ResponseEntity<Equipo> obtenerEquipoPorId(@PathVariable int id) {
        // Usa el repositorio para buscar el equipo por ID
        return equipoRepository.findById(id)
                .map(equipo -> ResponseEntity.ok(equipo)) // Si se encuentra el equipo, retorna 200 OK con el equipo
                .orElse(ResponseEntity.notFound().build()); // Si no se encuentra, retorna 404 Not Found
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
                    equipo.setCantidad(equipoDetalles.getCantidad());
                    equipo.setMarca(equipoDetalles.getMarca());
                    Equipo actualizado = equipoRepository.save(equipo);
                    return ResponseEntity.ok(actualizado);
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
