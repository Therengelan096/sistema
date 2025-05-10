package com.proyecto.sistema.controller;

import com.proyecto.sistema.model.Prestamo;
import com.proyecto.sistema.model.Sancion;
import com.proyecto.sistema.model.Usuario;
import com.proyecto.sistema.service.PrestamoService; // USAR SERVICIO
import com.proyecto.sistema.service.SancionService;   // USAR SERVICIO
import com.proyecto.sistema.service.UsuarioService; // USAR SERVICIO
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

import java.util.List;
import java.util.Optional;

@Controller
@RequestMapping("/usuario")
public class UserController { // Nombre de clase UserController como lo tenías

    @Autowired
    private UsuarioService usuarioService; // Inyectar UsuarioService

    @Autowired
    private PrestamoService prestamoService; // Inyectar PrestamoService

    @Autowired
    private SancionService sancionService;   // Inyectar SancionService

    @GetMapping("/dashboard")
    public String mostrarDashboardUsuario(HttpSession session, Model model) {
        Integer idUsuario = (Integer) session.getAttribute("idUsuario");

        if (idUsuario == null) {
            return "redirect:/login.html?error=session_expired";
        }

        // Obtener datos del usuario usando UsuarioService
        Optional<Usuario> usuarioOptional = usuarioService.obtenerUsuarioPorId(idUsuario);

        if (usuarioOptional.isPresent()) {
            Usuario usuario = usuarioOptional.get();
            model.addAttribute("usuario", usuario);

            // Obtener préstamos usando PrestamoService
            List<Prestamo> prestamos = prestamoService.obtenerPrestamosPorIdUsuario(idUsuario);
            model.addAttribute("prestamos", prestamos);

            // Obtener sanciones usando SancionService
            List<Sancion> sanciones = sancionService.obtenerSancionesPorIdUsuario(idUsuario);
            model.addAttribute("sanciones", sanciones);

            // Retornar el nombre de la plantilla (asumiendo estudiantes.html)
            return "Estudiantes"; // Nombre en minúscula es más estándar
        } else {
            session.invalidate(); // Limpiar sesión si el usuario no se encuentra
            return "redirect:/login.html?error=user_not_found";
        }
    }

    @GetMapping("/logout")
    public String logout(HttpSession session) {
        session.invalidate();
        return "redirect:/login.html?logout=true";
    }
}
