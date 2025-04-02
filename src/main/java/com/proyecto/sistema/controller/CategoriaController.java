package com.proyecto.sistema.controller;

import com.proyecto.sistema.model.CategoriaEquipo;
import com.proyecto.sistema.repository.CategoriaEquipoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;

@RestController
@RequestMapping("/categorias")
public class CategoriaController {
    @Autowired
    private CategoriaEquipoRepository categoriaEquipoRepository;

    @GetMapping
    public List<CategoriaEquipo> obtenerCategorias() {
        return categoriaEquipoRepository.findAll();
    }
}