package com.aquashield.backend.controller;

import com.aquashield.backend.entity.Village;
import com.aquashield.backend.repository.VillageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/villages")
@CrossOrigin(origins = "*")
public class VillageController {

    @Autowired
    private VillageRepository villageRepository;

    @Autowired
    private com.aquashield.backend.repository.SymptomReportRepository symptomReportRepository;

    @Autowired
    private com.aquashield.backend.repository.UserRepository userRepository;

    @Autowired
    private com.aquashield.backend.repository.DiseasePredictionRepository diseasePredictionRepository;

    @Autowired
    private com.aquashield.backend.repository.VillageHistoryRepository villageHistoryRepository;

    @GetMapping
    public ResponseEntity<List<Village>> getAllVillages() {
        return ResponseEntity.ok(villageRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Village> getVillage(@PathVariable Long id) {
        return villageRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/intelligence")
    public ResponseEntity<com.aquashield.backend.dto.VillageIntelligenceDto> getVillageIntelligence(@PathVariable Long id) {
        Village village = villageRepository.findById(id).orElse(null);
        if (village == null) return ResponseEntity.notFound().build();

        Long totalReports = symptomReportRepository.countByVillageId(id);
        
        List<com.aquashield.backend.entity.User> workers = userRepository.findByVillageIdAndRole(id, com.aquashield.backend.entity.Role.HEALTH_WORKER);
        List<com.aquashield.backend.dto.UserDto> workerDtos = workers.stream()
                .map(w -> com.aquashield.backend.dto.UserDto.builder()
                        .id(w.getId())
                        .email(w.getEmail())
                        .phone(w.getPhone() != null ? w.getPhone() : "N/A")
                        .role(w.getRole().name())
                        .build())
                .collect(java.util.stream.Collectors.toList());

        String emergencyStatus = "NORMAL";
        if (village.getRiskScore() != null) {
            if (village.getRiskScore() >= 75) emergencyStatus = "CRITICAL";
            else if (village.getRiskScore() >= 50) emergencyStatus = "ELEVATED";
        }

        // Mock hospitals
        List<java.util.Map<String, String>> hospitals = List.of(
            java.util.Map.of("name", "District General Hospital", "distance", "12 km", "contact", "+1 555-0192"),
            java.util.Map.of("name", "St. Jude Rural Clinic", "distance", "4.5 km", "contact", "+1 555-0188")
        );

        List<com.aquashield.backend.entity.DiseasePrediction> predictions = diseasePredictionRepository.findByVillageId(id);
        com.aquashield.backend.entity.DiseasePrediction latestPrediction = predictions.isEmpty() ? null : predictions.get(predictions.size() - 1);

        List<com.aquashield.backend.entity.VillageHistory> history = villageHistoryRepository.findByVillageIdOrderByRecordedAtAsc(id);

        com.aquashield.backend.dto.VillageIntelligenceDto dto = com.aquashield.backend.dto.VillageIntelligenceDto.builder()
                .village(village)
                .totalReports(totalReports)
                .emergencyStatus(emergencyStatus)
                .assignedWorkers(workerDtos)
                .nearbyHospitals(hospitals)
                .aiPrediction(latestPrediction)
                .riskTimeline(history)
                .build();

        return ResponseEntity.ok(dto);
    }
}
