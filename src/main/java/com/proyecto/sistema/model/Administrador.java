package com.proyecto.sistema.model;

import jakarta.persistence.*;


@Entity
@Table(name = "Administradores") // Asegúrate que el nombre de la tabla sea correcto
public class Administrador {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int idAdministrador;

    @Column(nullable = false, unique = true)
    private String usuario;

    @Column(nullable = false)
    private String contraseña; // Considera seriamente hashear esto

    @ManyToOne
    @JoinColumn(name = "id_usuario", nullable = false)
    private Usuario usuarioRef;

    // --- NUEVO CAMPO ESTADO ---
    @Enumerated(EnumType.STRING) // Guarda el nombre del enum ('ACTIVO', 'INACTIVO') en la BD
    @Column(nullable = false /*, columnDefinition = "ENUM('ACTIVO', 'INACTIVO') DEFAULT 'ACTIVO'" */)
    // columnDefinition es opcional si JPA/Hibernate maneja la creación/validación
    // Si la tabla ya existe con el default, JPA debería respetarlo al leer/escribir.
    // Asegúrate que el valor por defecto en la BD funcione como esperas al crear nuevas entidades sin setear el estado explícitamente.
    private EstadoAdmin estado = EstadoAdmin.ACTIVO; // Valor por defecto en Java también
    // --- FIN NUEVO CAMPO ---

    // Getters and Setters existentes...

    // --- GETTER Y SETTER PARA ESTADO ---
    public EstadoAdmin getEstado() {
        return estado;
    }

    public void setEstado(EstadoAdmin estado) {
        this.estado = estado;
    }
    // --- FIN GETTER Y SETTER ---

    // Resto de Getters y Setters...
    public int getIdAdministrador() { return idAdministrador; }
    public void setIdAdministrador(int idAdministrador) { this.idAdministrador = idAdministrador; }
    public String getUsuario() { return usuario; }
    public void setUsuario(String usuario) { this.usuario = usuario; }
    public String getContraseña() { return contraseña; }
    public void setContraseña(String contraseña) { this.contraseña = contraseña; }
    public Usuario getUsuarioRef() { return usuarioRef; }
    public void setUsuarioRef(Usuario usuarioRef) { this.usuarioRef = usuarioRef; }
}
