package com.proyecto.sistema.controller;

import com.proyecto.sistema.model.Laboratorio;
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
}