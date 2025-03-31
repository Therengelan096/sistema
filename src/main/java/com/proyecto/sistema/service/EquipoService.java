package com.proyecto.sistema.service;

import com.proyecto.sistema.model.Equipo;
import com.proyecto.sistema.repository.EquipoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class EquipoService {

    @Autowired
    private EquipoRepository equipoRepository;

    // Obtener todos los equipos
    public List<Equipo> obtenerEquipos() {
        return equipoRepository.findAll();
    }

    // Guardar un nuevo equipo
    public void guardarEquipo(Equipo equipo) {
        validarEquipo(equipo); // Validar los datos del equipo
        equipoRepository.save(equipo);
    }

    // Actualizar un equipo existente
    public void actualizarEquipo(int id, Equipo equipoActualizado) {
        validarEquipo(equipoActualizado); // Validar los datos actualizados del equipo
        Equipo equipo = equipoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Equipo no encontrado con ID: " + id));
        equipo.setNombre(equipoActualizado.getNombre());
        equipo.setDescripcion(equipoActualizado.getDescripcion());
        equipo.setEstado(equipoActualizado.getEstado());
        equipoRepository.save(equipo);
    }

    // Eliminar un equipo por ID
    public void eliminarEquipo(int id) {
        if (!equipoRepository.existsById(id)) {
            throw new RuntimeException("Equipo no encontrado con ID: " + id);
        }
        equipoRepository.deleteById(id);
    }

    // Método privado para validar un equipo antes de guardarlo o actualizarlo
    private void validarEquipo(Equipo equipo) {
        if (equipo.getNombre() == null || equipo.getNombre().isEmpty()) {
            throw new IllegalArgumentException("El nombre del equipo no puede estar vacío");
        }
        if (equipo.getEstado() == null || equipo.getEstado().isEmpty()) {
            throw new IllegalArgumentException("El estado del equipo no puede estar vacío");
        }
    }
}