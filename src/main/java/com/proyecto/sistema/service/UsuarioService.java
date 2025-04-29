package com.proyecto.sistema.service;

import com.proyecto.sistema.model.Usuario;
import com.proyecto.sistema.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class UsuarioService {

    @Autowired
    private UsuarioRepository usuarioRepository;

    // Método para obtener usuario por RU y CI (en este caso, la contraseña es el CI)
    public Optional<Usuario> obtenerUsuarioPorRuYCi(int ru, int ci) {
        // Primero, obtenemos el usuario por su RU
        Optional<Usuario> usuario = usuarioRepository.findByRu(ru);

        if (usuario.isPresent()) {
            // Verificamos que el CI coincida
            if (usuario.get().getCi() == ci) {
                return usuario;  // Si CI y RU coinciden, devolvemos el usuario
            }
        }

        return Optional.empty();  // Si no coincide, devolvemos vacío
    }

    // Puedes agregar otros métodos según necesites, como obtener usuario por otro criterio
}

