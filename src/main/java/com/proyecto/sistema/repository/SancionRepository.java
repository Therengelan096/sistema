package com.proyecto.sistema.repository;

import com.proyecto.sistema.model.Sancion;
import com.proyecto.sistema.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Date;
import java.util.List;

public interface SancionRepository extends JpaRepository<Sancion, Integer> {
    List<Sancion> findByEstado(String estado);
    List<Sancion> findByUsuarioAndFechaSancionBetween(Usuario usuario, Date fechaInicio, Date fechaFin);
    List<Sancion> findByUsuarioAndFechaSancionGreaterThanEqual(Usuario usuario, Date fechaInicio);
    List<Sancion> findByUsuarioAndFechaSancionLessThanEqual(Usuario usuario, Date fechaFin);
    List<Sancion> findByUsuarioAndEstado(Usuario usuario, String estado);
    List<Sancion> findByUsuario(Usuario usuario);

    List<Sancion> findByUsuarioAndFechaSancionBetweenAndEstado(Usuario usuario, Date fechaInicio, Date fechaFin, String estado);
    List<Sancion> findByUsuarioAndFechaSancionGreaterThanEqualAndEstado(Usuario usuario, Date fechaInicio, String estado);
    List<Sancion> findByUsuarioAndFechaSancionLessThanEqualAndEstado(Usuario usuario, Date fechaFin, String estado);
}