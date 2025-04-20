package com.proyecto.sistema.repository;

import com.proyecto.sistema.model.Prestamo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PrestamoRepository extends JpaRepository<Prestamo, Integer> {
    List<Prestamo> findByEstado(String estado);
}