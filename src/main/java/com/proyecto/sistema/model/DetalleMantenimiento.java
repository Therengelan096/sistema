package com.proyecto.sistema.model;

import jakarta.persistence.*;

@Entity
@Table(name = "Detalle_Mantenimiento")
public class DetalleMantenimiento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int idDetalleMant;

    @ManyToOne
    @JoinColumn(name = "id_mantenimiento", nullable = false)
    private Mantenimiento mantenimiento;

    @ManyToOne
    @JoinColumn(name = "id_instancia", nullable = false)
    private InstanciaEquipo instanciaEquipo;

    @Column(name = "estado_inicial", nullable = false)
    private String estadoInicial;

    @Column(name = "estado_final", nullable = false)
    private String estadoFinal;

    @Column(name = "descripcion_problema", columnDefinition = "TEXT")
    private String problema;

    @Column(name = "solucion_aplicada", columnDefinition = "TEXT")
    private String solucion;

    @Column(nullable = false)
    private String fase;

    // Getters y Setters (mantener los nombres de los campos de la entidad)
    public int getIdDetalleMant() {
        return idDetalleMant;
    }

    public void setIdDetalleMant(int idDetalleMant) {
        this.idDetalleMant = idDetalleMant;
    }

    public Mantenimiento getMantenimiento() {
        return mantenimiento;
    }

    public void setMantenimiento(Mantenimiento mantenimiento) {
        this.mantenimiento = mantenimiento;
    }

    public InstanciaEquipo getInstanciaEquipo() {
        return instanciaEquipo;
    }

    public void setInstanciaEquipo(InstanciaEquipo instanciaEquipo) {
        this.instanciaEquipo = instanciaEquipo;
    }

    public String getEstadoInicial() {
        return estadoInicial;
    }

    public void setEstadoInicial(String estadoInicial) {
        this.estadoInicial = estadoInicial;
    }

    public String getEstadoFinal() {
        return estadoFinal;
    }

    public void setEstadoFinal(String estadoFinal) {
        this.estadoFinal = estadoFinal;
    }

    public String getProblema() {
        return problema;
    }

    public void setProblema(String problema) {
        this.problema = problema;
    }

    public String getSolucion() {
        return solucion;
    }

    public void setSolucion(String solucion) {
        this.solucion = solucion;
    }

    public String getFase() {
        return fase;
    }

    public void setFase(String fase) {
        this.fase = fase;
    }
}