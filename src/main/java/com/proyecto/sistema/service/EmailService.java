package com.proyecto.sistema.service; // O el paquete donde tengas tus servicios

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    public void sendSimpleEmail(String toEmail, String subject, String body) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("tucorreo@gmail.com"); // Debe coincidir con spring.mail.username
            message.setTo(toEmail);
            message.setText(body);
            message.setSubject(subject);

            mailSender.send(message);
            System.out.println("Correo de recordatorio enviado a: " + toEmail);
        } catch (Exception e) {
            System.err.println("Error al enviar correo de recordatorio a " + toEmail + ": " + e.getMessage());
            e.printStackTrace(); // Considera usar un logger profesional en lugar de e.printStackTrace()
        }
    }
}
