package com.proyecto.sistema.service;

import com.proyecto.sistema.model.Administrador;
import com.proyecto.sistema.repository.AdministradorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class AdministradorService {
    @Autowired
    private AdministradorRepository administradorRepository;

    public boolean autenticar(String usuario, String contraseña) {
        return administradorRepository.findByUsuarioAndContraseña(usuario, contraseña).isPresent();
    }
    public Administrador obtenerPorUsuario(String usuario) {
        return administradorRepository.findByUsuario(usuario).orElse(null);
    }

}
