package com.aquashield.backend.repository;

import com.aquashield.backend.entity.FieldWorker;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface FieldWorkerRepository extends JpaRepository<FieldWorker, Long> {
}
