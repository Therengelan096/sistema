package com.proyecto.sistema.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonManagedReference; // Importar
import jakarta.persistence.*;
import java.util.List;

@Entity
@Table(name = "LaboratoriosE")
// JsonIgnoreProperties para evitar la carga recursiva o excesiva de datos relacionados al serializar.
// Añadimos "horarios" aquí también si no queremos que se serialice por defecto al obtener un Laboratorio.
// Si lo necesitas en el JSON del laboratorio, puedes quitarlo de aquí y manejarlo cuidadosamente.
@JsonIgnoreProperties({"equipos", "categoriasEquipo", "horarios"})
public class Laboratorio {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_laboratorio") // Asegúrate que coincida con tu BD, el tuyo no tenía name=
    private int idLaboratorio;

    @Column(nullable = false, unique = true)
    private String nombre;

    @Column(nullable = false)
    private String ubicacion;

    @OneToMany(mappedBy = "laboratorio", fetch = FetchType.LAZY) // LAZY es importante
    private List<Equipo> equipos;

    @ManyToMany
    @JoinTable(
            name = "laboratorios_categorias",
            joinColumns = @JoinColumn(name = "id_laboratorio"),
            inverseJoinColumns = @JoinColumn(name = "id_categoria")
    )
    private List<CategoriaEquipo> categoriasEquipo; // Cambié el nombre para coincidir con tu getter/setter

    // Nueva relación con HorarioLaboratorio
    @OneToMany(mappedBy = "laboratorio", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @JsonManagedReference // Usar si HorarioLaboratorio tiene @JsonBackReference a Laboratorio
    private List<HorarioLaboratorio> horarios;

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
