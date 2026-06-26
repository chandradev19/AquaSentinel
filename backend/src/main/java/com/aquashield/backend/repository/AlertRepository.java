package com.aquashield.backend.repository;

import com.aquashield.backend.entity.Alert;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AlertRepository extends JpaRepository<Alert, Long> {
    List<Alert> findByVillageId(Long villageId);
    List<Alert> findAllByOrderByCreatedAtDesc();
}
