package com.proyecto.sistema.repository;

import com.proyecto.sistema.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UsuarioRepository extends JpaRepository<Usuario, Integer> {
}