package com.proyecto.sistema.controller;

import com.proyecto.sistema.model.*; // Asegúrate de importar DiaSemana y HorarioLaboratorio
import com.proyecto.sistema.repository.CategoriaEquipoRepository;
import com.proyecto.sistema.repository.EquipoRepository;
import com.proyecto.sistema.repository.HorarioLaboratorioRepository; // Nuevo repositorio
import com.proyecto.sistema.repository.LaboratorioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/laboratorios")
public class LaboratorioController {
    @Autowired
    private LaboratorioRepository laboratorioRepository;

    @Autowired
    private CategoriaEquipoRepository categoriaEquipoRepository;

    @Autowired
    private EquipoRepository equipoRepository;

    @Autowired
    private HorarioLaboratorioRepository horarioLaboratorioRepository; // Inyectar el nuevo repositorio

    @GetMapping
    public List<Laboratorio> obtenerLaboratorios() {
        return laboratorioRepository.findAll();
    }

    @PostMapping
    public ResponseEntity<Laboratorio> crearLaboratorio(@RequestBody Laboratorio laboratorio) {
        Laboratorio nuevoLaboratorio = laboratorioRepository.save(laboratorio);
        // Crear horario por defecto para el nuevo laboratorio
        crearHorarioPorDefecto(nuevoLaboratorio);
        return new ResponseEntity<>(nuevoLaboratorio, HttpStatus.CREATED);
    }

    private void crearHorarioPorDefecto(Laboratorio laboratorio) {
        // Definir los días y horas para el horario por defecto
        // Por ejemplo, de Lunes a Viernes, de 8 AM a 6 PM, en bloques de 1 hora
        DiaSemana[] dias = {DiaSemana.LUNES, DiaSemana.MARTES, DiaSemana.MIERCOLES, DiaSemana.JUEVES, DiaSemana.VIERNES};
        LocalTime horaInicioClases = LocalTime.of(8, 0);
        LocalTime horaFinClases = LocalTime.of(18, 0); // Hasta las 6 PM

        for (DiaSemana dia : dias) {
            LocalTime horaActual = horaInicioClases;
            while (horaActual.isBefore(horaFinClases)) {
                LocalTime horaFinBloque = horaActual.plusHours(1);
                HorarioLaboratorio bloque = new HorarioLaboratorio(laboratorio, dia, horaActual, horaFinBloque, false);
                horarioLaboratorioRepository.save(bloque);
                horaActual = horaFinBloque;
            }
        }
    }


    @PutMapping("/{id}")
    public ResponseEntity<Laboratorio> actualizarLaboratorio(@PathVariable Integer id, @RequestBody Laboratorio laboratorioActualizado) {
        // Usar Integer para @PathVariable es una buena práctica con findById que devuelve Optional
        Optional<Laboratorio> laboratorioOptional = laboratorioRepository.findById(id);

        if (laboratorioOptional.isPresent()) {
            Laboratorio laboratorioExistente = laboratorioOptional.get(); // Obtener la entidad existente

            // --- CORRECCIÓN ---
            // Actualizar SOLO las propiedades que vienen del objeto recibido
            // en la entidad existente que recuperaste de la base de datos.
            laboratorioExistente.setNombre(laboratorioActualizado.getNombre());
            laboratorioExistente.setUbicacion(laboratorioActualizado.getUbicacion());

            // NO hagas laboratorioExistente.setHorarios(laboratorioActualizado.getHorarios());
            // porque laboratorioActualizado.getHorarios() probablemente es null o vacío.

            // Guardar la entidad existente (Hibernate manejará la actualización en la DB)
            Laboratorio laboratorioActualizadoGuardado = laboratorioRepository.save(laboratorioExistente);

            return new ResponseEntity<>(laboratorioActualizadoGuardado, HttpStatus.OK);
        } else {
            // Si el laboratorio no se encuentra, retornar 404 Not Found
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    @GetMapping("/{id}/categorias")
    public ResponseEntity<List<CategoriaEquipo>> obtenerCategoriasPorLaboratorio(@PathVariable int id) {
        Optional<Laboratorio> laboratorioOptional = laboratorioRepository.findById(id);
        if (laboratorioOptional.isPresent()) {
            Laboratorio laboratorio = laboratorioOptional.get();
            List<CategoriaEquipo> categorias = categoriaEquipoRepository.findByLaboratorios(laboratorio);
            return ResponseEntity.ok(categorias);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/{id}/equipos")
    public ResponseEntity<List<Equipo>> obtenerEquiposPorLaboratorio(@PathVariable int id, @RequestParam(required = false) Integer categoriaId) {
        Optional<Laboratorio> laboratorioOptional = laboratorioRepository.findById(id);
        if (laboratorioOptional.isPresent()) {
            Laboratorio laboratorio = laboratorioOptional.get();
            List<Equipo> equipos;
            if (categoriaId != null) {
                Optional<CategoriaEquipo> categoriaOptional = categoriaEquipoRepository.findById(categoriaId);
                if (categoriaOptional.isPresent()) {
                    equipos = equipoRepository.findByLaboratorioAndCategoria(laboratorio, categoriaOptional.get());
                } else {
                    return ResponseEntity.badRequest().body(null); // Categoría no válida
                }
            } else {
                equipos = equipoRepository.findByLaboratorio(laboratorio);
            }
            return ResponseEntity.ok(equipos);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    // --- Nuevos Endpoints para Horarios ---
    @GetMapping("/{idLaboratorio}/horario")
    public ResponseEntity<List<HorarioLaboratorio>> obtenerHorarioPorLaboratorio(@PathVariable int idLaboratorio) {
        Optional<Laboratorio> laboratorioOptional = laboratorioRepository.findById(idLaboratorio);
        if (!laboratorioOptional.isPresent()) {
            return ResponseEntity.notFound().build();
        }
        List<HorarioLaboratorio> horario = horarioLaboratorioRepository.findByLaboratorioIdLaboratorioOrderByDiaSemanaAscHoraInicioAsc(idLaboratorio);
        return ResponseEntity.ok(horario);
    }

    @PutMapping("/horario/{idHorario}/ocupado")
    public ResponseEntity<HorarioLaboratorio> actualizarEstadoOcupado(
            @PathVariable int idHorario,
            @RequestParam boolean ocupado) {
        Optional<HorarioLaboratorio> horarioOptional = horarioLaboratorioRepository.findById(idHorario);
        if (horarioOptional.isPresent()) {
            HorarioLaboratorio bloqueHorario = horarioOptional.get();
            bloqueHorario.setOcupado(ocupado);
            horarioLaboratorioRepository.save(bloqueHorario);
            return ResponseEntity.ok(bloqueHorario);
        } else {
            return ResponseEntity.notFound().build();
        }
    }
}
