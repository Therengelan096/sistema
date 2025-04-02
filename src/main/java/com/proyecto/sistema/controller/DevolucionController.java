package com.proyecto.sistema.controller;

import com.proyecto.sistema.model.Devolucion;
import com.proyecto.sistema.repository.DevolucionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/devolucion")
public class DevolucionController {
    @Autowired
    private DevolucionRepository devolucionRepository;

    @GetMapping
    public List<Devolucion> obtenerDevoluciones() {
        return devolucionRepository.findAll();
    }
}