package com.proyecto.sistema.service;

import com.proyecto.sistema.model.Administrador;
import com.proyecto.sistema.repository.AdministradorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class AdministradorService {
    @Autowired
    private AdministradorRepository administradorRepository;

    public Administrador obtenerPorUsuarioYContraseña(String usuario, String contraseña) {
        Optional<Administrador> adminOptional = administradorRepository.findByUsuarioAndContraseña(usuario, contraseña);
        return adminOptional.orElse(null);
    }
    public Administrador obtenerPorUsuario(String usuario) {
        return administradorRepository.findByUsuario(usuario).orElse(null);
    }

}