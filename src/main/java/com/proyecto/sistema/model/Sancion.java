package com.proyecto.sistema.model;

import jakarta.persistence.*;
import java.util.Date;

@Entity
@Table(name = "Sanciones")
public class Sancion {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int idSancion;

    @ManyToOne
    @JoinColumn(name = "id_usuario", nullable = false)
    private Usuario usuario;

    @Column(nullable = false)
    private String motivoSancion;

    @Column(nullable = false)
    private Date fechaSancion;

    @Column(nullable = false)
    private String estado;

    // Getters y setters
    public int getIdSancion() {
        return idSancion;
    }

    public void setIdSancion(int idSancion) {
        this.idSancion = idSancion;
    }

    public Usuario getUsuario() {
        return usuario;
    }

    public void setUsuario(Usuario usuario) {
        this.usuario = usuario;
    }

    public String getMotivoSancion() {
        return motivoSancion;
    }

    public void setMotivoSancion(String motivoSancion) {
        this.motivoSancion = motivoSancion;
    }

    public Date getFechaSancion() {
        return fechaSancion;
    }

    public void setFechaSancion(Date fechaSancion) {
        this.fechaSancion = fechaSancion;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }
}