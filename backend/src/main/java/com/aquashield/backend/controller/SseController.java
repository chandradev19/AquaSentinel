package com.aquashield.backend.controller;

import com.aquashield.backend.entity.User;
import com.aquashield.backend.repository.UserRepository;
import com.aquashield.backend.security.JwtUtils;
import com.aquashield.backend.service.NotificationEmitterService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/stream")
public class SseController {

    @Autowired
    private NotificationEmitterService emitterService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtUtils jwtUtils;

    @GetMapping("/notifications")
    public SseEmitter streamNotifications(@RequestParam(required = false) String token) {
        String email = null;
        
        // Check Security Context first
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !auth.getPrincipal().equals("anonymousUser")) {
            if (auth.getPrincipal() instanceof org.springframework.security.core.userdetails.UserDetails) {
                email = ((org.springframework.security.core.userdetails.UserDetails) auth.getPrincipal()).getUsername();
            } else {
                email = auth.getPrincipal().toString();
            }
        } else if (token != null && jwtUtils.validateJwtToken(token)) {
            // Fallback for EventSource which cannot send Authorization headers
            email = jwtUtils.getUserNameFromJwtToken(token);
        }

        if (email != null) {
            User user = userRepository.findByEmail(email).orElse(null);
            if (user != null) {
                Long villageId = user.getVillage() != null ? user.getVillage().getId() : null;
                return emitterService.createEmitter(user.getRole(), villageId);
            }
        }
        
        SseEmitter emptyEmitter = new SseEmitter();
        emptyEmitter.complete();
        return emptyEmitter;
    }
}
