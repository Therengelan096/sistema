package com.proyecto.sistema.controller;

import com.proyecto.sistema.model.Sancion;
import com.proyecto.sistema.model.Usuario;
import com.proyecto.sistema.repository.SancionRepository;
import com.proyecto.sistema.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;


import java.util.Date;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/sanciones")
@CrossOrigin(origins = "*") // Para que acepte peticiones desde el HTML
public class SancionController {

    @Autowired
    private SancionRepository sancionRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @GetMapping
    public List<Sancion> obtenerSanciones() {
        return sancionRepository.findAll();
    }

    @PostMapping("/crear/{ru}")
    public Sancion crearSancion(@PathVariable int ru, @RequestBody Sancion sancion) {
        Optional<Usuario> usuarioOptional = usuarioRepository.findByRu(ru);

        if (usuarioOptional.isPresent()) {
            sancion.setUsuario(usuarioOptional.get());
            sancion.setFechaSancion(new Date());
            sancion.setEstado("activa");
            return sancionRepository.save(sancion);
        } else {
            throw new RuntimeException("Usuario con RU " + ru + " no encontrado.");
        }
    }
    @PutMapping("/cumplida/{id}")
    public String marcarCumplida(@PathVariable int id) {
        Optional<Sancion> sancionOptional = sancionRepository.findById(id);

        if (sancionOptional.isPresent()) {
            Sancion sancion = sancionOptional.get();
            sancion.setEstado("Cumplida");
            sancionRepository.save(sancion);
            return "Estado actualizado a Cumplida";
        } else {
            return "Sanción no encontrada";
        }
    }

}
