package com.proyecto.sistema.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties; // Importar si la usas
import jakarta.persistence.*;


@Entity
@Table(name = "Administradores") // Asegúrate que el nombre de la tabla sea correcto
// Añadir si la usas para manejar proxies de Hibernate durante la serialización
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Administrador {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int idAdministrador;

    @Column(nullable = false, unique = true)
    private String usuario;

    @Column(nullable = false)
    private String contraseña; // ¡Seriamente, considera hashear esto!

    // *** MODIFICADO AQUÍ: Cambiado a FetchType.EAGER ***
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_usuario", nullable = false)
    private Usuario usuarioRef;

    // --- CAMPO ESTADO ---
    @Enumerated(EnumType.STRING) // Guarda el nombre del enum ('ACTIVO', 'INACTIVO') en la BD
    @Column(nullable = false)
    private EstadoAdmin estado = EstadoAdmin.ACTIVO; // Valor por defecto en Java
    // --- FIN CAMPO ESTADO ---


    // --- Getters and Setters ---

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


    // Este getter accede a usuarioRef. Ahora que usuarioRef es EAGER, esto no debería ser null si la FK en DB es NOT NULL
    public String getNombre() {
        // Añadir una verificación por ultra seguridad, aunque EAGER+NOT NULL en DB debería ser suficiente
        return this.usuarioRef != null ? this.usuarioRef.getNombre() : null;
    }

}