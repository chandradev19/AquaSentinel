package com.aquashield.backend.repository.knowledge;

import com.aquashield.backend.entity.knowledge.FaqEntry;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FaqEntryRepository extends JpaRepository<FaqEntry, Long> {
}
