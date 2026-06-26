package com.aquashield.backend.repository;

import com.aquashield.backend.entity.SymptomReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SymptomReportRepository extends JpaRepository<SymptomReport, Long> {
    List<SymptomReport> findByVillageId(Long villageId);
    List<SymptomReport> findByUserId(Long userId);
    List<SymptomReport> findByVillageIdAndStatus(Long villageId, String status);
    List<SymptomReport> findByStatus(String status);
    List<SymptomReport> findAllByOrderByReportDateDesc();
    Long countByVillageId(Long villageId);
}
