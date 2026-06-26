package com.aquashield.backend.repository;

import com.aquashield.backend.entity.VillageHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface VillageHistoryRepository extends JpaRepository<VillageHistory, Long> {
    List<VillageHistory> findByVillageIdOrderByRecordedAtDesc(Long villageId);
    List<VillageHistory> findByVillageIdOrderByRecordedAtAsc(Long villageId);
}
