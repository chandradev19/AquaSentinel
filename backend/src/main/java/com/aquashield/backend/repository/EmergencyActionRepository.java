package com.aquashield.backend.repository;

import com.aquashield.backend.entity.EmergencyAction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface EmergencyActionRepository extends JpaRepository<EmergencyAction, Long> {
}
