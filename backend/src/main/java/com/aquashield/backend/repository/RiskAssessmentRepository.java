package com.aquashield.backend.repository;

import com.aquashield.backend.entity.RiskAssessment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RiskAssessmentRepository extends JpaRepository<RiskAssessment, Long> {
    List<RiskAssessment> findByVillageId(Long villageId);
    Optional<RiskAssessment> findTopByVillageIdOrderByCreatedAtDesc(Long villageId);
}
