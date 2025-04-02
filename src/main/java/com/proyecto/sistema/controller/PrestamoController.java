package com.proyecto.sistema.controller;

import com.proyecto.sistema.model.Prestamo;
import com.proyecto.sistema.repository.PrestamoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/prestamos")
public class PrestamoController {
    @Autowired
    private PrestamoRepository prestamoRepository;

    @GetMapping
    public List<Prestamo> obtenerPrestamos() {
        return prestamoRepository.findAll();
    }
}