package com.aquashield.backend.repository.knowledge;

import com.aquashield.backend.entity.knowledge.Disease;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DiseaseRepository extends JpaRepository<Disease, Long> {
}
