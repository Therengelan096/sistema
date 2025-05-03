package com.proyecto.sistema.repository;

import com.proyecto.sistema.model.InstanciaEquipo;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface InstanciaEquipoRepository extends JpaRepository<InstanciaEquipo, Integer> {
    // Puedes agregar métodos de consulta personalizados aquí si los necesitas
    // Por ejemplo:
    List<InstanciaEquipo> findByEquipo(com.proyecto.sistema.model.Equipo equipo);
    InstanciaEquipo findByCodigoActivo(String codigoActivo);
    List<InstanciaEquipo> findByEstadoIndividual(String estadoIndividual);
}
