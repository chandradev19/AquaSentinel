package com.aquashield.backend.repository;

import com.aquashield.backend.entity.DiseaseHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DiseaseHistoryRepository extends JpaRepository<DiseaseHistory, Long> {
}
