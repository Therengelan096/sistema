package com.proyecto.sistema.service; // << Asegúrate que el paquete es correcto

// --- Importaciones necesarias ---
import com.proyecto.sistema.model.Usuario;
import com.proyecto.sistema.repository.UsuarioRepository;
import com.proyecto.sistema.service.UsuarioService; // Importa la clase de servicio
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional; // Necesitas importar Optional

// --- Importaciones para Aserciones y Mockito ---
import static org.junit.jupiter.api.Assertions.assertEquals; // Para verificar si son iguales
import static org.junit.jupiter.api.Assertions.assertTrue; // Para verificar Optional.isPresent()
import static org.junit.jupiter.api.Assertions.assertFalse; // Para verificar Optional.isEmpty()
import static org.mockito.Mockito.when; // Para simular respuestas de mocks


@ExtendWith(MockitoExtension.class)
class UsuarioServiceTest {

    // --- Declaración de Mock y Objeto a Probar ---
    @Mock // Mockeamos el repositorio que el servicio utiliza
    private UsuarioRepository usuarioRepository;

    @InjectMocks // Inyectamos el mock (usuarioRepository) en una instancia real de UsuarioService
    private UsuarioService usuarioService;


    // --- Pruebas para el método obtenerUsuarioPorRuYCi ---

    @Test // Prueba 1: RU y CI coinciden (Caso Exitoso)
    void testObtenerUsuarioPorRuYCi_success() {
        // 1. Arrange (Configurar):
        //    Creamos un usuario de prueba que el repositorio "devolvería".
        int ruDePrueba = 12345;
        int ciDePrueba = 67890;
        Usuario usuarioExistente = new Usuario();
        usuarioExistente.setRu(ruDePrueba);
        usuarioExistente.setCi(ciDePrueba);
        usuarioExistente.setNombre("Usuario Existente");
        // ... configurar otras propiedades si es necesario ...

        //    Simulamos el comportamiento del repositorio MOCK:
        //    Cuando alguien llame a usuarioRepository.findByRu(ruDePrueba),
        //    queremos que devuelva un Optional conteniendo nuestro usuarioExistente.
        when(usuarioRepository.findByRu(ruDePrueba)).thenReturn(Optional.of(usuarioExistente));


        // 2. Act (Actuar):
        //    Llamamos al método del servicio que estamos probando con los datos de prueba.
        Optional<Usuario> resultado = usuarioService.obtenerUsuarioPorRuYCi(ruDePrueba, ciDePrueba);


        // 3. Assert (Verificar):
        //    Verificamos que el resultado no está vacío.
        assertTrue(resultado.isPresent(), "El resultado debería contener un usuario");
        //    Verificamos que el usuario dentro del Optional sea el usuario que esperábamos.
        assertEquals(ruDePrueba, resultado.get().getRu(), "El RU del usuario retornado debe coincidir");
        assertEquals(ciDePrueba, resultado.get().getCi(), "El CI del usuario retornado debe coincidir");
        // ... puedes añadir más aserciones sobre las propiedades del usuario retornado ...
    }

    @Test // Prueba 2: RU no existe (Caso Fallido 1)
    void testObtenerUsuarioPorRuYCi_ruNotFound() {
        // 1. Arrange (Configurar):
        int ruInexistente = 99999;
        int ciCualquiera = 11111;

        //    Simulamos el comportamiento del repositorio MOCK:
        //    Cuando alguien llame a usuarioRepository.findByRu(ruInexistente),
        //    queremos que devuelva un Optional vacío.
        when(usuarioRepository.findByRu(ruInexistente)).thenReturn(Optional.empty());


        // 2. Act (Actuar):
        //    Llamamos al método del servicio.
        Optional<Usuario> resultado = usuarioService.obtenerUsuarioPorRuYCi(ruInexistente, ciCualquiera);


        // 3. Assert (Verificar):
        //    Verificamos que el resultado esté vacío.
        assertFalse(resultado.isPresent(), "El resultado debería estar vacío si el RU no se encuentra");
    }

    @Test // Prueba 3: RU existe, pero CI no coincide (Caso Fallido 2)
    void testObtenerUsuarioPorRuYCi_ciMismatch() {
        // 1. Arrange (Configurar):
        int ruExistente = 12345;
        int ciCorrecto = 67890;
        int ciIncorrecto = 54321; // Un CI diferente

        //    Creamos un usuario que el repositorio "devolvería".
        Usuario usuarioConCiCorrecto = new Usuario();
        usuarioConCiCorrecto.setRu(ruExistente);
        usuarioConCiCorrecto.setCi(ciCorrecto); // Tiene el CI correcto
        // ...

        //    Simulamos el comportamiento del repositorio MOCK:
        //    Cuando alguien llame a usuarioRepository.findByRu(ruExistente),
        //    queremos que devuelva un Optional conteniendo el usuario (con el CI correcto).
        when(usuarioRepository.findByRu(ruExistente)).thenReturn(Optional.of(usuarioConCiCorrecto));


        // 2. Act (Actuar):
        //    Llamamos al método del servicio con el RU correcto pero el CI INCORRECTO.
        Optional<Usuario> resultado = usuarioService.obtenerUsuarioPorRuYCi(ruExistente, ciIncorrecto);


        // 3. Assert (Verificar):
        //    Verificamos que el resultado esté vacío, porque el CI no coincidió DENTRO de la lógica del servicio.
        assertFalse(resultado.isPresent(), "El resultado debería estar vacío si el CI no coincide");
    }

    // Si tuvieras otros métodos en UsuarioService, añadirías más métodos @Test aquí

}