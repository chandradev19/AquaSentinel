package com.aquashield.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Date;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "emergency_actions")
public class EmergencyAction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "village_id")
    private Village village;

    private String actionPlan;
    private String priority; // HIGH, CRITICAL
    private String status; // INITIATED, IN_PROGRESS, RESOLVED

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "triggered_by_alert_id")
    private Alert triggeredByAlert;

    @Column(name = "created_at")
    private Date createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = new Date();
    }
}
