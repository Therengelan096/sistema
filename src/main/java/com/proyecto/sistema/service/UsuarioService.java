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

    // Método para obtener usuario por RU y CI (contraseña es el CI)
    // Este es el método que tú proporcionaste
    public Optional<Usuario> obtenerUsuarioPorRuYCi(int ru, int ci) {
        Optional<Usuario> usuario = usuarioRepository.findByRu(ru); // Asumiendo que findByRu existe en UsuarioRepository

        if (usuario.isPresent()) {
            if (usuario.get().getCi() == ci) { // Compara el CI del usuario con el CI proporcionado
                return usuario;
            }
        }
        return Optional.empty();
    }

    // Método para obtener usuario por su ID (PK)
    public Optional<Usuario> obtenerUsuarioPorId(Integer idUsuario) {
        if (idUsuario == null) {
            return Optional.empty();
        }
        return usuarioRepository.findById(idUsuario);
    }
    // Otros métodos del servicio de usuario si los necesitas...
}
