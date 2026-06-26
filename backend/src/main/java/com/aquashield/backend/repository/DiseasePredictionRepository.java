package com.aquashield.backend.repository;

import com.aquashield.backend.entity.DiseasePrediction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DiseasePredictionRepository extends JpaRepository<DiseasePrediction, Long> {
    List<DiseasePrediction> findByVillageId(Long villageId);
}
