package com.proyecto.sistema.controller;

import com.proyecto.sistema.model.Mantenimiento;
import com.proyecto.sistema.repository.MantenimientoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/mantenimiento")
public class MantenimientoController {
    @Autowired
    private MantenimientoRepository mantenimientoRepository;

    @GetMapping
    public List<Mantenimiento> obtenerMantenimientos() {
        return mantenimientoRepository.findAll();
    }

    @PostMapping
    public ResponseEntity<Mantenimiento> agregarMantenimiento(@RequestBody Mantenimiento mantenimiento) {
        try {
            Mantenimiento nuevoMantenimiento = mantenimientoRepository.save(mantenimiento);
            return new ResponseEntity<>(nuevoMantenimiento, HttpStatus.CREATED);
        } catch (Exception e) {
            return new ResponseEntity<>(null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<Mantenimiento> actualizarMantenimiento(@PathVariable("id") int id, @RequestBody Mantenimiento mantenimiento) {
        Optional<Mantenimiento> mantenimientoData = mantenimientoRepository.findById(id);

        if (mantenimientoData.isPresent()) {
            Mantenimiento _mantenimiento = mantenimientoData.get();
            _mantenimiento.setEquipo(mantenimiento.getEquipo());
            _mantenimiento.setFechaMantenimiento(mantenimiento.getFechaMantenimiento());
            _mantenimiento.setEstadoInicial(mantenimiento.getEstadoInicial());
            _mantenimiento.setEstadoFinal(mantenimiento.getEstadoFinal());
            _mantenimiento.setDescripcionProblema(mantenimiento.getDescripcionProblema());
            _mantenimiento.setSolucionAplicada(mantenimiento.getSolucionAplicada());
            return new ResponseEntity<>(mantenimientoRepository.save(_mantenimiento), HttpStatus.OK);
        } else {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }




}