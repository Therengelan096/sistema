package com.proyecto.sistema.model;

import jakarta.persistence.*;
import java.util.Date; // O java.time.LocalDate si prefieres las nuevas APIs de fecha

@Entity
@Table(name = "instancias_equipo") // Asegúrate que el nombre de la tabla sea exactamente este
public class InstanciaEquipo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_instancia")
    private int idInstancia;

    // Esta es la clave foránea a la tabla 'equipos'.
    // Usamos @ManyToOne para mapear la relación, donde muchas instancias pertenecen a un tipo de Equipo.
    @ManyToOne(fetch = FetchType.LAZY) // LAZY para cargar el Equipo solo cuando sea necesario
    @JoinColumn(name = "id_equipo", nullable = false) // 'id_equipo' es el nombre de la columna FK en la DB
    private Equipo equipo; // Relación con la entidad Equipo

    @Column(name = "codigo_activo", unique = true, nullable = false)
    private String codigoActivo;

    // Mapeo para el ENUM de la base de datos. Lo manejamos como String en Java por simplicidad.
    @Column(name = "estado_individual", nullable = false)
    private String estadoIndividual; // Usará los valores 'disponible', 'prestado', etc.

    // Hemos quitado id_laboratorio_actual según la última versión simple de la tabla.
    // Si necesitas añadirlo de vuelta, agrégalo aquí como un INT o Long y decide si quieres mapearlo a una entidad Laboratorio si existe.

    @Column(name = "fecha_adquisicion")
    @Temporal(TemporalType.DATE) // Indica que solo guardaremos la fecha
    private Date fechaAdquisicion; // Campo opcional

    @Column(name = "notas")
    private String notas; // Campo opcional

    // --- Getters y Setters ---
    public int getIdInstancia() {
        return idInstancia;
    }

    public void setIdInstancia(int idInstancia) {
        this.idInstancia = idInstancia;
    }

    public Equipo getEquipo() {
        return equipo;
    }

    public void setEquipo(Equipo equipo) {
        this.equipo = equipo;
    }

    public String getCodigoActivo() {
        return codigoActivo;
    }

    public void setCodigoActivo(String codigoActivo) {
        this.codigoActivo = codigoActivo;
    }

    public String getEstadoIndividual() {
        return estadoIndividual;
    }

    public void setEstadoIndividual(String estadoIndividual) {
        this.estadoIndividual = estadoIndividual;
    }

    public Date getFechaAdquisicion() {
        return fechaAdquisicion;
    }

    public void setFechaAdquisicion(Date fechaAdquisicion) {
        this.fechaAdquisicion = fechaAdquisicion;
    }

    public String getNotas() {
        return notas;
    }

    public void setNotas(String notas) {
        this.notas = notas;
    }

    // Considera agregar constructores si los necesitas

    // Opcional: toString(), equals(), hashCode() si son necesarios
}
