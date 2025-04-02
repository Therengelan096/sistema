package com.proyecto.sistema.controller;

import com.proyecto.sistema.model.Mantenimiento;
import com.proyecto.sistema.repository.MantenimientoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/mantenimiento")
public class MantenimientoController {
    @Autowired
    private MantenimientoRepository mantenimientoRepository;

    @GetMapping
    public List<Mantenimiento> obtenerMantenimientos() {
        return mantenimientoRepository.findAll();
    }
}