package com.proyecto.sistema.controller;

import com.proyecto.sistema.model.Administrador;
import com.proyecto.sistema.model.EstadoAdmin; // Importa el Enum
import com.proyecto.sistema.model.Usuario;
import com.proyecto.sistema.repository.AdministradorRepository;
import com.proyecto.sistema.repository.UsuarioRepository;
// import org.springframework.security.crypto.password.PasswordEncoder; // Si implementaste hashing
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

    // Si estás usando hashing (recomendado)
    // @Autowired
    // private PasswordEncoder passwordEncoder;

    @GetMapping
    public List<Administrador> obtenerAdministradores() {
        // Asegúrate que el método findAll devuelva el campo 'estado'
        return administradorRepository.findAll();
    }

    @PostMapping
    public ResponseEntity<?> crearAdministrador(@RequestBody Administrador administrador) {
        Optional<Usuario> usuario = usuarioRepository.findById(administrador.getUsuarioRef().getIdUsuario());

        if (usuario.isPresent()) {
            // Hashear contraseña si se implementó
            // administrador.setContraseña(passwordEncoder.encode(administrador.getContraseña()));
            administrador.setUsuarioRef(usuario.get());
            // El estado por defecto se asigna en la entidad, no es necesario setearlo aquí
            // a menos que quieras permitir establecerlo en la creación.
            administradorRepository.save(administrador);
            return ResponseEntity.status(HttpStatus.CREATED).body("Administrador creado exitosamente");
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Usuario no encontrado");
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> actualizarAdministrador(@PathVariable int id, @RequestBody Administrador administradorActualizado) {
        Optional<Administrador> adminOptional = administradorRepository.findById(id);

        if (adminOptional.isPresent()) {
            Administrador adminExistente = adminOptional.get();

            // Actualizar los campos que se permiten modificar (excepto el ID)
            adminExistente.setUsuario(administradorActualizado.getUsuario());

            // Actualizar la contraseña solo si se proporciona una nueva
            if (administradorActualizado.getContraseña() != null && !administradorActualizado.getContraseña().isEmpty()) {
                // Aquí deberías hashear la nueva contraseña antes de guardarla
                adminExistente.setContraseña(administradorActualizado.getContraseña());
            }

            // Actualizar la referencia al usuario si se proporciona un nuevo ID de usuario
            if (administradorActualizado.getUsuarioRef() != null && administradorActualizado.getUsuarioRef().getIdUsuario() != 0) {
                Optional<Usuario> usuarioOptional = usuarioRepository.findById(administradorActualizado.getUsuarioRef().getIdUsuario());
                if (usuarioOptional.isPresent()) {
                    adminExistente.setUsuarioRef(usuarioOptional.get());
                } else {
                    return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Usuario no encontrado con ID: " + administradorActualizado.getUsuarioRef().getIdUsuario());
                }
            }

            administradorRepository.save(adminExistente);
            return ResponseEntity.ok("Administrador actualizado exitosamente");
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Administrador no encontrado con ID: " + id);
        }
    }

    @PatchMapping("/{id}/toggle-estado")
    public ResponseEntity<?> toggleEstadoAdministrador(@PathVariable int id) {
        Optional<Administrador> adminOptional = administradorRepository.findById(id);

        if (adminOptional.isPresent()) {
            Administrador admin = adminOptional.get();
            // Cambiar el estado
            if (admin.getEstado() == EstadoAdmin.ACTIVO) {
                admin.setEstado(EstadoAdmin.INACTIVO);
            } else {
                admin.setEstado(EstadoAdmin.ACTIVO);
            }
            administradorRepository.save(admin); // Guardar el cambio
            return ResponseEntity.ok(admin); // Devuelve el admin actualizado (incluye el nuevo estado)
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Administrador no encontrado con ID: " + id);
        }
    }

    // Endpoint para buscar usuario por RU (Considera moverlo a UsuarioController)
    @GetMapping("/usuarios/buscarPorRu/{ru}") // Cambiado path para claridad
    public ResponseEntity<?> buscarUsuarioPorRu(@PathVariable int ru) {
        Optional<Usuario> usuario = usuarioRepository.findByRu(ru);
        if (usuario.isPresent()) {
            return ResponseEntity.ok(usuario.get());
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Usuario no encontrado");
        }
    }
}
