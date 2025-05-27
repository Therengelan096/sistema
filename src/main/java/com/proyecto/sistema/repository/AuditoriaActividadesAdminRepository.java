package com.proyecto.sistema.repository;

import com.proyecto.sistema.model.AuditoriaActividadesAdmin;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AuditoriaActividadesAdminRepository extends JpaRepository<AuditoriaActividadesAdmin, Integer> {
}