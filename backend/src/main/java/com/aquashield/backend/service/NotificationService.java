package com.aquashield.backend.service;

import com.aquashield.backend.entity.Notification;
import com.aquashield.backend.entity.Role;
import com.aquashield.backend.entity.User;
import com.aquashield.backend.entity.Village;
import com.aquashield.backend.repository.NotificationRepository;
import com.aquashield.backend.repository.VillageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private VillageRepository villageRepository;

    @Autowired
    private NotificationEmitterService emitterService;

    public void notifyAdmins(String message, String title, String disease, String villageName, String riskLevel) {
        Notification notification = Notification.builder()
                .targetRole(Role.ADMIN)
                .message(message)
                .title(title)
                .disease(disease)
                .villageName(villageName)
                .riskLevel(riskLevel)
                .status("NEW")
                .build();
        Notification saved = notificationRepository.save(notification);
        emitterService.broadcastNotification(Role.ADMIN, null, saved);
    }

    public void notifyHealthWorkers(Long villageId, String message, String title, String disease, String villageName, String riskLevel) {
        Village village = villageRepository.findById(villageId).orElse(null);
        if (village == null) return;

        Notification notification = Notification.builder()
                .targetRole(Role.HEALTH_WORKER)
                .village(village)
                .message(message)
                .title(title)
                .disease(disease)
                .villageName(villageName)
                .riskLevel(riskLevel)
                .status("NEW")
                .build();
        Notification saved = notificationRepository.save(notification);
        emitterService.broadcastNotification(Role.HEALTH_WORKER, villageId, saved);
    }

    public void notifyCitizens(Long villageId, String message, String title, String disease, String villageName, String riskLevel) {
        Village village = villageRepository.findById(villageId).orElse(null);
        if (village == null) return;

        Notification notification = Notification.builder()
                .targetRole(Role.CITIZEN)
                .village(village)
                .message(message)
                .title(title)
                .disease(disease)
                .villageName(villageName)
                .riskLevel(riskLevel)
                .status("NEW")
                .build();
        Notification saved = notificationRepository.save(notification);
        emitterService.broadcastNotification(Role.CITIZEN, villageId, saved);
    }

    public void notifyDistrictOfficer(String district, String message, String title, String disease, String villageName, String riskLevel) {
        // District Health Officer simulation (sending to Admins)
        Notification notification = Notification.builder()
                .targetRole(Role.ADMIN)
                .message("[DISTRICT " + district + "] " + message)
                .title(title)
                .disease(disease)
                .villageName(villageName)
                .riskLevel(riskLevel)
                .status("NEW")
                .build();
        Notification saved = notificationRepository.save(notification);
        emitterService.broadcastNotification(Role.ADMIN, null, saved);
    }

    public void notifyUser(User user, String message) {
        // Fallback for specific user notifications if needed - treating as Role + Village specific since we changed the schema
        // In a real system, you might want a separate UserNotification table if you need 1-to-1 DMs.
        // For now, we will just broadcast to their role and village.
        if (user.getVillage() != null) {
            Notification notification = Notification.builder()
                    .targetRole(user.getRole())
                    .village(user.getVillage())
                    .message(message)
                    .title("System Notification")
                    .status("NEW")
                    .build();
            Notification saved = notificationRepository.save(notification);
            emitterService.broadcastNotification(user.getRole(), user.getVillage().getId(), saved);
        }
    }
}
