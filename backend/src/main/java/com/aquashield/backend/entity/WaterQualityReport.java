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
@Table(name = "water_quality_reports")
public class WaterQualityReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "health_worker_id", nullable = false)
    private User healthWorker;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "village_id", nullable = false)
    private Village village;

    @Column(name = "ph_level")
    private Double phLevel;

    private Double turbidity;

    @Column(name = "contamination_level")
    private Double contaminationLevel; // Scale 0-100

    @Column(name = "safe_to_drink")
    private Boolean safeToDrink;

    @Column(name = "report_date")
    private Date reportDate;

    @PrePersist
    protected void onCreate() {
        reportDate = new Date();
    }
}
