package com.proyecto.sistema.service;

import com.proyecto.sistema.model.Administrador;
import com.proyecto.sistema.repository.AdministradorRepository;
import com.proyecto.sistema.utils.PasswordUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class AdministradorService {
    @Autowired
    private AdministradorRepository administradorRepository;

    public Administrador obtenerPorUsuarioYContraseña(String usuario, String contraseña) {
        Administrador admin = administradorRepository.findByUsuario(usuario).orElse(null);
        if (admin != null && PasswordUtils.checkPassword(contraseña, admin.getContraseña())) {
            return admin;
        }
        return null;
    }

    public Administrador obtenerPorUsuario(String usuario) {
        return administradorRepository.findByUsuario(usuario).orElse(null);
    }

    public void guardarAdministrador(Administrador administrador) {
        // Encripta la contraseña antes de guardar
        administrador.setContraseña(PasswordUtils.hashPassword(administrador.getContraseña()));
        administradorRepository.save(administrador);
    }
}