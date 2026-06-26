package com.aquashield.backend.repository;

import com.aquashield.backend.entity.Notification;
import com.aquashield.backend.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    
    @Query("SELECT n FROM Notification n WHERE n.targetRole = :role AND (n.village.id = :villageId OR n.village IS NULL) ORDER BY n.createdAt DESC")
    List<Notification> findByTargetRoleAndVillageOrGlobal(@Param("role") Role role, @Param("villageId") Long villageId);
    
    List<Notification> findByTargetRoleOrderByCreatedAtDesc(Role role);
}
