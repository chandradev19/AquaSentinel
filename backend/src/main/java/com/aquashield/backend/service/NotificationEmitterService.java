package com.aquashield.backend.service;

import com.aquashield.backend.entity.Notification;
import com.aquashield.backend.entity.Role;
import lombok.AllArgsConstructor;
import lombok.Data;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

@Service
public class NotificationEmitterService {

    @Data
    @AllArgsConstructor
    private static class UserSessionInfo {
        private Role role;
        private Long villageId;
    }

    // Map of Emitter to User Session Info
    private final Map<SseEmitter, UserSessionInfo> emitterSessions = new ConcurrentHashMap<>();
    private final List<SseEmitter> emitters = new CopyOnWriteArrayList<>();

    public SseEmitter createEmitter(Role role, Long villageId) {
        // Keep connection open for 1 hour
        SseEmitter emitter = new SseEmitter(60 * 60 * 1000L);
        
        emitters.add(emitter);
        emitterSessions.put(emitter, new UserSessionInfo(role, villageId));

        emitter.onCompletion(() -> removeEmitter(emitter));
        emitter.onTimeout(() -> removeEmitter(emitter));
        emitter.onError(e -> removeEmitter(emitter));

        try {
            // Send initial connection event
            emitter.send(SseEmitter.event().name("INIT").data("Connected to AquaShield SSE"));
        } catch (IOException e) {
            removeEmitter(emitter);
        }

        return emitter;
    }

    private void removeEmitter(SseEmitter emitter) {
        emitters.remove(emitter);
        emitterSessions.remove(emitter);
    }

    public void broadcastNotification(Role targetRole, Long villageId, Notification notification) {
        for (SseEmitter emitter : emitters) {
            UserSessionInfo session = emitterSessions.get(emitter);
            if (session != null && session.getRole() == targetRole) {
                // If villageId is specified, check if it matches, otherwise (like global Admin alerts) it matches
                if (villageId == null || villageId.equals(session.getVillageId())) {
                    sendPayload(emitter, notification);
                }
            }
        }
    }

    public void broadcastUpdate(Notification notification) {
        // Broadcast an update to the relevant role and village
        Long vId = notification.getVillage() != null ? notification.getVillage().getId() : null;
        broadcastNotification(notification.getTargetRole(), vId, notification);
    }

    private void sendPayload(SseEmitter emitter, Notification notification) {
        try {
            Map<String, Object> payload = Map.of(
                "id", notification.getId(),
                "message", notification.getMessage(),
                "title", notification.getTitle() != null ? notification.getTitle() : "Notification",
                "disease", notification.getDisease() != null ? notification.getDisease() : "",
                "villageName", notification.getVillageName() != null ? notification.getVillageName() : "",
                "riskLevel", notification.getRiskLevel() != null ? notification.getRiskLevel() : "LOW",
                "status", notification.getStatus(),
                "notificationType", notification.getTargetRole().name(),
                "createdAt", notification.getCreatedAt().getTime()
            );
            emitter.send(SseEmitter.event().name("NOTIFICATION").data(payload));
        } catch (IOException e) {
            emitter.complete();
            removeEmitter(emitter);
        }
    }
}
