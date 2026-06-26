package com.aquashield.backend.repository;

import com.aquashield.backend.entity.OutbreakHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface OutbreakHistoryRepository extends JpaRepository<OutbreakHistory, Long> {
}
