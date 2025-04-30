package com.proyecto.sistema.controller;

import com.proyecto.sistema.model.Administrador;
import com.proyecto.sistema.model.TipoUsuario;
import com.proyecto.sistema.model.Usuario;
import com.proyecto.sistema.service.AdministradorService;
import com.proyecto.sistema.service.UsuarioService;
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
    private UsuarioService usuarioService;

    // Método para manejar la solicitud GET a /login
    // Simplemente redirige a la ubicación estática del archivo login.html
    @GetMapping
    public String mostrarLogin() {
        // Redirigimos directamente al recurso estático
        // Esto hace que el navegador pida el archivo login.html de /static
        return "redirect:/login.html";
    }

    @PostMapping
    public void procesarLogin(@RequestParam String usuario, @RequestParam String contraseña, HttpServletResponse response, HttpSession session) throws IOException {

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
                admin = administradorService.obtenerPorUsuarioYContraseña(usuario, contraseña);
            }

            if (admin != null) {
                if (admin.getEstado() == com.proyecto.sistema.model.EstadoAdmin.ACTIVO) {
                    if (admin.getUsuarioRef() != null) {
                        session.setAttribute("idUsuario", admin.getUsuarioRef().getIdUsuario());
                    }
                    // Éxito - Redirigir a endpoint (asumiendo que también tienes Controllers para estos)
                    response.sendRedirect("/menuprincipal.html");
                } else {
                    // Administrador inactivo - Redirigir al archivo estático con parámetro
                    response.sendRedirect("/login.html?error=disabled");
                }
            } else if (isNumericUser) {
                try {
                    int ci = Integer.parseInt(contraseña);
                    Optional<Usuario> usuarioEncontradoOpt = usuarioService.obtenerUsuarioPorRuYCi(ru, ci);

                    if (usuarioEncontradoOpt.isPresent()) {
                        Usuario usuarioEncontrado = usuarioEncontradoOpt.get();
                        TipoUsuario tipoUsuario = usuarioEncontrado.getTipoUsuario();

                        if (tipoUsuario != null) {
                            if ("docente".equalsIgnoreCase(tipoUsuario.getTipo())) {
                                session.setAttribute("idUsuario", usuarioEncontrado.getIdUsuario());
                                response.sendRedirect("/docentes.html"); // Redirigir a endpoint
                            } else if ("estudiante".equalsIgnoreCase(tipoUsuario.getTipo())) {
                                session.setAttribute("idUsuario", usuarioEncontrado.getIdUsuario());
                                response.sendRedirect("/estudiantes.html"); // Redirigir a endpoint
                            } else {
                                // Tipo no esperado - Redirigir al archivo estático con error genérico
                                response.sendRedirect("/login.html?error=true");
                            }
                        } else {
                            // Usuario encontrado pero sin tipo - Redirigir al archivo estático con error genérico
                            response.sendRedirect("/login.html?error=true");
                        }
                    } else {
                        // Usuario RU/CI no encontrado - Redirigir al archivo estático con error genérico
                        response.sendRedirect("/login.html?error=true");
                    }
                } catch (NumberFormatException e) {
                    // Contraseña no numérica - Redirigir al archivo estático con error genérico
                    response.sendRedirect("/login.html?error=true");
                }
            } else {
                // No es numérico y no se encontró como admin - Redirigir al archivo estático con error genérico
                response.sendRedirect("/login.html?error=true");
            }

        } catch (Exception e) {
            // Captura CUALQUIER otra excepción inesperada
            e.printStackTrace(); // Imprime la traza en la consola

            // En caso de cualquier error, redirige al archivo estático con error genérico
            if (!response.isCommitted()) {
                response.sendRedirect("/login.html?error=true");
            }
        }
    }
}