package com.aquashield.backend.repository.knowledge;

import com.aquashield.backend.entity.knowledge.HealthAdvisory;
import org.springframework.data.jpa.repository.JpaRepository;

public interface HealthAdvisoryRepository extends JpaRepository<HealthAdvisory, Long> {
}
