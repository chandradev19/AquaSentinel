package com.aquashield.backend.repository.knowledge;

import com.aquashield.backend.entity.knowledge.DiseaseSymptom;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface DiseaseSymptomRepository extends JpaRepository<DiseaseSymptom, Long> {
    List<DiseaseSymptom> findByDiseaseId(Long diseaseId);
}
