package com.proyecto.sistema.service;

import com.proyecto.sistema.model.Sancion;
import com.proyecto.sistema.model.Usuario;
import com.proyecto.sistema.repository.SancionRepository;
import com.proyecto.sistema.repository.UsuarioRepository; // Necesario
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

@Service
public class SancionService {

    private final SancionRepository sancionRepository;
    private final UsuarioRepository usuarioRepository;

    @Autowired
    public SancionService(SancionRepository sancionRepository, UsuarioRepository usuarioRepository) {
        this.sancionRepository = sancionRepository;
        this.usuarioRepository = usuarioRepository;
    }

    @Transactional(readOnly = true)
    public List<Sancion> obtenerSancionesPorIdUsuario(Integer idUsuario) {
        if (idUsuario == null) {
            return Collections.emptyList();
        }
        Optional<Usuario> usuarioOpt = usuarioRepository.findById(idUsuario);
        if (usuarioOpt.isPresent()) {
            // Asumiendo que SancionRepository tiene: List<Sancion> findByUsuario(Usuario usuario);
            return sancionRepository.findByUsuario(usuarioOpt.get());
        }
        return Collections.emptyList();
    }
    // Otros métodos de servicio para sanciones...
}
