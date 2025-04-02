package com.proyecto.sistema.controller;

import com.proyecto.sistema.model.Equipo;
import com.proyecto.sistema.repository.EquipoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/equipos")
public class EquipoController {
    @Autowired
    private EquipoRepository equipoRepository;

    @GetMapping
    public List<Equipo> obtenerEquipos() {
        return equipoRepository.findAll();
    }
}