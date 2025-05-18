package com.proyecto.sistema; // Asegurate de que este sea tu paquete correcto

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling; // <-- ¡IMPORTA esta anotación!

@SpringBootApplication
@EnableScheduling // <-- ¡AÑADE esta anotación aquí!
public class SistemaApplication {

	public static void main(String[] args) {
		SpringApplication.run(SistemaApplication.class, args);
	}

}
