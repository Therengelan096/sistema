package com.proyecto.sistema.controller;

import com.proyecto.sistema.model.Administrador;
import com.proyecto.sistema.utils.PasswordUtils;
import com.proyecto.sistema.model.EstadoAdmin;
import com.proyecto.sistema.model.Usuario;
import com.proyecto.sistema.model.TipoUsuario;
import com.proyecto.sistema.repository.AdministradorRepository;
import com.proyecto.sistema.repository.UsuarioRepository;
import com.proyecto.sistema.service.AdministradorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.Map;

@RestController
@RequestMapping("/administradores")
public class AdministradorController {

    @Autowired
    private AdministradorRepository administradorRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private AdministradorService administradorService;

    @GetMapping
    public List<Administrador> obtenerAdministradores() {
        return administradorRepository.findAll();
    }

    @PostMapping
    public ResponseEntity<?> crearAdministrador(@RequestBody Administrador administrador) {
        if (administrador.getUsuarioRef() == null || administrador.getUsuarioRef().getIdUsuario() == 0) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Debe proporcionar un ID de usuario para crear un administrador.");
        }

        Optional<Usuario> usuarioOptional = usuarioRepository.findById(administrador.getUsuarioRef().getIdUsuario());

        if (usuarioOptional.isPresent()) {
            Usuario usuarioEncontrado = usuarioOptional.get();
            TipoUsuario tipoUsuario = usuarioEncontrado.getTipoUsuario();

            if (tipoUsuario != null && "administrador".equalsIgnoreCase(tipoUsuario.getTipo())) {
                if (administrador.getContraseña() != null && !administrador.getContraseña().isEmpty()) {
                    administrador.setContraseña(PasswordUtils.hashPassword(administrador.getContraseña()));
                } else {
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                            .body("La contraseña del administrador es obligatoria.");
                }

                administrador.setUsuarioRef(usuarioEncontrado);
                if (administrador.getEstado() == null) {
                    administrador.setEstado(EstadoAdmin.ACTIVO);
                }

                administradorRepository.save(administrador);
                return ResponseEntity.status(HttpStatus.CREATED).body("Administrador creado exitosamente");
            } else {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body("El usuario seleccionado no es de tipo administrador.");
            }
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Usuario no encontrado con ID: " + administrador.getUsuarioRef().getIdUsuario());
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credentials) {
        String usuario = credentials.get("usuario");
        String contraseña = credentials.get("contraseña");

        Administrador admin = administradorService.obtenerPorUsuarioYContraseña(usuario, contraseña);

        if (admin != null) {
            return ResponseEntity.ok().body("Login exitoso");
        } else {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Credenciales inválidas");
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> actualizarAdministrador(@PathVariable int id, @RequestBody Administrador administradorActualizado) {
        Optional<Administrador> adminOptional = administradorRepository.findById(id);

        if (adminOptional.isPresent()) {
            Administrador adminExistente = adminOptional.get();

            if (administradorActualizado.getUsuario() != null && !administradorActualizado.getUsuario().isEmpty()) {
                adminExistente.setUsuario(administradorActualizado.getUsuario());
            }

            if (administradorActualizado.getContraseña() != null && !administradorActualizado.getContraseña().isEmpty()) {
                adminExistente.setContraseña(PasswordUtils.hashPassword(administradorActualizado.getContraseña()));
            }

            administradorRepository.save(adminExistente);
            return ResponseEntity.ok("Administrador actualizado exitosamente");
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Administrador no encontrado con ID: " + id);
        }
    }

    @PatchMapping("/{id}/toggle-estado")
    public ResponseEntity<?> toggleEstadoAdministrador(@PathVariable int id) {
        Optional<Administrador> adminOptional = administradorRepository.findById(id);

        if (adminOptional.isPresent()) {
            Administrador admin = adminOptional.get();
            if (admin.getEstado() == EstadoAdmin.ACTIVO) {
                admin.setEstado(EstadoAdmin.INACTIVO);
            } else {
                admin.setEstado(EstadoAdmin.ACTIVO);
            }
            administradorRepository.save(admin);
            return ResponseEntity.ok(admin);
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Administrador no encontrado con ID: " + id);
        }
    }

    @GetMapping("/usuarios/buscarPorRu/{ru}")
    public ResponseEntity<?> buscarUsuarioPorRu(@PathVariable int ru) {
        Optional<Usuario> usuario = usuarioRepository.findByRu(ru);
        if (usuario.isPresent()) {
            return ResponseEntity.ok(usuario.get());
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Usuario no encontrado con RU: " + ru);
        }
    }
}