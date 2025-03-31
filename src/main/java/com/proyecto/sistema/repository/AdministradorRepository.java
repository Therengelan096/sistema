package com.proyecto.sistema.repository;
import com.proyecto.sistema.model.Administrador;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AdministradorRepository extends JpaRepository<Administrador, Integer> {
    Optional<Administrador> findByUsuarioAndContraseña(String usuario, String contraseña);
}