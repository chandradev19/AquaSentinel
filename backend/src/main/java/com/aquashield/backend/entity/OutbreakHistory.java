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
@Table(name = "outbreak_history")
public class OutbreakHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "village_id")
    private Village village;

    private String diseaseName;
    private Date startDate;
    private Date endDate;
    private Integer totalCases;
    private String containmentStatus;

    @Column(name = "recorded_at")
    private Date recordedAt;

    @PrePersist
    protected void onCreate() {
        if (recordedAt == null) recordedAt = new Date();
    }
}
