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
@Table(name = "village_history")
public class VillageHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "village_id", nullable = false)
    private Village village;

    @Column(name = "risk_score")
    private Double riskScore;

    @Column(name = "active_cases")
    private Integer activeCases;

    @Column(name = "water_quality_status")
    private String waterQualityStatus;

    @Column(name = "recorded_at")
    private Date recordedAt;

    @PrePersist
    protected void onCreate() {
        recordedAt = new Date();
    }
}
