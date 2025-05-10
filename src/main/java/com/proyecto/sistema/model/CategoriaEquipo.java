package com.proyecto.sistema.model;

import jakarta.persistence.*;
import java.util.List;
import java.util.ArrayList;

@Entity
@Table(name = "Categorias_Equipos")
public class CategoriaEquipo {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int idCategoria; // Asegúrate que coincida con tu BD

    @Column(nullable = false, unique = true)
    private String nombreCategoria;

    // ESTA ENTIDAD ES LA DUEÑA - Tiene el @JoinTable
    @ManyToMany
    @JoinTable(
            name = "laboratorios_categorias", // Nombre de la tabla intermedia
            joinColumns = @JoinColumn(name = "id_categoria"), // Columna de esta entidad en la tabla intermedia
            inverseJoinColumns = @JoinColumn(name = "id_laboratorio") // Columna de la otra entidad
    )
    private List<Laboratorio> laboratorios = new ArrayList<>(); // Inicializar la lista

    // Getters y setters
    public int getIdCategoria() { return idCategoria; }
    public void setIdCategoria(int idCategoria) { this.idCategoria = idCategoria; }
    public String getNombreCategoria() { return nombreCategoria; }
    public void setNombreCategoria(String nombreCategoria) { this.nombreCategoria = nombreCategoria; }
    public List<Laboratorio> getLaboratorios() { return laboratorios; }
    public void setLaboratorios(List<Laboratorio> laboratorios) { this.laboratorios = laboratorios; }
    // ... puedes añadir métodos add/remove si los necesitas
}