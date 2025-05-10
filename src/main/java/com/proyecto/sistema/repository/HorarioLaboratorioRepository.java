package com.proyecto.sistema.repository;

import com.proyecto.sistema.model.HorarioLaboratorio;
import com.proyecto.sistema.model.Laboratorio;
import com.proyecto.sistema.model.DiaSemana;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface HorarioLaboratorioRepository extends JpaRepository<HorarioLaboratorio, Integer> {
    List<HorarioLaboratorio> findByLaboratorio(Laboratorio laboratorio);
    Optional<HorarioLaboratorio> findByLaboratorioAndDiaSemanaAndHoraInicio(Laboratorio laboratorio, DiaSemana diaSemana, LocalTime horaInicio);
    List<HorarioLaboratorio> findByLaboratorioIdLaboratorioOrderByDiaSemanaAscHoraInicioAsc(int idLaboratorio);
}

