package com.proyecto.sistema.controller;

import com.proyecto.sistema.model.AuditoriaActividadesAdmin;
import com.proyecto.sistema.repository.AuditoriaActividadesAdminRepository;
import com.proyecto.sistema.model.Administrador;
import com.proyecto.sistema.repository.AdministradorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/auditoria")
public class AuditoriaController {

    @Autowired
    private AuditoriaActividadesAdminRepository auditoriaRepository;

    @Autowired
    private AdministradorRepository administradorRepository;

    @GetMapping
    public List<AuditoriaLogDTO> getAllAuditoriaLogs() {
        List<AuditoriaActividadesAdmin> logs = auditoriaRepository.findAll();

        return logs.stream().map(log -> {
            AuditoriaLogDTO dto = new AuditoriaLogDTO();
            dto.setIdLog(log.getIdLog());
            dto.setTablaAfectada(log.getTablaAfectada());
            dto.setIdRegistroAfectado(log.getIdRegistroAfectado());
            dto.setTipoOperacion(log.getTipoOperacion().name()); // Convertir Enum a String
            dto.setFechaHoraAccion(log.getFechaHoraAccion());

            administradorRepository.findById(log.getIdAdministrador()).ifPresent(admin -> {
                dto.setNombreAdministrador(admin.getUsuario());
            });

            return dto;
        }).collect(Collectors.toList());
    }
}