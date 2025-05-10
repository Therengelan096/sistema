package com.proyecto.sistema.model;

import com.fasterxml.jackson.annotation.JsonBackReference; // Importar
import jakarta.persistence.*;
import java.time.LocalTime;

@Entity
@Table(name = "Horario_Laboratorio", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"id_laboratorio", "dia_semana", "hora_inicio"})
})
public class HorarioLaboratorio {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_horario")
    private int idHorario;

    @ManyToOne(fetch = FetchType.LAZY) // LAZY es buena práctica
    @JoinColumn(name = "id_laboratorio", nullable = false)
    @JsonBackReference // Para evitar recursión infinita con Laboratorio
    private Laboratorio laboratorio;

    @Enumerated(EnumType.STRING)
    @Column(name = "dia_semana", nullable = false)
    private DiaSemana diaSemana;

    @Column(name = "hora_inicio", nullable = false)
    private LocalTime horaInicio;

    @Column(name = "hora_fin", nullable = false)
    private LocalTime horaFin;

    @Column(name = "ocupado", nullable = false)
    private boolean ocupado = false;

    // Constructores, Getters y Setters (sin cambios)
    public HorarioLaboratorio() {
    }

    public HorarioLaboratorio(Laboratorio laboratorio, DiaSemana diaSemana, LocalTime horaInicio, LocalTime horaFin, boolean ocupado) {
        this.laboratorio = laboratorio;
        this.diaSemana = diaSemana;
        this.horaInicio = horaInicio;
        this.horaFin = horaFin;
        this.ocupado = ocupado;
    }

    public int getIdHorario() {
        return idHorario;
    }

    public void setIdHorario(int idHorario) {
        this.idHorario = idHorario;
    }

    public Laboratorio getLaboratorio() {
        return laboratorio;
    }

    public void setLaboratorio(Laboratorio laboratorio) {
        this.laboratorio = laboratorio;
    }

    public DiaSemana getDiaSemana() {
        return diaSemana;
    }

    public void setDiaSemana(DiaSemana diaSemana) {
        this.diaSemana = diaSemana;
    }

    public LocalTime getHoraInicio() {
        return horaInicio;
    }

    public void setHoraInicio(LocalTime horaInicio) {
        this.horaInicio = horaInicio;
    }

    public LocalTime getHoraFin() {
        return horaFin;
    }

    public void setHoraFin(LocalTime horaFin) {
        this.horaFin = horaFin;
    }

    public boolean isOcupado() {
        return ocupado;
    }

    public void setOcupado(boolean ocupado) {
        this.ocupado = ocupado;
    }
}
