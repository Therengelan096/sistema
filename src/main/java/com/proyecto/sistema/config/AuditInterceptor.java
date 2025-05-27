package com.proyecto.sistema.config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.ModelAndView;

@Component
public class AuditInterceptor implements HandlerInterceptor {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        HttpSession session = request.getSession(false);

        if (session != null) {
            Integer idAdministrador = (Integer) session.getAttribute("idAdministradorLogueado");

            if (idAdministrador != null) {
                jdbcTemplate.update("SET @id_admin_activo = ?", idAdministrador);
            } else {
                jdbcTemplate.update("SET @id_admin_activo = NULL");
            }
        } else {
            jdbcTemplate.update("SET @id_admin_activo = NULL");
        }
        return true;
    }

    @Override
    public void postHandle(HttpServletRequest request, HttpServletResponse response, Object handler, ModelAndView modelAndView) throws Exception {
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) throws Exception {
        jdbcTemplate.update("SET @id_admin_activo = NULL");
    }
}