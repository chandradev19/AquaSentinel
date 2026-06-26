package com.aquashield.backend.entity.knowledge;

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
@Table(name = "water_quality_guidelines")
public class WaterQualityGuideline {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String parameter; // e.g., Turbidity, E.coli, pH

    @Column(nullable = false)
    private String acceptableRange;

    @Column(length = 2000)
    private String advice;
}
