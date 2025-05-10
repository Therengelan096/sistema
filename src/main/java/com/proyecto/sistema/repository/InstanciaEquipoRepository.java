
package com.proyecto.sistema.repository;

import com.proyecto.sistema.model.InstanciaEquipo;
import com.proyecto.sistema.model.Equipo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface InstanciaEquipoRepository extends JpaRepository<InstanciaEquipo, Integer> {
    @Query("SELECT i FROM InstanciaEquipo i JOIN FETCH i.equipo WHERE i.equipo = :equipo")
    List<InstanciaEquipo> findByEquipo(@Param("equipo") Equipo equipo);

    InstanciaEquipo findByCodigoActivo(String codigoActivo);
    List<InstanciaEquipo> findByEstadoIndividual(String estadoIndividual);
}
