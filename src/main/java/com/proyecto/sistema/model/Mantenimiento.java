package com.proyecto.sistema.model;

import jakarta.persistence.*;
import java.util.Date;
import java.util.List;

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
    @Temporal(TemporalType.DATE)
    private Date fechaMantenimiento;

    @Column(nullable = false)
    private int cantidad;

    @OneToMany(mappedBy = "mantenimiento", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<DetalleMantenimiento> detalles;

    // Getters y setters
    public int getIdMantenimiento() { return idMantenimiento; }
    public void setIdMantenimiento(int idMantenimiento) { this.idMantenimiento = idMantenimiento; }
    public Equipo getEquipo() { return equipo; }
    public void setEquipo(Equipo equipo) { this.equipo = equipo; }
    public Date getFechaMantenimiento() { return fechaMantenimiento; }
    public void setFechaMantenimiento(Date fechaMantenimiento) { this.fechaMantenimiento = fechaMantenimiento; }
    public int getCantidad (){return cantidad;}
    public void setCantidad(int cantidad){this.cantidad = cantidad;}
    public List<DetalleMantenimiento> getDetalles() { return detalles; }
    public void setDetalles(List<DetalleMantenimiento> detalles) { this.detalles = detalles; }
}