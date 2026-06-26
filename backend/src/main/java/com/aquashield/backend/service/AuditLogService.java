package com.aquashield.backend.service;

import com.aquashield.backend.entity.AuditLog;
import com.aquashield.backend.entity.User;
import com.aquashield.backend.repository.AuditLogRepository;
import com.aquashield.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
public class AuditLogService {

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private UserRepository userRepository;

    public void log(String action, String details) {
        User user = null;
        try {
            if (SecurityContextHolder.getContext().getAuthentication() != null &&
                SecurityContextHolder.getContext().getAuthentication().isAuthenticated() &&
                !"anonymousUser".equals(SecurityContextHolder.getContext().getAuthentication().getPrincipal())) {
                String email = SecurityContextHolder.getContext().getAuthentication().getName();
                user = userRepository.findByEmail(email).orElse(null);
            }
        } catch (Exception e) {
            // Ignored
        }

        AuditLog log = AuditLog.builder()
                .user(user)
                .action(action)
                .details(details)
                .ipAddress("127.0.0.1")
                .build();
        auditLogRepository.save(log);
    }
}
