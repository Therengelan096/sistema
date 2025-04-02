package com.proyecto.sistema.controller;

import com.proyecto.sistema.model.Sancion;
import com.proyecto.sistema.repository.SancionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/sanciones")
public class SancionController {
    @Autowired
    private SancionRepository sancionRepository;

    @GetMapping
    public List<Sancion> obtenerSanciones() {
        return sancionRepository.findAll();
    }
}