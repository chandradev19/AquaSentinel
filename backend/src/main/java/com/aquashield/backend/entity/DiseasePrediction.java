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
@Table(name = "disease_predictions")
public class DiseasePrediction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "village_id", nullable = false)
    private Village village;

    @Column(name = "predicted_disease", nullable = false)
    private String predictedDisease;

    @Column(name = "outbreak_probability")
    private Double outbreakProbability; // 0.0 to 100.0

    @Column(name = "expected_cases_3_days")
    private Integer expectedCases3Days;

    @Column(name = "expected_cases_7_days")
    private Integer expectedCases7Days;

    @Column(name = "confidence")
    private Double confidence;

    @Column(name = "expected_spread_radius")
    private Double expectedSpreadRadius;

    @Column(name = "risk_level")
    private String riskLevel;

    @Column(name = "recommended_action", length = 1000)
    private String recommendedAction;

    @Column(name = "prediction_date")
    private Date predictionDate;

    @PrePersist
    protected void onCreate() {
        predictionDate = new Date();
    }
}
