package com.aquashield.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "villages")
public class Village {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String district;
    private String state;

    private Double latitude;
    private Double longitude;

    @Column(name = "risk_score")
    private Double riskScore; // 0 to 100

    @Column(name = "population")
    private Integer population;

    @Column(name = "active_cases")
    private Integer activeCases;

    @Column(name = "water_quality_status")
    private String waterQualityStatus; // SAFE, CONTAMINATED, UNKNOWN

    @Column(name = "water_sources")
    private String waterSources;

    @Column(name = "last_survey_date")
    private java.util.Date lastSurveyDate;
}
