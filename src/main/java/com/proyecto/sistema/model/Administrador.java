package com.proyecto.sistema.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;

@Entity
@Table(name = "Administradores")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Administrador {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int idAdministrador;

    @Column(nullable = false, unique = true)
    private String usuario;

    @Column(nullable = false, length = 255)  // Aumentado a 255 para almacenar hash BCrypt
    private String contraseña;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_usuario", nullable = false)
    private Usuario usuarioRef;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EstadoAdmin estado = EstadoAdmin.ACTIVO;

    // Constructor por defecto necesario para JPA
    public Administrador() {}

    // Constructor con campos principales
    public Administrador(String usuario, String contraseña, Usuario usuarioRef) {
        this.usuario = usuario;
        this.contraseña = contraseña;
        this.usuarioRef = usuarioRef;
        this.estado = EstadoAdmin.ACTIVO;
    }

    // Getters y Setters
    public int getIdAdministrador() { return idAdministrador; }
    public void setIdAdministrador(int idAdministrador) { this.idAdministrador = idAdministrador; }

    public String getUsuario() { return usuario; }
    public void setUsuario(String usuario) { this.usuario = usuario; }

    public String getContraseña() { return contraseña; }
    public void setContraseña(String contraseña) { this.contraseña = contraseña; }

    public Usuario getUsuarioRef() { return usuarioRef; }
    public void setUsuarioRef(Usuario usuarioRef) { this.usuarioRef = usuarioRef; }

    public EstadoAdmin getEstado() { return estado; }
    public void setEstado(EstadoAdmin estado) { this.estado = estado; }

    public String getNombre() {
        return this.usuarioRef != null ? this.usuarioRef.getNombre() : null;
    }

    @Override
    public String toString() {
        return "Administrador{" +
                "idAdministrador=" + idAdministrador +
                ", usuario='" + usuario + '\'' +
                ", estado=" + estado +
                '}';
    }
}