package com.proyecto.sistema.controller;

import com.proyecto.sistema.model.CategoriaEquipo;
import com.proyecto.sistema.model.Laboratorio;
import com.proyecto.sistema.repository.CategoriaEquipoRepository;
import com.proyecto.sistema.repository.LaboratorioRepository;
import com.proyecto.sistema.dto.CategoriaRequest; // Importar
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Optional;
import java.util.ArrayList;
import java.util.Set;
import java.util.HashSet; // Importar si usas Set en lugar de List (recomendado para ManyToMany)
import java.util.stream.Collectors; // Importar para usar streams

@RestController
@RequestMapping("/categorias")
public class CategoriaController {
    @Autowired
    private CategoriaEquipoRepository categoriaEquipoRepository;

    @Autowired
    private LaboratorioRepository laboratorioRepository;

    // Endpoint para obtener todas las categorías
    // Podría necesitar FETCH JOIN si quieres serializar los laboratorios asociados aquí
    // List<CategoriaEquipo> obtenerCategoriasConLaboratorios(); en el repositorio
    @GetMapping
    public List<CategoriaEquipo> obtenerCategorias() {
        // Por defecto, la lista 'laboratorios' en CategoriaEquipo (dueña) será LAZY.
        // Se cargará solo si se accede a ella (ej. categoria.getLaboratorios())
        // o si configuras EAGER (no recomendado) o usas FETCH JOIN en una query.
        // Para la tabla principal, solo necesitas nombre e ID de categoría.
        return categoriaEquipoRepository.findAll();
    }

    // Endpoint para obtener todos los laboratorios (para poblar checkboxes)
    // @JsonIgnoreProperties en Laboratorio.java es importante aquí.
    @GetMapping("/laboratorios")
    public List<Laboratorio> obtenerTodosLosLaboratorios() {
        return laboratorioRepository.findAll();
    }

    // Endpoint para obtener una categoría por ID (necesario para editar y pre-seleccionar labs)
    @GetMapping("/{id}")
    public ResponseEntity<CategoriaEquipo> obtenerCategoriaPorId(@PathVariable int id) {
        Optional<CategoriaEquipo> categoriaOpt = categoriaEquipoRepository.findById(id);
        if (categoriaOpt.isPresent()) {
            // Al obtener la CategoríaEquipo por ID, JPA debería cargar la lista de Laboratorios asociados
            // si la FetchType es EAGER o si accedes a categoria.getLaboratorios() aquí (forzando LAZY load).
            // Asumimos que se carga para la respuesta JSON.
            return new ResponseEntity<>(categoriaOpt.get(), HttpStatus.OK);
        } else {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    // MODIFICADO: Endpoint para crear una categoría (guarda nombre Y asocia laboratorios)
    @PostMapping
    public ResponseEntity<CategoriaEquipo> crearCategoria(@RequestBody CategoriaRequest categoriaRequest) {
        CategoriaEquipo nuevaCategoria = new CategoriaEquipo();
        nuevaCategoria.setNombreCategoria(categoriaRequest.getNombreCategoria());

        // Obtener los objetos Laboratorio basados en los IDs recibidos
        List<Laboratorio> laboratoriosAsociados = new ArrayList<>();
        if (categoriaRequest.getLaboratorioIds() != null && !categoriaRequest.getLaboratorioIds().isEmpty()) {
            laboratoriosAsociados = laboratorioRepository.findAllById(categoriaRequest.getLaboratorioIds());
            // Opcional: Verificar que todos los IDs existan si quieres ser estricto
        }

        // Establecer la lista de laboratorios en la nueva categoría
        // Como CategoriaEquipo es la dueña, JPA gestionará las inserciones en laboratorios_categorias
        nuevaCategoria.setLaboratorios(laboratoriosAsociados);

        CategoriaEquipo categoriaGuardada = categoriaEquipoRepository.save(nuevaCategoria);
        // Devolvemos la categoría guardada (ahora tiene un ID y asociaciones)
        return new ResponseEntity<>(categoriaGuardada, HttpStatus.CREATED);
    }

    // MODIFICADO: Endpoint para actualizar una categoría (actualiza nombre Y asociaciones de laboratorios)
    @PutMapping("/{id}")
    public ResponseEntity<CategoriaEquipo> actualizarCategoria(@PathVariable int id, @RequestBody CategoriaRequest categoriaRequest) {
        Optional<CategoriaEquipo> categoriaExistenteOpt = categoriaEquipoRepository.findById(id);

        if (categoriaExistenteOpt.isPresent()) {
            CategoriaEquipo categoriaExistente = categoriaExistenteOpt.get();
            // Actualizamos el nombre
            categoriaExistente.setNombreCategoria(categoriaRequest.getNombreCategoria());

            // Gestionar la asociación de laboratorios
            // Obtener los objetos Laboratorio basados en los IDs recibidos
            List<Laboratorio> laboratoriosActualizados = new ArrayList<>();
            if (categoriaRequest.getLaboratorioIds() != null && !categoriaRequest.getLaboratorioIds().isEmpty()) {
                laboratoriosActualizados = laboratorioRepository.findAllById(categoriaRequest.getLaboratorioIds());
                // Opcional: Verificar que todos los IDs existan
            }

            // Reemplazar la lista completa de laboratorios en la categoría existente
            // Como CategoriaEquipo es la dueña, JPA gestionará:
            // 1. Eliminar las entradas en laboratorios_categorias que ya no estén en la nueva lista.
            // 2. Insertar las entradas en laboratorios_categorias que sí estén en la nueva lista pero no antes.
            categoriaExistente.setLaboratorios(laboratoriosActualizados);

            CategoriaEquipo categoriaActualizadaGuardada = categoriaEquipoRepository.save(categoriaExistente);
            // Devolvemos la categoría actualizada
            return new ResponseEntity<>(categoriaActualizadaGuardada, HttpStatus.OK);
        } else {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    // El endpoint PUT /{id}/laboratorios YA NO ES NECESARIO con este enfoque de una sola modal.
}