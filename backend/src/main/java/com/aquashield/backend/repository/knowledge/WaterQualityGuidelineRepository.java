package com.aquashield.backend.repository.knowledge;

import com.aquashield.backend.entity.knowledge.WaterQualityGuideline;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WaterQualityGuidelineRepository extends JpaRepository<WaterQualityGuideline, Long> {
}
