package com.proyecto.sistema.controller;

import com.proyecto.sistema.model.Sancion;
import com.proyecto.sistema.model.Usuario;
import com.proyecto.sistema.repository.SancionRepository;
import com.proyecto.sistema.repository.UsuarioRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Date;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/sanciones")
@CrossOrigin(origins = "*")
public class SancionController {

    private static final Logger logger = LoggerFactory.getLogger(SancionController.class);

    @Autowired
    private SancionRepository sancionRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @GetMapping
    public ResponseEntity<List<Sancion>> obtenerSanciones() {
        logger.debug("Obteniendo todas las sanciones.");
        List<Sancion> sanciones = sancionRepository.findAll();
        return ResponseEntity.ok(sanciones);
    }

    @PostMapping("/crear/{ru}")
    public ResponseEntity<?> crearSancion(@PathVariable int ru, @RequestBody Sancion sancion) {
        logger.debug("Creando nueva sanción para el usuario con RU: {}", ru);
        Optional<Usuario> usuarioOptional = usuarioRepository.findByRu(ru);
        if (usuarioOptional.isPresent()) {
            sancion.setUsuario(usuarioOptional.get());
            sancion.setFechaSancion(new Date());
            sancion.setEstado("activa");
            Sancion sancionCreada = sancionRepository.save(sancion);
            logger.debug("Sanción creada con ID: {}", sancionCreada.getIdSancion());
            return ResponseEntity.ok(sancionCreada);
        } else {
            logger.warn("Usuario con RU {} no encontrado.", ru);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Usuario no encontrado.");
        }
    }

    @PutMapping("/activar/{id}")
    public ResponseEntity<?> activarSancion(@PathVariable int id) {
        logger.debug("Marcando sanción con ID: {} como activa.", id);
        Optional<Sancion> sancionOptional = sancionRepository.findById(id);
        if (sancionOptional.isPresent()) {
            Sancion sancion = sancionOptional.get();
            sancion.setEstado("activa");
            sancionRepository.save(sancion);
            logger.debug("Sanción con ID: {} marcada como activa.", id);
            return ResponseEntity.ok("Estado actualizado a activa");
        } else {
            logger.warn("Sanción con ID: {} no encontrada.", id);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Sanción no encontrada.");
        }
    }

    @PutMapping("/cumplida/{id}")
    public ResponseEntity<?> marcarCumplida(@PathVariable int id) {
        logger.debug("Marcando sanción con ID: {} como inactiva.", id);
        Optional<Sancion> sancionOptional = sancionRepository.findById(id);
        if (sancionOptional.isPresent()) {
            Sancion sancion = sancionOptional.get();
            sancion.setEstado("inactiva");
            sancionRepository.save(sancion);
            logger.debug("Sanción con ID: {} marcada como inactiva.", id);
            return ResponseEntity.ok("Estado actualizado a inactiva");
        } else {
            logger.warn("Sanción con ID: {} no encontrada.", id);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Sanción no encontrada.");
        }
    }
    // En UsuarioController.java o SancionController.java
    @GetMapping("/usuarios/buscarPorRu/{ru}")
    public ResponseEntity<?> buscarUsuarioPorRu(@PathVariable int ru) {
        logger.debug("Buscando usuario por RU: {}", ru);
        Optional<Usuario> usuarioOptional = usuarioRepository.findByRu(ru);
        if (usuarioOptional.isPresent()) {
            return ResponseEntity.ok(usuarioOptional.get());
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Usuario no encontrado.");
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> actualizarSancion(@PathVariable int id, @RequestBody Sancion sancionActualizada) {
        logger.debug("Actualizando la sanción con ID: {}", id);
        Optional<Sancion> sancionOptional = sancionRepository.findById(id);
        if (sancionOptional.isPresent()) {
            Sancion sancionExistente = sancionOptional.get();
            sancionExistente.setMotivoSancion(sancionActualizada.getMotivoSancion());
            if (sancionActualizada.getUsuario() != null && sancionActualizada.getUsuario().getRu() > 0) {
                usuarioRepository.findByRu(sancionActualizada.getUsuario().getRu())
                        .ifPresent(sancionExistente::setUsuario);
            }
            Sancion sancionGuardada = sancionRepository.save(sancionExistente);
            logger.debug("Sanción con ID: {} actualizada.", id);
            return ResponseEntity.ok(sancionGuardada);
        } else {
            logger.warn("Sanción con ID: {} no encontrada para actualizar.", id);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Sanción no encontrada.");
        }
    }
}