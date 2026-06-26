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
@Table(name = "risk_assessments")
public class RiskAssessment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "village_id", nullable = false)
    private Village village;

    @Column(name = "symptom_cases_score")
    private Double symptomCasesScore;

    @Column(name = "contamination_score")
    private Double contaminationScore;

    @Column(name = "rainfall_factor")
    private Double rainfallFactor;

    @Column(name = "total_risk_score")
    private Double totalRiskScore;

    @Column(name = "risk_level")
    private String riskLevel; // LOW, MEDIUM, HIGH

    @Column(name = "created_at")
    private Date createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = new Date();
    }
}
