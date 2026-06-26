package com.aquashield.backend.repository;

import com.aquashield.backend.entity.WaterQualityReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WaterQualityReportRepository extends JpaRepository<WaterQualityReport, Long> {
    List<WaterQualityReport> findByVillageId(Long villageId);
}
