package com.proyecto.sistema.model;

import jakarta.persistence.*;
import java.util.List;

@Entity
@Table(name = "Categorias_Equipos") // Asegúrate de que el nombre de la tabla sea correcto
public class CategoriaEquipo {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int idCategoria;

    @Column(nullable = false, unique = true)
    private String nombreCategoria;

    @ManyToMany(mappedBy = "categoriasEquipo")
    private List<Laboratorio> laboratorios;

    // Getters y setters

    public int getIdCategoria() {
        return idCategoria;
    }

    public void setIdCategoria(int idCategoria) {
        this.idCategoria = idCategoria;
    }

    public String getNombreCategoria() {
        return nombreCategoria;
    }

    public void setNombreCategoria(String nombreCategoria) {
        this.nombreCategoria = nombreCategoria;
    }

    public List<Laboratorio> getLaboratorios() {
        return laboratorios;
    }

    public void setLaboratorios(List<Laboratorio> laboratorios) {
        this.laboratorios = laboratorios;
    }
}