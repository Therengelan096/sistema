package com.proyecto.sistema.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.util.List;

@Entity
@Table(name = "LaboratoriosE") // Asegúrate de que el nombre de la tabla sea correcto
@JsonIgnoreProperties({"equipos", "categoriasEquipo"})
public class Laboratorio {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int idLaboratorio;

    @Column(nullable = false, unique = true)
    private String nombre;

    // Aquí debes agregar el campo ubicacion
    @Column(nullable = false) // Asegúrate de que coincida con la configuración de tu base de datos
    private String ubicacion;

    @OneToMany(mappedBy = "laboratorio")
    private List<Equipo> equipos;

    @ManyToMany
    @JoinTable(
            name = "laboratorios_categorias", // Nombre de la tabla intermedia
            joinColumns = @JoinColumn(name = "id_laboratorio"),
            inverseJoinColumns = @JoinColumn(name = "id_categoria")
    )
    private List<CategoriaEquipo> categoriasEquipo;

    // Getters y setters

    public int getIdLaboratorio() {
        return idLaboratorio;
    }

    public void setIdLaboratorio(int idLaboratorio) {
        this.idLaboratorio = idLaboratorio;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    // Getters y setters para ubicacion
    public String getUbicacion() {
        return ubicacion;
    }

    public void setUbicacion(String ubicacion) {
        this.ubicacion = ubicacion;
    }

    public List<Equipo> getEquipos() {
        return equipos;
    }

    public void setEquipos(List<Equipo> equipos) {
        this.equipos = equipos;
    }

    public List<CategoriaEquipo> getCategoriasEquipo() {
        return categoriasEquipo;
    }

    public void setCategoriasEquipo(List<CategoriaEquipo> categoriasEquipo) {
        this.categoriasEquipo = categoriasEquipo;
    }
}