// En com.proyecto.sistema.service.AdministradorService
package com.proyecto.sistema.service

import com.proyecto.sistema.model.Administrador
import com.proyecto.sistema.repository.AdministradorRepository
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.stereotype.Service

@Service
class Administrador1Service {
    @Autowired
    private val administradorRepository: AdministradorRepository? = null

    fun obtenerPorUsuarioYContraseña(usuario: String?, contraseña: String?): Administrador? {
        val adminOptional = administradorRepository!!.findByUsuarioAndContraseña(usuario, contraseña)
        return adminOptional.orElse(null)
    }

    fun obtenerPorUsuario(usuario: String?): Administrador? {
        val adminOptional = administradorRepository!!.findByUsuario(usuario)
        return adminOptional.orElse(null)
    }
}
