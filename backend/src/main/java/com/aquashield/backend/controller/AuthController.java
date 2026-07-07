package com.aquashield.backend.controller;

import com.aquashield.backend.dto.ApiResponse;
import com.aquashield.backend.dto.JwtResponse;
import com.aquashield.backend.dto.LoginRequest;
import com.aquashield.backend.dto.SignupRequest;
import com.aquashield.backend.entity.Role;
import com.aquashield.backend.entity.User;
import com.aquashield.backend.entity.Village;
import com.aquashield.backend.repository.NotificationRepository;
import com.aquashield.backend.repository.UserRepository;
import com.aquashield.backend.repository.VillageRepository;
import com.aquashield.backend.security.JwtUtils;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import com.aquashield.backend.service.NotificationEmitterService;

import java.util.HashMap;
import java.util.Map;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    AuthenticationManager authenticationManager;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private NotificationEmitterService notificationEmitterService;

    @Autowired
    VillageRepository villageRepository;

    @Autowired
    PasswordEncoder encoder;

    @Autowired
    JwtUtils jwtUtils;

    @Autowired
    private com.aquashield.backend.service.AuditLogService auditLogService;

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(loginRequest.getEmail(), loginRequest.getPassword()));

            SecurityContextHolder.getContext().setAuthentication(authentication);
            String jwt = jwtUtils.generateJwtToken(authentication);

            User user = userRepository.findByEmail(loginRequest.getEmail()).get();
            if (user.getSuspended() != null && user.getSuspended()) {
                return ResponseEntity.status(403)
                        .body(new ApiResponse(false, "Access Denied. Your clearance has been suspended."));
            }

            auditLogService.log("USER_LOGIN", "User logged in: " + user.getEmail() + " (Role: " + user.getRole() + ")");

            return ResponseEntity.ok(JwtResponse.builder()
                    .token(jwt)
                    .id(user.getId())
                    .name(user.getName())
                    .email(user.getEmail())
                    .role(user.getRole().name())
                    .villageId(user.getVillage() != null ? user.getVillage().getId() : null)
                    .build());
        } catch (BadCredentialsException e) {
            return ResponseEntity.status(401)
                    .body(new ApiResponse(false, "Invalid email or password"));
        }
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@Valid @RequestBody SignupRequest signUpRequest) {
        if (userRepository.existsByEmail(signUpRequest.getEmail())) {
            return ResponseEntity
                    .badRequest()
                    .body(new ApiResponse(false, "Error: Email is already in use!"));
        }

        Role role = Role.CITIZEN;
        if (signUpRequest.getRole() != null) {
            switch (signUpRequest.getRole()) {
                case "HEALTH_WORKER" -> role = Role.HEALTH_WORKER;
                case "ADMIN" -> role = Role.ADMIN;
            }
        }

        Village village = null;
        if (signUpRequest.getVillageId() != null) {
            village = villageRepository.findById(signUpRequest.getVillageId()).orElse(null);
        }

        User user = User.builder()
                .name(signUpRequest.getName())
                .email(signUpRequest.getEmail())
                .password(encoder.encode(signUpRequest.getPassword()))
                .phone(signUpRequest.getPhone())
                .role(role)
                .village(village)
                .build();

        userRepository.save(user);

        return ResponseEntity.ok(new ApiResponse(true, "User registered successfully!"));
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
            return ResponseEntity.status(401).build();
        }
        
        User user = userRepository.findByEmail(authentication.getName()).orElse(null);
        if (user == null) {
            return ResponseEntity.status(401).build();
        }

        Map<String, Object> userData = new HashMap<>();
        userData.put("id", user.getId());
        userData.put("name", user.getName());
        userData.put("email", user.getEmail());
        userData.put("phone", user.getPhone());
        userData.put("role", user.getRole().name());
        userData.put("villageId", user.getVillage() != null ? user.getVillage().getId() : null);
        return ResponseEntity.ok(userData);
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logoutUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            auditLogService.log("USER_LOGOUT", "User logged out: " + auth.getName());
        }
        return ResponseEntity.ok(new ApiResponse(true, "Session closed successfully."));
    }

    @GetMapping("/notifications")
    public ResponseEntity<?> getNotifications() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
            return ResponseEntity.status(401).body(new ApiResponse(false, "Unauthorized"));
        }

        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        User user = userRepository.findByEmail(userDetails.getUsername()).orElse(null);
        if (user == null) {
            return ResponseEntity.status(404).body(new ApiResponse(false, "User not found"));
        }

        if (user.getRole() == Role.ADMIN) {
            return ResponseEntity.ok(notificationRepository.findByTargetRoleOrderByCreatedAtDesc(Role.ADMIN));
        } else if (user.getVillage() != null) {
            return ResponseEntity.ok(notificationRepository.findByTargetRoleAndVillageOrGlobal(user.getRole(), user.getVillage().getId()));
        } else {
            return ResponseEntity.ok(java.util.Collections.emptyList());
        }
    }

    @PutMapping("/notifications/{id}/read")
    public ResponseEntity<?> markNotificationRead(@PathVariable Long id) {
        // Broadcast notifications no longer have an isRead flag in DB per user.
        // Handled locally by frontend.
        return ResponseEntity.ok(new ApiResponse(true, "Notification marked as read locally."));
    }

    @PutMapping("/notifications/{id}/status")
    public ResponseEntity<?> updateNotificationStatus(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
            return ResponseEntity.status(401).body(new ApiResponse(false, "Unauthorized"));
        }
        String newStatus = payload.get("status");
        if (newStatus == null) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, "Status is required"));
        }
        return notificationRepository.findById(id).map(notif -> {
            // Only admin can update global alert status (usually)
            UserDetails userDetails = (UserDetails) authentication.getPrincipal();
            User user = userRepository.findByEmail(userDetails.getUsername()).orElse(null);
            if (user != null && user.getRole() == Role.ADMIN) {
                notif.setStatus(newStatus);
                notificationRepository.save(notif);
                notificationEmitterService.broadcastUpdate(notif);
                return ResponseEntity.ok(new ApiResponse(true, "Notification status updated."));
            } else {
                return ResponseEntity.status(403).body(new ApiResponse(false, "Forbidden"));
            }
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/notifications/mark-all-read")
    public ResponseEntity<?> markAllNotificationsRead() {
        return ResponseEntity.ok(new ApiResponse(true, "All notifications marked as read locally."));
    }

    @DeleteMapping("/notifications/{id}")
    public ResponseEntity<?> deleteNotification(@PathVariable Long id) {
        // Can't delete a broadcast notification globally as a normal user. Handled locally by frontend.
        return ResponseEntity.ok(new ApiResponse(true, "Notification dismissed locally."));
    }
}
