package com.proyecto.sistema.controller;

import com.proyecto.sistema.model.Administrador;
import com.proyecto.sistema.model.Usuario;
import com.proyecto.sistema.repository.AdministradorRepository;
import com.proyecto.sistema.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/administradores")
public class AdministradorController {

    @Autowired
    private AdministradorRepository administradorRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @GetMapping
    public List<Administrador> obtenerAdministradores() {
        return administradorRepository.findAll();
    }

    @PostMapping
    public ResponseEntity<?> crearAdministrador(@RequestBody Administrador administrador) {
        Optional<Usuario> usuario = usuarioRepository.findById(administrador.getUsuarioRef().getIdUsuario());

        if (usuario.isPresent()) {
            administrador.setUsuarioRef(usuario.get());
            administradorRepository.save(administrador);
            return ResponseEntity.status(HttpStatus.CREATED).body("Administrador creado exitosamente");
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Usuario no encontrado");
        }
    }

    @GetMapping("/buscarPorRu/{ru}")
    public ResponseEntity<?> buscarUsuarioPorRu(@PathVariable int ru) {
        Optional<Usuario> usuario = usuarioRepository.findByRu(ru);
        if (usuario.isPresent()) {
            return ResponseEntity.ok(usuario.get());
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Usuario no encontrado");
        }
    }
}