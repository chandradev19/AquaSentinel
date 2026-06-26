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
@Table(name = "alerts")
public class Alert {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "village_id", nullable = false)
    private Village village;

    @Column(name = "alert_level", nullable = false)
    private String alertLevel; // LOW, MEDIUM, HIGH, CRITICAL

    @Column(name = "alert_type")
    private String alertType; // Water Contamination, Disease Outbreak, Rainfall Alert, Emergency Alert, Health Advisory

    @Column(nullable = false)
    @Builder.Default
    private String status = "ACTIVE"; // ACTIVE, RESOLVED, ARCHIVED

    @Column(nullable = false, length = 1000)
    private String message;

    @Column(name = "created_at")
    private Date createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = new Date();
    }
}
