package com.proyecto.sistema.service;

// Importaciones de java.time
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter; // Para formatear la fecha y hora en el correo

import com.proyecto.sistema.model.Prestamo;
import com.proyecto.sistema.model.Usuario;
import com.proyecto.sistema.repository.PrestamoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

// Ya no necesitamos java.util.Calendar ni java.util.Date
// import java.util.Calendar;
// import java.util.Date;

import java.util.List;

@Service
public class ReminderService {

    @Autowired
    private PrestamoRepository prestamoRepository;

    @Autowired
    private EmailService emailService;

    // --- Ajusta el cronograma para que se ejecute mas FRECUENTEMENTE ---
    // Ejemplo: cada 5 minutos (300,000 milisegundos) - adecuado para recordatorios precisos
    @Scheduled(fixedRate = 300000)
    // Si prefieres que se ejecute a una hora especifica cada dia (ej. 9 AM) para recordatorios el dia antes:
    // @Scheduled(cron = "0 0 9 * * ?")
    public void checkAndSendReminders() { // Le puedes dejar este nombre
        System.out.println("Iniciando búsqueda de préstamos venciendo pronto para recordatorios...");

        // --- Define el rango de FECHA Y HORA usando LocalDateTime ---
        // Buscamos préstamos que venzan en los proximos ~30-35 minutos a partir de ahora.

        LocalDateTime now = LocalDateTime.now();
        // El rango final es "ahora" mas el tiempo que consideres la ventana de recordatorio.
        // Si buscas recordatorios "media hora antes", el scheduler debe correr mas seguido (ej. cada 5-10 mins).
        // Un rango final de 35 minutos asegura que si el scheduler corre cada 5 mins,
        // un prestamo venciendo en 30-35 minutos sera atrapado en algun ciclo.
        LocalDateTime rangeEnd = now.plusMinutes(35); // Rango hasta 35 minutos en el futuro


        System.out.println("Buscando préstamos con fecha/hora de devolución estimada entre: " + now + " y " + rangeEnd);

        // --- Llama al repositorio con OBJETOS LocalDateTime ---
        // LINEA 44 corregida implicitamente al usar now y rangeEnd (que son LocalDateTime)
        List<Prestamo> prestamosProximos = prestamoRepository.findByFechaDevolucionEstimadaBetween(now, rangeEnd);

        if (prestamosProximos.isEmpty()) {
            System.out.println("No se encontraron préstamos venciendo en el rango definido.");
            return;
        }

        System.out.println("Se encontraron " + prestamosProximos.size() + " préstamos venciendo pronto.");

        // Formateador para mostrar FECHA Y HORA en el correo
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

        // --- Itera sobre los préstamos encontrados y envía correos ---
        for (Prestamo prestamo : prestamosProximos) {
            Usuario usuario = prestamo.getUsuario();

            // ** Considerar campo recordatorioEnviado **
            // Si agregaste el campo recordatorioEnviado (boolean) a tu modelo Prestamo,
            // descomenta la siguiente linea y la del save mas abajo
            // if (usuario != null && usuario.getCorreo() != null && !usuario.getCorreo().isEmpty() && !prestamo.isRecordatorioEnviado()) {

            if (usuario != null && usuario.getCorreo() != null && !usuario.getCorreo().isEmpty()) {
                String destinatario = usuario.getCorreo();
                String asunto = "Recordatorio: Tu préstamo vence pronto";
                String cuerpo = String.format(
                        "Hola %s %s,\n\nEste es un recordatorio de que el equipo(s) que tienes prestado(s) vence(n) pronto.\nFecha y hora de devolución estimada: %s\n\nPor favor, asegúrate de realizar la devolución a tiempo.\n\nGracias por tu colaboración,\nEl Equipo de tu Sistema de Préstamos",
                        usuario.getNombre(),
                        usuario.getApellido(),
                        prestamo.getFechaDevolucionEstimada().format(formatter) // Usando getFechaDevolucionEstimada() que devuelve LocalDateTime
                );

                emailService.sendSimpleEmail(destinatario, asunto, cuerpo);

                // ** Si agregaste el campo recordatorioEnviado, actualízalo aquí **
                // try {
                //     prestamo.setRecordatorioEnviado(true);
                //     prestamoRepository.save(prestamo); // Guarda el cambio en la base de datos
                // } catch (Exception e) {
                //     System.err.println("Error al marcar préstamo " + prestamo.getIdPrestamo() + " como recordatorio enviado: " + e.getMessage());
                // }
            } else {
                System.err.println("No se pudo enviar recordatorio para préstamo ID " + prestamo.getIdPrestamo() + ": Usuario o email no válido/encontrado.");
            }
        }
        System.out.println("Proceso de recordatorios finalizado.");
    }
}