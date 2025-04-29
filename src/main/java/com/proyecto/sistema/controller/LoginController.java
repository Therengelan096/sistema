package com.proyecto.sistema.controller;

import com.proyecto.sistema.model.Administrador;
import com.proyecto.sistema.model.TipoUsuario;
import com.proyecto.sistema.model.Usuario;
import com.proyecto.sistema.service.AdministradorService;
import com.proyecto.sistema.service.UsuarioService; // Importa el UsuarioService
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.io.IOException;
import java.util.Optional;

@Controller
@RequestMapping("/login")
public class LoginController {

    @Autowired
    private AdministradorService administradorService;

    @Autowired
    private UsuarioService usuarioService; // Usamos el UsuarioService

    @PostMapping
    public void procesarLogin(@RequestParam String usuario, @RequestParam String contraseña, HttpServletResponse response, HttpSession session) throws IOException {
        // Primero, intentamos autenticar al administrador
        Administrador admin = administradorService.obtenerPorUsuarioYContraseña(usuario, contraseña);

        if (admin != null) {
            // Si el administrador existe, validamos si su estado es activo
            if (admin.getEstado() == com.proyecto.sistema.model.EstadoAdmin.ACTIVO) {
                // Guardamos el ID del usuario relacionado en la sesión
                session.setAttribute("idUsuario", admin.getUsuarioRef().getIdUsuario());

                // Redirigimos al menú principal para administradores
                response.sendRedirect("/menuprincipal.html");
            } else {
                // Si el administrador está inactivo
                response.sendRedirect("/login.html?error=disabled");
            }
        } else {
            // Si no es administrador, buscamos al usuario por RU y CI
            int ru = Integer.parseInt(usuario);
            int ci = Integer.parseInt(contraseña);

            Optional<Usuario> usuarioEncontradoOpt = usuarioService.obtenerUsuarioPorRuYCi(ru, ci); // Usamos el servicio

            if (usuarioEncontradoOpt.isPresent()) {
                Usuario usuarioEncontrado = usuarioEncontradoOpt.get();
                // Si encontramos un usuario, obtenemos su tipo
                TipoUsuario tipoUsuario = usuarioEncontrado.getTipoUsuario();

                if (tipoUsuario != null) {
                    // Si el tipo de usuario es "administrador", ya lo hemos manejado arriba
                    if ("administrador".equalsIgnoreCase(tipoUsuario.getTipo())) {
                        // Si es un administrador, lo redirigimos al menú principal
                        session.setAttribute("idUsuario", usuarioEncontrado.getIdUsuario());
                        response.sendRedirect("/menuprincipal.html");
                    }
                    // Si el tipo de usuario es "docente", redirigimos a la interfaz de docente
                    else if ("docente".equalsIgnoreCase(tipoUsuario.getTipo())) {
                        session.setAttribute("idUsuario", usuarioEncontrado.getIdUsuario());
                        response.sendRedirect("/docentes.html"); // Redirige a la interfaz de docente
                    }
                    // Si el tipo de usuario es "estudiante", redirigimos a la interfaz de estudiante
                    else if ("estudiante".equalsIgnoreCase(tipoUsuario.getTipo())) {
                        session.setAttribute("idUsuario", usuarioEncontrado.getIdUsuario());
                        response.sendRedirect("/estudiantes.html"); // Redirige a la interfaz de estudiante
                    } else {
                        // Si no es administrador, docente o estudiante, redirigir con error
                        response.sendRedirect("/login.html?error=invalidType");
                    }
                }
            } else {
                // Si no encontramos al usuario
                response.sendRedirect("/login.html?error=true");
            }
        }
    }
}
