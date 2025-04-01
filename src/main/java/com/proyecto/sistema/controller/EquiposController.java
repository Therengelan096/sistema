package com.proyecto.sistema.controller;

import com.proyecto.sistema.model.Equipo;
import com.proyecto.sistema.service.EquipoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Controller
@RequestMapping("/equipos")
public class EquiposController {

    @Autowired
    private EquipoService equipoService;

    // Mostrar los equipos
    @GetMapping
    public String mostrarEquipos(Model model) {
        List<Equipo> equipos = equipoService.obtenerEquipos(); // Obtiene los equipos de la base de datos
        model.addAttribute("equipos", equipos); // Pasa los equipos al modelo
        return "redirect:/equipos"; // Renderiza equipos.html
    }

    // Agregar un nuevo equipo
    @PostMapping("/agregar")
    public String agregarEquipo(@ModelAttribute Equipo equipo) {
        equipoService.guardarEquipo(equipo); // Guarda el nuevo equipo
        return "redirect:/equipos"; // Redirige de vuelta a la página de equipos
    }

    // Modificar un equipo existente
    @PostMapping("/modificar/{id}")
    public String modificarEquipo(@PathVariable int id, @ModelAttribute Equipo equipoActualizado) {
        equipoService.actualizarEquipo(id, equipoActualizado); // Actualiza el equipo por ID
        return "redirect:/equipos"; // Recarga la página de equipos
    }

    // Eliminar un equipo
    @PostMapping("/eliminar/{id}")
    public String eliminarEquipo(@PathVariable int id) {
        equipoService.eliminarEquipo(id); // Elimina el equipo por ID
        return "redirect:/equipos"; // Recarga la página de equipos
    }
}