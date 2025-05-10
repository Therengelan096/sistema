package com.proyecto.sistema.controller;

import com.proyecto.sistema.model.Administrador;
import com.proyecto.sistema.model.TipoUsuario;
import com.proyecto.sistema.model.Usuario;
import com.proyecto.sistema.service.AdministradorService;
import com.proyecto.sistema.service.UsuarioService;
import jakarta.servlet.http.HttpServletRequest; // AÑADIDO
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
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
    private UsuarioService usuarioService; // Usarás el UsuarioService que proporcionaste

    @GetMapping
    public String mostrarLogin() {
        return "redirect:/login.html"; // Asume que login.html está en static
    }

    @PostMapping
    public void procesarLogin(@RequestParam String usuario, @RequestParam String contraseña,
                              HttpServletRequest request, // AÑADIDO para getContextPath
                              HttpServletResponse response, HttpSession session) throws IOException {
        try {
            Integer ru = null;
            boolean isNumericUser = false;
            try {
                ru = Integer.parseInt(usuario);
                isNumericUser = true;
            } catch (NumberFormatException e) {
                isNumericUser = false;
            }

            Administrador admin = null;
            if (!isNumericUser) {
                // Asumo que tienes un método para buscar admin por usuario y contraseña
                // Si no, deberías implementarlo en AdministradorService
                admin = administradorService.obtenerPorUsuarioYContraseña(usuario, contraseña);
            }

            if (admin != null) {
                // Lógica para administrador
                if (admin.getEstado() == com.proyecto.sistema.model.EstadoAdmin.ACTIVO) { // Asegúrate que EstadoAdmin sea accesible
                    if (admin.getUsuarioRef() != null) { // Asumo que Administrador tiene una referencia a Usuario
                        session.setAttribute("idUsuario", admin.getUsuarioRef().getIdUsuario());
                    }
                    response.sendRedirect(request.getContextPath() + "/menuprincipal.html"); // O la ruta del dashboard de admin
                } else {
                    response.sendRedirect(request.getContextPath() + "/login.html?error=disabled");
                }
            } else if (isNumericUser) {
                try {
                    int ci = Integer.parseInt(contraseña);
                    // Usamos el método de tu UsuarioService
                    Optional<Usuario> usuarioEncontradoOpt = usuarioService.obtenerUsuarioPorRuYCi(ru, ci);

                    if (usuarioEncontradoOpt.isPresent()) {
                        Usuario usuarioEncontrado = usuarioEncontradoOpt.get();
                        TipoUsuario tipoUsuario = usuarioEncontrado.getTipoUsuario();

                        if (tipoUsuario != null) {
                            session.setAttribute("idUsuario", usuarioEncontrado.getIdUsuario());

                            if ("docente".equalsIgnoreCase(tipoUsuario.getTipo()) || "estudiante".equalsIgnoreCase(tipoUsuario.getTipo())) {
                                response.sendRedirect(request.getContextPath() + "/usuario/dashboard"); // Redirección al UserController
                            } else {
                                // Tipo no esperado pero logueado, quizás un dashboard genérico o error
                                response.sendRedirect(request.getContextPath() + "/login.html?error=unknown_type");
                            }
                        } else {
                            // Usuario sin tipo asignado
                            response.sendRedirect(request.getContextPath() + "/login.html?error=no_type");
                        }
                    } else {
                        // RU o CI incorrectos
                        response.sendRedirect(request.getContextPath() + "/login.html?error=invalid_credentials");
                    }
                } catch (NumberFormatException e) {
                    // Contraseña (CI) no numérica
                    response.sendRedirect(request.getContextPath() + "/login.html?error=ci_format");
                }
            } else {
                // Usuario no numérico (no admin) y no encontrado
                response.sendRedirect(request.getContextPath() + "/login.html?error=not_found");
            }

        } catch (Exception e) {
            e.printStackTrace();
            if (!response.isCommitted()) {
                response.sendRedirect(request.getContextPath() + "/login.html?error=true");
            }
        }
    }
}
