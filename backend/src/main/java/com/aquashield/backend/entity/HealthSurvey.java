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
@Table(name = "health_surveys")
public class HealthSurvey {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "village_id", nullable = false)
    private Village village;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "health_worker_id", nullable = false)
    private User healthWorker;

    @Column(name = "households_surveyed")
    private Integer householdsSurveyed;

    @Column(name = "illness_count")
    private Integer illnessCount;

    @Column(columnDefinition = "TEXT")
    private String primaryConcerns;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "created_at")
    private Date createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = new Date();
    }
}
