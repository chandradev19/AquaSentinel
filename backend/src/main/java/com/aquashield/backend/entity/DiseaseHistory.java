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
@Table(name = "disease_history")
public class DiseaseHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "village_id")
    private Village village;

    private String diseaseName;
    private Integer cases;
    private Integer recovered;
    private Integer deaths;

    @Column(name = "record_date")
    private Date recordDate;

    @PrePersist
    protected void onCreate() {
        if (recordDate == null) recordDate = new Date();
    }
}
