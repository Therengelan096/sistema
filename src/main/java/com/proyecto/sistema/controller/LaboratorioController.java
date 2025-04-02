package com.proyecto.sistema.controller;

import com.proyecto.sistema.model.Laboratorio;
import com.proyecto.sistema.repository.LaboratorioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/laboratorios")
public class LaboratorioController {
    @Autowired
    private LaboratorioRepository laboratorioRepository;

    @GetMapping
    public List<Laboratorio> obtenerLaboratorios() {
        return laboratorioRepository.findAll();
    }
}