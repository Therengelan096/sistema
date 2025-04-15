package com.proyecto.sistema.controller;

import com.proyecto.sistema.model.Administrador;
import com.proyecto.sistema.service.AdministradorService;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.io.IOException;

@Controller
@RequestMapping("/login")
public class LoginController {

    @Autowired
    private AdministradorService administradorService;

    @PostMapping
    public void procesarLogin(@RequestParam String usuario, @RequestParam String contraseña, HttpServletResponse response, HttpSession session) throws IOException {
        Administrador admin = administradorService.obtenerPorUsuarioYContraseña(usuario, contraseña);

        if (admin != null) {
            if (admin.getEstado() == com.proyecto.sistema.model.EstadoAdmin.ACTIVO) {
                // Guardamos el ID del usuario relacionado en la sesión
                session.setAttribute("idUsuario", admin.getUsuarioRef().getIdUsuario());

                // Redirigimos al menú principal
                response.sendRedirect("/menuprincipal.html");
            } else {
                // Redirige al login con un parámetro de error de administrador inhabilitado
                response.sendRedirect("/login.html?error=disabled");
            }
        } else {
            // Redirige al login con un parámetro de error de credenciales incorrectas
            response.sendRedirect("/login.html?error=true");
        }
    }
}