package com.aquashield.backend.repository;

import com.aquashield.backend.entity.AiModelMetadata;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AiModelMetadataRepository extends JpaRepository<AiModelMetadata, Long> {
    Optional<AiModelMetadata> findByModelName(String modelName);
}
