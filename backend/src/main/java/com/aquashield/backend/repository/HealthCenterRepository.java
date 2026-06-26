package com.aquashield.backend.repository;

import com.aquashield.backend.entity.HealthCenter;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface HealthCenterRepository extends JpaRepository<HealthCenter, Long> {
}
