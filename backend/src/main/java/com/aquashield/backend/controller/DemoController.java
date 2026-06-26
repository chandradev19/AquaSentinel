package com.aquashield.backend.controller;

import com.aquashield.backend.entity.*;
import com.aquashield.backend.repository.*;
import com.aquashield.backend.service.ai.AgentCoordinator;
import jakarta.persistence.EntityManager;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.Date;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/demo")
public class DemoController {

    @Autowired
    private VillageRepository villageRepository;

    @Autowired
    private SymptomReportRepository symptomReportRepository;

    @Autowired
    private WaterQualityReportRepository waterQualityReportRepository;

    @Autowired
    private WeatherDataRepository weatherDataRepository;

    @Autowired
    private AgentCoordinator agentCoordinator;

    @Autowired
    private EntityManager entityManager;

    private static final String DEMO_VILLAGE_NAME = "SIH Grand Finale Demo Village";

    @PostMapping("/start")
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public ResponseEntity<?> startDemo() {
        try {
            // Ensure clean state before starting
            resetDemoInternal();

            // 1. Create Sandbox Village
            Village village = Village.builder()
                    .name(DEMO_VILLAGE_NAME)
                    .district("Madurai")
                    .state("Tamil Nadu")
                    .latitude(9.9252)
                    .longitude(78.1198)
                    .population(4500)
                    .activeCases(50)
                    .riskScore(0.0)
                    .waterQualityStatus("UNKNOWN")
                    .build();
            village = villageRepository.save(village);

            // 2. Inject 50 Cholera Symptom Reports
            for (int i = 0; i < 50; i++) {
                SymptomReport sr = SymptomReport.builder()
                        .village(village)
                        .symptoms("Severe Diarrhea, Vomiting, Leg Cramps")
                        .severity("HIGH")
                        .status("VERIFIED")
                        .reportDate(new Date())
                        .photoUrl("https://example.com/sih-demo-photo-" + i + ".jpg")
                        .build();
                symptomReportRepository.save(sr);
            }

            // 3. Inject Water Quality Report (Critical Contamination)
            WaterQualityReport wq = WaterQualityReport.builder()
                    .village(village)
                    .contaminationLevel(94.5)
                    .phLevel(5.2)
                    .turbidity(45.0)
                    .safeToDrink(false)
                    .reportDate(new Date())
                    .build();
            waterQualityReportRepository.save(wq);

            // 4. Inject Weather Data (Heavy Rainfall)
            WeatherData wd = WeatherData.builder()
                    .village(village)
                    .rainfall(185.0)
                    .temperature(31.5)
                    .humidity(88.0)
                    .recordedAt(new Date())
                    .build();
            weatherDataRepository.save(wd);

            // 5. Trigger AI Core Pipeline
            agentCoordinator.runAnalysisForVillage(village.getId());

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "villageId", village.getId(),
                    "message", "SIH Demo initialized successfully."
            ));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/reset")
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public ResponseEntity<?> resetDemo() {
        try {
            resetDemoInternal();
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "SIH Demo sandbox completely purged."
            ));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    private void resetDemoInternal() {
        // Find existing demo villages and aggressively wipe related data
        java.util.List<Village> villages = villageRepository.findAll().stream()
                .filter(v -> v.getName().equals(DEMO_VILLAGE_NAME))
                .toList();

        for (Village village : villages) {
            Long vId = village.getId();
            
            // Native deletes for speed and ignoring missing repository methods
            entityManager.createQuery("DELETE FROM SymptomReport s WHERE s.village.id = :id")
                    .setParameter("id", vId).executeUpdate();
            
            entityManager.createQuery("DELETE FROM WaterQualityReport w WHERE w.village.id = :id")
                    .setParameter("id", vId).executeUpdate();
            
            entityManager.createQuery("DELETE FROM WeatherData w WHERE w.village.id = :id")
                    .setParameter("id", vId).executeUpdate();
            
            entityManager.createQuery("DELETE FROM DiseasePrediction d WHERE d.village.id = :id")
                    .setParameter("id", vId).executeUpdate();
            
            entityManager.createQuery("DELETE FROM EmergencyAction e WHERE e.village.id = :id")
                    .setParameter("id", vId).executeUpdate();
            
            entityManager.createQuery("DELETE FROM Alert a WHERE a.village.id = :id")
                    .setParameter("id", vId).executeUpdate();
            
            entityManager.createQuery("DELETE FROM Notification n WHERE n.village.id = :id")
                    .setParameter("id", vId).executeUpdate();

            // Finally, delete the village
            villageRepository.delete(village);
        }
    }
}
