package com.proyecto.sistema.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class InicioController {

    @GetMapping("/")
    public String redirigirAlLogin() {
        return "redirect:/login.html"; // Redirige al archivo estático login.html
    }
}