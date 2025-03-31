package com.proyecto.sistema.controller;

import com.proyecto.sistema.service.AdministradorService;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.stereotype.Controller;

@Controller
@RequestMapping("/login")
public class LoginController {
    @Autowired
    private AdministradorService administradorService;

    @PostMapping
    public ResponseEntity<?> procesarLogin(@RequestParam String usuario, @RequestParam String contraseña, HttpServletResponse response) {
        if (administradorService.autenticar(usuario, contraseña)) {
            // Redirige directamente al archivo estático
            response.setHeader("Location", "/menuprincipal.html");
            return ResponseEntity.status(HttpServletResponse.SC_FOUND).build();
        } else {
            return ResponseEntity.status(HttpServletResponse.SC_UNAUTHORIZED)
                    .body("Credenciales incorrectas. Inténtalo de nuevo.");
        }
    }
}