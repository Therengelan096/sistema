package com.proyecto.sistema.model;

import jakarta.persistence.*;
import java.util.Date;
import java.time.LocalTime;

@Entity
@Table(name = "Devolucion")
public class Devolucion {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int idDevolucion;

    @ManyToOne
    @JoinColumn(name = "id_prestamo", nullable = false)
    private Prestamo prestamo;

    @Column(nullable = false)
    private Date fechaDevolucion;

    @Column(nullable = false)
    private LocalTime horaDevolucion;  // Cambiado a LocalTime.

    @Column(nullable = false)
    private String estadoEquipoAlDevolver;

    @Column
    private String observaciones;

    // Getters y setters
    public int getIdDevolucion() {
        return idDevolucion;
    }

    public void setIdDevolucion(int idDevolucion) {
        this.idDevolucion = idDevolucion;
    }

    public Prestamo getPrestamo() {
        return prestamo;
    }

    public void setPrestamo(Prestamo prestamo) {
        this.prestamo = prestamo;
    }

    public Date getFechaDevolucion() {
        return fechaDevolucion;
    }

    public void setFechaDevolucion(Date fechaDevolucion) {
        this.fechaDevolucion = fechaDevolucion;
    }

    public LocalTime getHoraDevolucion() {
        return horaDevolucion;
    }

    public void setHoraDevolucion(LocalTime horaDevolucion) {
        this.horaDevolucion = horaDevolucion;
    }

    public String getEstadoEquipoAlDevolver() {
        return estadoEquipoAlDevolver;
    }

    public void setEstadoEquipoAlDevolver(String estadoEquipoAlDevolver) {
        this.estadoEquipoAlDevolver = estadoEquipoAlDevolver;
    }

    public String getObservaciones() {
        return observaciones;
    }

    public void setObservaciones(String observaciones) {
        this.observaciones = observaciones;
    }
}