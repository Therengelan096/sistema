package com.proyecto.sistema.controller;

import com.proyecto.sistema.model.CategoriaEquipo;
import com.proyecto.sistema.model.Equipo;
import com.proyecto.sistema.model.Laboratorio;
import com.proyecto.sistema.repository.CategoriaEquipoRepository;
import com.proyecto.sistema.repository.EquipoRepository;
import com.proyecto.sistema.repository.LaboratorioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/laboratorios")
public class LaboratorioController {
    @Autowired
    private LaboratorioRepository laboratorioRepository;

    @Autowired
    private CategoriaEquipoRepository categoriaEquipoRepository;

    @Autowired
    private EquipoRepository equipoRepository;

    @GetMapping
    public List<Laboratorio> obtenerLaboratorios() {
        return laboratorioRepository.findAll();
    }

    @PostMapping
    public ResponseEntity<Laboratorio> crearLaboratorio(@RequestBody Laboratorio laboratorio) {
        Laboratorio nuevoLaboratorio = laboratorioRepository.save(laboratorio);
        return new ResponseEntity<>(nuevoLaboratorio, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Laboratorio> actualizarLaboratorio(@PathVariable int id, @RequestBody Laboratorio laboratorioActualizado) {
        Optional<Laboratorio> laboratorioExistente = laboratorioRepository.findById(id);

        if (laboratorioExistente.isPresent()) {
            laboratorioActualizado.setIdLaboratorio(id);
            Laboratorio laboratorioActualizadoGuardado = laboratorioRepository.save(laboratorioActualizado);
            return new ResponseEntity<>(laboratorioActualizadoGuardado, HttpStatus.OK);
        } else {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    @GetMapping("/{id}/categorias")
    public ResponseEntity<List<CategoriaEquipo>> obtenerCategoriasPorLaboratorio(@PathVariable int id) {
        Optional<Laboratorio> laboratorioOptional = laboratorioRepository.findById(id);
        if (laboratorioOptional.isPresent()) {
            Laboratorio laboratorio = laboratorioOptional.get();
            List<CategoriaEquipo> categorias = categoriaEquipoRepository.findByLaboratorios(laboratorio);
            return ResponseEntity.ok(categorias);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/{id}/equipos")
    public ResponseEntity<List<Equipo>> obtenerEquiposPorLaboratorio(@PathVariable int id, @RequestParam(required = false) Integer categoriaId) {
        Optional<Laboratorio> laboratorioOptional = laboratorioRepository.findById(id);
        if (laboratorioOptional.isPresent()) {
            Laboratorio laboratorio = laboratorioOptional.get();
            List<Equipo> equipos;
            if (categoriaId != null) {
                Optional<CategoriaEquipo> categoriaOptional = categoriaEquipoRepository.findById(categoriaId);
                if (categoriaOptional.isPresent()) {
                    equipos = equipoRepository.findByLaboratorioAndCategoria(laboratorio, categoriaOptional.get());
                } else {
                    return ResponseEntity.badRequest().body(null); // Categoría no válida
                }
            } else {
                equipos = equipoRepository.findByLaboratorio(laboratorio);
            }
            return ResponseEntity.ok(equipos);
        } else {
            return ResponseEntity.notFound().build();
        }
    }
}