package com.proyecto.sistema.controller;

import java.time.LocalDateTime;

public class AuditoriaLogDTO {
    private Integer idLog;
    private String nombreAdministrador;
    private String tablaAfectada;
    private Integer idRegistroAfectado;
    private String tipoOperacion;
    private LocalDateTime fechaHoraAccion;

    public AuditoriaLogDTO() {
    }

    public Integer getIdLog() {
        return idLog;
    }

    public void setIdLog(Integer idLog) {
        this.idLog = idLog;
    }

    public String getNombreAdministrador() {
        return nombreAdministrador;
    }

    public void setNombreAdministrador(String nombreAdministrador) {
        this.nombreAdministrador = nombreAdministrador;
    }

    public String getTablaAfectada() {
        return tablaAfectada;
    }

    public void setTablaAfectada(String tablaAfectada) {
        this.tablaAfectada = tablaAfectada;
    }

    public Integer getIdRegistroAfectado() {
        return idRegistroAfectado;
    }

    public void setIdRegistroAfectado(Integer idRegistroAfectado) {
        this.idRegistroAfectado = idRegistroAfectado;
    }

    public String getTipoOperacion() {
        return tipoOperacion;
    }

    public void setTipoOperacion(String tipoOperacion) {
        this.tipoOperacion = tipoOperacion;
    }

    public LocalDateTime getFechaHoraAccion() {
        return fechaHoraAccion;
    }

    public void setFechaHoraAccion(LocalDateTime fechaHoraAccion) {
        this.fechaHoraAccion = fechaHoraAccion;
    }
}