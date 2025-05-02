package com.proyecto.sistema.model;

import jakarta.persistence.*;
import java.util.Date;

@Entity
@Table(name = "Mantenimiento")
public class Mantenimiento {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int idMantenimiento;

    @ManyToOne
    @JoinColumn(name = "id_equipo", nullable = false)
    private Equipo equipo;

    @Column(nullable = false)
    @Temporal(TemporalType.DATE) // Especifica el tipo de dato como DATE
    private Date fechaMantenimiento;

    @Column(nullable = false)
    private String estadoInicial;

    @Column(nullable = false)
    private String estadoFinal;

    @Column
    private String descripcionProblema;

    @Column
    private String solucionAplicada;
    // Getters y setters
    public int getIdMantenimiento() { return idMantenimiento; }
    public void setIdMantenimiento(int idMantenimiento) { this.idMantenimiento = idMantenimiento; }
    public Equipo getEquipo() { return equipo; }
    public void setEquipo(Equipo equipo) { this.equipo = equipo; }
    public Date getFechaMantenimiento() { return fechaMantenimiento; }
    public void setFechaMantenimiento(Date fechaMantenimiento) { this.fechaMantenimiento = fechaMantenimiento; }
    public String getEstadoInicial() { return estadoInicial; }
    public void setEstadoInicial(String estadoInicial) { this.estadoInicial = estadoInicial; }
    public String getEstadoFinal() { return estadoFinal; }
    public void setEstadoFinal(String estadoFinal) { this.estadoFinal = estadoFinal; }
    public String getDescripcionProblema() { return descripcionProblema; }
    public void setDescripcionProblema(String descripcionProblema) { this.descripcionProblema = descripcionProblema; }
    public String getSolucionAplicada() { return solucionAplicada; }
    public void setSolucionAplicada(String solucionAplicada) { this.solucionAplicada = solucionAplicada; }
}