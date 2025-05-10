package com.proyecto.sistema.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonManagedReference; // Importar si es necesario para la relación con HorarioLaboratorio
import jakarta.persistence.*;
import java.util.List;
import java.util.ArrayList; // Importar para inicializar la lista si usas ArrayList

@Entity
@Table(name = "LaboratoriosE") // Mapea a la tabla LaboratoriosE
// JsonIgnoreProperties: Ignora estas propiedades al serializar a JSON para evitar ciclos infinitos o sobrecarga.
// Mantenemos la exclusión de 'categoriasEquipo' para las respuestas que devuelven Laboratorio.
@JsonIgnoreProperties({"equipos", "categoriasEquipo", "horarios"})
public class Laboratorio {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_laboratorio") // Columna ID en la base de datos
    private int idLaboratorio;

    @Column(nullable = false, unique = true) // Columna para el nombre del laboratorio
    private String nombre;

    @Column(nullable = false) // Columna para la ubicación
    private String ubicacion;

    // Relación OneToMany con Equipo (un Laboratorio tiene muchos Equipos)
    // mappedBy indica el campo en la entidad "muchos" (Equipo) que es el dueño de la relación.
    @OneToMany(mappedBy = "laboratorio", fetch = FetchType.LAZY) // FetchType.LAZY es recomendado para rendimiento
    private List<Equipo> equipos; // Lista de Equipos en este laboratorio

    // Relación ManyToMany con CategoriaEquipo (un Laboratorio tiene muchas Categorías, una Categoría está en muchos Laboratorios)
    // *** ESTA ES LA ENTIDAD INVERSA (NO DUEÑA) EN LA RELACIÓN MANY-TO-MANY ***
    // El @JoinTable debe estar en la ENTIDAD DUEÑA (CategoriaEquipo.java)
    // *** Quitamos la anotación @JoinTable de aquí ***

    // mappedBy="laboratorios" indica que la relación es gestionada por el campo 'laboratorios' en la clase CategoriaEquipo
    @ManyToMany(mappedBy = "laboratorios") // <- Asegúrate de que "laboratorios" coincide con el nombre del campo en CategoriaEquipo
    private List<CategoriaEquipo> categoriasEquipo = new ArrayList<>(); // Inicializa la lista (opcional pero buena práctica)

    // Relación OneToMany con HorarioLaboratorio (un Laboratorio tiene muchos Horarios)
    // mappedBy indica el campo en HorarioLaboratorio que es el dueño de la relación.
    // CascadeType.ALL: Las operaciones (persistir, actualizar, eliminar) se propagan a los horarios.
    // orphanRemoval=true: Si un horario se quita de la lista, se elimina de la BD.
    // FetchType.LAZY es recomendado.
    @OneToMany(mappedBy = "laboratorio", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @JsonManagedReference // Usar si HorarioLaboratorio tiene @JsonBackReference apuntando a Laboratorio
    private List<HorarioLaboratorio> horarios = new ArrayList<>(); // Inicializa la lista

    // --- Getters y Setters ---
    // (Spring Data JPA puede a veces inferir setters si no están, pero es buena práctica incluirlos)

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

    public List<HorarioLaboratorio> getHorarios() {
        return horarios;
    }

    public void setHorarios(List<HorarioLaboratorio> horarios) {
        this.horarios = horarios;
    }
}