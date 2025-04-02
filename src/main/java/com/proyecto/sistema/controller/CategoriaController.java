package com.proyecto.sistema.controller;

import com.proyecto.sistema.model.CategoriaEquipo;
import com.proyecto.sistema.repository.CategoriaEquipoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/categorias")
public class CategoriaController {
    @Autowired
    private CategoriaEquipoRepository categoriaEquipoRepository;

    @GetMapping
    public List<CategoriaEquipo> obtenerCategorias() {
        return categoriaEquipoRepository.findAll();
    }

    @PostMapping
    public ResponseEntity<CategoriaEquipo> crearCategoria(@RequestBody CategoriaEquipo categoriaEquipo) {
        CategoriaEquipo nuevaCategoria = categoriaEquipoRepository.save(categoriaEquipo);
        return new ResponseEntity<>(nuevaCategoria, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<CategoriaEquipo> actualizarCategoria(@PathVariable int id, @RequestBody CategoriaEquipo categoriaEquipoActualizada) {
        Optional<CategoriaEquipo> categoriaExistente = categoriaEquipoRepository.findById(id);

        if (categoriaExistente.isPresent()) {
            categoriaEquipoActualizada.setIdCategoria(id);
            CategoriaEquipo categoriaActualizadaGuardada = categoriaEquipoRepository.save(categoriaEquipoActualizada);
            return new ResponseEntity<>(categoriaActualizadaGuardada, HttpStatus.OK);
        } else {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }
}