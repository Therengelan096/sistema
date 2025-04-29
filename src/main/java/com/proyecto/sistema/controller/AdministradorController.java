package com.proyecto.sistema.controller;

import com.proyecto.sistema.model.Administrador;
import com.proyecto.sistema.model.EstadoAdmin; // Importa el Enum
import com.proyecto.sistema.model.Usuario;
import com.proyecto.sistema.model.TipoUsuario; // Importar TipoUsuario
import com.proyecto.sistema.repository.AdministradorRepository;
import com.proyecto.sistema.repository.UsuarioRepository;
// import org.springframework.security.crypto.password.PasswordEncoder; // Si implementaste hashing
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.Map; // Aunque no se usa en crearAdministrador, ya estaba importado

@RestController
@RequestMapping("/administradores")
public class AdministradorController {

    @Autowired
    private AdministradorRepository administradorRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    // Si estás usando hashing (recomendado), descomenta esta línea
    // @Autowired
    // private PasswordEncoder passwordEncoder;

    @GetMapping
    public List<Administrador> obtenerAdministradores() {
        // Asegúrate que el método findAll devuelva el campo 'estado' si es parte de la entidad Administrador
        return administradorRepository.findAll();
    }

    @PostMapping
    public ResponseEntity<?> crearAdministrador(@RequestBody Administrador administrador) {
        // Validar que se proporciona una referencia de Usuario
        if (administrador.getUsuarioRef() == null || administrador.getUsuarioRef().getIdUsuario() == 0) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Debe proporcionar un ID de usuario para crear un administrador.");
        }

        // Buscar el usuario por el ID referenciado en el Administrador
        Optional<Usuario> usuarioOptional = usuarioRepository.findById(administrador.getUsuarioRef().getIdUsuario());

