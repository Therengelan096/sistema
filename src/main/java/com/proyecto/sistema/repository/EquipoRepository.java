// En EquipoRepository.java
package com.proyecto.sistema.repository;

import com.proyecto.sistema.model.CategoriaEquipo;
import com.proyecto.sistema.model.Equipo;
import com.proyecto.sistema.model.Laboratorio;
import com.proyecto.sistema.model.InstanciaEquipo; // Podrías necesitar InstanciaEquipo aquí también para consultas futuras
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query; // Importar Query

import java.util.List;

public interface EquipoRepository extends JpaRepository<Equipo, Integer> {
    // Métodos existentes
    List<Equipo> findByLaboratorio(Laboratorio laboratorio);
    List<Equipo> findByLaboratorioAndCategoria(Laboratorio laboratorio, CategoriaEquipo categoria);

    @Query("SELECT e FROM Equipo e JOIN FETCH e.categoria JOIN FETCH e.laboratorio")
    List<Equipo> findAllWithCategoriaAndLaboratorio();
}
