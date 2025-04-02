package com.proyecto.sistema.controller;

import com.proyecto.sistema.model.Administrador;
import com.proyecto.sistema.repository.AdministradorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/administradores")
public class AdministradorController {
    @Autowired
    private AdministradorRepository administradorRepository;

    @GetMapping
    public List<Administrador> obtenerAdministradores() {
        return administradorRepository.findAll();
    }
}