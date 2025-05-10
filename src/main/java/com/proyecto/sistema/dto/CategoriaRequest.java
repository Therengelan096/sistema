package com.proyecto.sistema.dto; // Puedes ajustar el nombre del paquete

import java.util.List;

public class CategoriaRequest {
    private String nombreCategoria;
    private List<Integer> laboratorioIds; // Lista de IDs de laboratorios seleccionados

    // Getters y setters
    public String getNombreCategoria() { return nombreCategoria; }
    public void setNombreCategoria(String nombreCategoria) { this.nombreCategoria = nombreCategoria; }
    public List<Integer> getLaboratorioIds() { return laboratorioIds; }
    public void setLaboratorioIds(List<Integer> laboratorioIds) { this.laboratorioIds = laboratorioIds; }
}