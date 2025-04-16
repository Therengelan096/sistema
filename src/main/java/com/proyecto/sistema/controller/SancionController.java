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
        try {
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
        } catch (Exception e) {
            logger.error("Error al crear la sanción.", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error al crear la sanción.");
        }
    }

    @PutMapping("/cumplida/{id}")
    public ResponseEntity<?> marcarCumplida(@PathVariable int id) {
        logger.debug("Marcando sanción con ID: {} como inactiva.", id);
        try {
            if (id <= 0) {
                logger.warn("ID de sanción no válido: {}", id);
                return ResponseEntity.badRequest().body("ID de sanción no válido.");
            }
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
        } catch (Exception e) {
            logger.error("Error al marcar la sanción como inactiva.", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error al actualizar el estado de la sanción.");
        }
    }
}
