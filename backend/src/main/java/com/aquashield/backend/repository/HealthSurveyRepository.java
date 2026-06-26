package com.aquashield.backend.repository;

import com.aquashield.backend.entity.HealthSurvey;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HealthSurveyRepository extends JpaRepository<HealthSurvey, Long> {
    List<HealthSurvey> findByVillageId(Long villageId);
}
