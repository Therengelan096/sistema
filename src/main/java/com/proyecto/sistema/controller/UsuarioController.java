package com.proyecto.sistema.controller;

import com.proyecto.sistema.model.Usuario;
import com.proyecto.sistema.repository.UsuarioRepository;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/usuarios")
public class UsuarioController {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @GetMapping
    public List<Usuario> obtenerUsuarios() {
        return usuarioRepository.findAll();
    }

    @PostMapping
    public ResponseEntity<Usuario> crearUsuario(@RequestBody Usuario usuario) {
        Usuario nuevoUsuario = usuarioRepository.save(usuario);
        return new ResponseEntity<>(nuevoUsuario, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Usuario> actualizarUsuario(@PathVariable int id, @RequestBody Usuario usuarioActualizado) {
        Optional<Usuario> usuarioExistente = usuarioRepository.findById(id);

        if (usuarioExistente.isPresent()) {
            usuarioActualizado.setIdUsuario(id);
            // Actualiza las nuevas columnas si es necesario
            usuarioActualizado.setMateria(usuarioActualizado.getMateria());
            usuarioActualizado.setParalelo(usuarioActualizado.getParalelo());
            usuarioActualizado.setSemestre(usuarioActualizado.getSemestre());
            Usuario usuarioActualizadoGuardado = usuarioRepository.save(usuarioActualizado);
            return new ResponseEntity<>(usuarioActualizadoGuardado, HttpStatus.OK);
        } else {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    // Nuevo método para obtener el usuario actual autenticado
    @GetMapping("/actual")
    public ResponseEntity<?> obtenerUsuarioActual(HttpSession session) {
        Integer idUsuario = (Integer) session.getAttribute("idUsuario");
        if (idUsuario != null) {
            Optional<Usuario> usuarioOptional = usuarioRepository.findById(idUsuario);
            if (usuarioOptional.isPresent()) {
                Usuario usuario = usuarioOptional.get();
                Map<String, Object> userData = new HashMap<>();

                userData.put("nombre", usuario.getNombre() != null ? usuario.getNombre() : "");
                userData.put("apellido", usuario.getApellido() != null ? usuario.getApellido() : "");
                userData.put("materia", usuario.getMateria() != null ? usuario.getMateria() : "");
                userData.put("paralelo", usuario.getParalelo() != null ? usuario.getParalelo() : "");
                userData.put("semestre", usuario.getSemestre() != null ? usuario.getSemestre() : "");

                return ResponseEntity.ok(userData);
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Usuario no encontrado");
            }
        }
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Usuario no autenticado");
    }

    @GetMapping("/buscarPorRu/{ru}")
    public ResponseEntity<?> buscarPorRu(@PathVariable int ru) {
        Optional<Usuario> usuarioOptional = usuarioRepository.findByRu(ru);
        if (usuarioOptional.isPresent()) {
            Usuario usuario = usuarioOptional.get();
            return ResponseEntity.ok(usuario);
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Usuario no encontrado");
        }
    }
}