        if (usuarioOptional.isPresent()) {
            Usuario usuarioEncontrado = usuarioOptional.get();

            // *** AQUÍ ESTÁ LA VERIFICACIÓN DEL TIPO DE USUARIO ***
            TipoUsuario tipoUsuario = usuarioEncontrado.getTipoUsuario();

            // Asegúrate de que tipoUsuario no sea null y que su tipo sea "administrador"
            // Utiliza .equalsIgnoreCase() para comparar Strings sin distinguir mayúsculas/minúsculas
            if (tipoUsuario != null && "administrador".equalsIgnoreCase(tipoUsuario.getTipo())) {
                // Si el usuario encontrado es de tipo "administrador", procede a guardar el Administrador
                // Puedes añadir una verificación adicional para no duplicar administradores si es necesario
                // Optional<Administrador> existingAdmin = administradorRepository.findByUsuarioRef(usuarioEncontrado);
                // if(existingAdmin.isPresent()) {
                //     return ResponseEntity.status(HttpStatus.CONFLICT).body("Este usuario ya es un administrador.");
                // }

                // Hashear contraseña si se implementó (descomenta si lo usas)
                // if (administrador.getContraseña() != null && !administrador.getContraseña().isEmpty()) {
                //     administrador.setContraseña(passwordEncoder.encode(administrador.getContraseña()));
                // } else {
                //     // Si la contraseña es obligatoria para un Administrador, maneja el error
                //     return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("La contraseña del administrador es obligatoria.");
                // }

                administrador.setUsuarioRef(usuarioEncontrado); // Asegura que la referencia es correcta

                // Asigna el estado por defecto si no se envía (si EstadoAdmin es un campo de Administrador)
                // if (administrador.getEstado() == null) {
                //     administrador.setEstado(EstadoAdmin.ACTIVO); // O el valor por defecto que uses
                // }

                administradorRepository.save(administrador);
                return ResponseEntity.status(HttpStatus.CREATED).body("Administrador creado exitosamente");

            } else {
                // 5. Si el tipo de usuario NO es "administrador", devolver un error
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("El usuario seleccionado no es de tipo administrador.");
            }
        } else {
            // Si no se encontró ningún usuario con el ID proporcionado
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Usuario no encontrado con ID: " + administrador.getUsuarioRef().getIdUsuario());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> actualizarAdministrador(@PathVariable int id, @RequestBody Administrador administradorActualizado) {
        Optional<Administrador> adminOptional = administradorRepository.findById(id);

        if (adminOptional.isPresent()) {
            Administrador adminExistente = adminOptional.get();

            // Actualizar los campos que se permiten modificar
            // Asegúrate de no sobrescribir el usuarioRef si no se pretende cambiar
            if (administradorActualizado.getUsuario() != null && !administradorActualizado.getUsuario().isEmpty()) {
                adminExistente.setUsuario(administradorActualizado.getUsuario()); // Asumiendo que 'usuario' es el nombre de login del admin
            }


            // Actualizar la contraseña solo si se proporciona una nueva
            if (administradorActualizado.getContraseña() != null && !administradorActualizado.getContraseña().isEmpty()) {
                // Aquí deberías hashear la nueva contraseña antes de guardarla
                // if (passwordEncoder != null) { // Verificar si el encoder está inyectado
                //    adminExistente.setContraseña(passwordEncoder.encode(administradorActualizado.getContraseña()));
                // } else {
                adminExistente.setContraseña(administradorActualizado.getContraseña()); // Si no usas hashing (NO recomendado)
                // }
            }

            // *** NOTA: No parece que tu lógica de PUT actualice la referencia a Usuario (usuarioRef) ***
            // Si necesitas permitir cambiar el Usuario asociado a un Administrador existente,
            // tendrías que añadir lógica aquí para buscar el nuevo usuario y verificar su rol,
            // similar a como lo hicimos en crearAdministrador.
            // if (administradorActualizado.getUsuarioRef() != null && administradorActualizado.getUsuarioRef().getIdUsuario() != 0) {
            //     Optional<Usuario> usuarioOptional = usuarioRepository.findById(administradorActualizado.getUsuarioRef().getIdUsuario());
            //     if (usuarioOptional.isPresent()) {
            //          Usuario nuevoUsuario = usuarioOptional.get();
            //          // *** VERIFICAR ROL DEL NUEVO USUARIO AQUÍ TAMBIÉN SI QUIERES RESTRINGIR CAMBIOS ***
            //          if (nuevoUsuario.getTipoUsuario() != null && "administrador".equalsIgnoreCase(nuevoUsuario.getTipoUsuario().getTipo())) {
            //              adminExistente.setUsuarioRef(nuevoUsuario);
            //          } else {
            //              return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("El nuevo usuario seleccionado no es de tipo administrador.");
            //          }
            //     } else {
            //         return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Usuario no encontrado con ID: " + administradorActualizado.getUsuarioRef().getIdUsuario());
            //     }
            // }


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
            // Cambiar el estado (asegúrate que EstadoAdmin sea un Enum en tu modelo Administrador)
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

    // Este endpoint está bien aquí o en UsuarioController, como prefieras.
    // Simplemente busca un usuario por RU.
    @GetMapping("/usuarios/buscarPorRu/{ru}")
    public ResponseEntity<?> buscarUsuarioPorRu(@PathVariable int ru) {
        Optional<Usuario> usuario = usuarioRepository.findByRu(ru);
        if (usuario.isPresent()) {
            return ResponseEntity.ok(usuario.get());
        } else {
            // Devolvemos un error con mensaje si no se encuentra
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Usuario no encontrado con RU: " + ru);
        }
    }

    // Endpoint para eliminar administrador (si lo necesitas)
    // @DeleteMapping("/{id}")
    // public ResponseEntity<?> eliminarAdministrador(@PathVariable int id) {
    //     if (administradorRepository.existsById(id)) {
    //         administradorRepository.deleteById(id);
    //         return ResponseEntity.ok("Administrador eliminado exitosamente");
    //     } else {
    //         return ResponseEntity.status(HttpStatus.NOT_NOT_FOUND).body("Administrador no encontrado con ID: " + id);
    //     }
    // }
}