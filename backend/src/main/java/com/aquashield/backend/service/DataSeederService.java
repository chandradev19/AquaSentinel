package com.aquashield.backend.service;

import com.aquashield.backend.entity.*;
import com.aquashield.backend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Random;

@Slf4j
@Service
@RequiredArgsConstructor
public class DataSeederService implements ApplicationRunner {

    private final UserRepository userRepository;
    private final VillageRepository villageRepository;
    private final SymptomReportRepository symptomReportRepository;
    private final WaterQualityReportRepository waterQualityReportRepository;
    private final AlertRepository alertRepository;
    private final DiseasePredictionRepository diseasePredictionRepository;
    private final PasswordEncoder passwordEncoder;

    private final Random random = new Random();

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        log.info("Checking if SIH Demo Data seeding is needed...");

        if (villageRepository.count() >= 100) {
            log.info("SIH Demo Data already exists. Skipping seeding.");
            return;
        }

        log.info("Starting AQUASHIELD AI - DEMO DATA GENERATION FOR SIH PRESENTATION...");

        // 1. Generate 100 Villages across India
        List<Village> villages = new ArrayList<>();
        String[] states = {"Tamil Nadu", "Maharashtra", "Karnataka", "Kerala", "Gujarat", "Rajasthan", "Uttar Pradesh", "West Bengal", "Punjab", "Odisha"};
        String[] districts = {"Coimbatore", "Madurai", "Thanjavur", "Pune", "Nashik", "Mysore", "Kochi", "Surat", "Jaipur", "Lucknow", "Kolkata", "Ludhiana", "Cuttack"};
        
        // Ensure specific examples are included
        villages.add(createVillage("Kattur", "Coimbatore", "Tamil Nadu", 4850, 82.0, "Poor", 11.0168, 76.9558, 25));
        villages.add(createVillage("Thirunagar", "Madurai", "Tamil Nadu", 6240, 68.0, "Moderate", 9.8821, 78.0833, 12));
        villages.add(createVillage("Marutham", "Thanjavur", "Tamil Nadu", 3100, 25.0, "Good", 10.7870, 79.1378, 2));

        int highRiskCount = 20; // Need 20 high risk (Red)
        int mediumRiskCount = 30; // Need 30 medium risk (Orange/Yellow)

        highRiskCount -= 1; // Kattur is high risk
        mediumRiskCount -= 1; // Thirunagar is medium risk

        for (int i = 4; i <= 100; i++) {
            double riskScore;
            String waterQuality;
            if (highRiskCount > 0) {
                riskScore = 75.0 + random.nextDouble() * 25.0; // 75-100
                waterQuality = "Poor";
                highRiskCount--;
            } else if (mediumRiskCount > 0) {
                riskScore = 40.0 + random.nextDouble() * 34.0; // 40-74
                waterQuality = "Moderate";
                mediumRiskCount--;
            } else {
                riskScore = 5.0 + random.nextDouble() * 34.0; // 5-39
                waterQuality = "Good";
            }

            double lat = 8.0 + random.nextDouble() * 20.0; // Random India lat
            double lon = 68.0 + random.nextDouble() * 20.0; // Random India lon

            villages.add(createVillage("Village " + i, districts[random.nextInt(districts.length)], states[random.nextInt(states.length)], 
                1000 + random.nextInt(9000), riskScore, waterQuality, lat, lon, random.nextInt(30)));
        }
        villages = villageRepository.saveAll(villages);
        log.info("Generated 100 villages.");

        // 2. Generate Admin
        userRepository.findByEmail("admin@aquashield.gov").orElseGet(() -> {
            return userRepository.save(User.builder()
                    .name("System Admin")
                    .email("admin@aquashield.gov")
                    .password(passwordEncoder.encode("admin123"))
                    .role(Role.ADMIN)
                    .phone("9999999999")
                    .build());
        });

        // 3. Generate 50 Workers
        List<User> workers = new ArrayList<>();
        for (int i = 1; i <= 50; i++) {
            final int finalI = i;
            Village v = villages.get(i % villages.size());
            User w = userRepository.findByEmail("worker" + i + "@aquashield.gov").orElseGet(() -> {
                return User.builder()
                        .name("Field Worker " + finalI)
                        .email("worker" + finalI + "@aquashield.gov")
                        .password(passwordEncoder.encode("worker123"))
                        .role(Role.HEALTH_WORKER)
                        .phone("88888888" + String.format("%02d", finalI))
                        .village(v)
                        .build();
            });
            workers.add(w);
        }
        workers = userRepository.saveAll(workers);
        log.info("Generated 50 field workers.");

        // 4. Generate 500 Citizens
        List<User> citizens = new ArrayList<>();
        for (int i = 1; i <= 500; i++) {
            final int finalI = i;
            Village v = villages.get(random.nextInt(villages.size()));
            User c = userRepository.findByEmail("citizen" + i + "@gmail.com").orElseGet(() -> {
                return User.builder()
                        .name("Citizen " + finalI)
                        .email("citizen" + finalI + "@gmail.com")
                        .password(passwordEncoder.encode("citizen123"))
                        .role(Role.CITIZEN)
                        .phone("777777" + String.format("%04d", finalI))
                        .village(v)
                        .build();
            });
            citizens.add(c);
        }
        citizens = userRepository.saveAll(citizens);
        log.info("Generated 500 citizens.");

        // 5. Generate 2000 Symptom Reports
        String[] diseases = {"Cholera", "Typhoid", "Diarrhea", "Dysentery", "Hepatitis A"};
        String[] statuses = {"PENDING", "VERIFIED", "ESCALATED", "RESOLVED"};
        List<SymptomReport> symptomReports = new ArrayList<>();
        for (int i = 1; i <= 2000; i++) {
            User c = citizens.get(random.nextInt(citizens.size()));
            Village v = c.getVillage();
            SymptomReport r = SymptomReport.builder()
                    .user(c)
                    .village(v)
                    .symptoms("Symptoms of " + diseases[random.nextInt(diseases.length)])
                    .age(10 + random.nextInt(60))
                    .gender(random.nextBoolean() ? "Male" : "Female")
                    .severity(random.nextBoolean() ? "HIGH" : "MEDIUM")
                    .duration(random.nextInt(10) + " days")
                    .status(statuses[random.nextInt(statuses.length)])
                    .latitude(v.getLatitude() + (random.nextDouble() - 0.5) * 0.01)
                    .longitude(v.getLongitude() + (random.nextDouble() - 0.5) * 0.01)
                    .reportDate(new Date(System.currentTimeMillis() - random.nextInt(30) * 86400000L))
                    .build();
            if ("VERIFIED".equals(r.getStatus()) || "ESCALATED".equals(r.getStatus()) || "RESOLVED".equals(r.getStatus())) {
                r.setVerifiedBy(workers.get(random.nextInt(workers.size())));
                r.setVerifiedAt(new Date(r.getReportDate().getTime() + 86400000L));
            }
            symptomReports.add(r);
        }
        symptomReportRepository.saveAll(symptomReports);
        log.info("Generated 2000 symptom reports.");

        // 6. Generate 500 Water Quality Reports
        List<WaterQualityReport> waterReports = new ArrayList<>();
        for (int i = 1; i <= 500; i++) {
            User w = workers.get(random.nextInt(workers.size()));
            Village v = w.getVillage();
            double ph = 5.0 + random.nextDouble() * 4.0;
            double turbidity = random.nextDouble() * 20.0;
            double contamination = random.nextDouble() * 100.0;
            boolean safe = ph >= 6.5 && ph <= 8.5 && turbidity < 5.0 && contamination < 20.0;
            

            WaterQualityReport wr = WaterQualityReport.builder()
                    .healthWorker(w)
                    .village(v)
                    .phLevel(ph)
                    .turbidity(turbidity)
                    .contaminationLevel(contamination)
                    .safeToDrink(safe)
                    .reportDate(new Date(System.currentTimeMillis() - random.nextInt(30) * 86400000L))
                    .build();
            waterReports.add(wr);
        }
        waterQualityReportRepository.saveAll(waterReports);
        log.info("Generated 500 water quality reports.");

        // 7. Generate 300 Alerts
        String[] alertTypes = {"Disease Outbreak", "Water Contamination", "Rainfall Alert", "Emergency Alert"};
        String[] alertLevels = {"LOW", "MEDIUM", "HIGH", "CRITICAL"};
        List<Alert> alerts = new ArrayList<>();
        for (int i = 1; i <= 300; i++) {
            Village v = villages.get(random.nextInt(villages.size()));
            Alert a = Alert.builder()
                    .village(v)
                    .alertLevel(alertLevels[random.nextInt(alertLevels.length)])
                    .alertType(alertTypes[random.nextInt(alertTypes.length)])
                    .status(random.nextBoolean() ? "ACTIVE" : "RESOLVED")
                    .message("Alert regarding " + alertTypes[random.nextInt(alertTypes.length)] + " in " + v.getName())
                    .createdAt(new Date(System.currentTimeMillis() - random.nextInt(30) * 86400000L))
                    .build();
            alerts.add(a);
        }
        alertRepository.saveAll(alerts);
        log.info("Generated 300 alerts.");

        // 8. Generate Notifications (Removed as per requirements)
        log.info("Mock notifications removed per strict role-based access update.");

        // 9. Generate Disease Predictions
        List<DiseasePrediction> predictions = new ArrayList<>();
        for (Village v : villages) {
            String predictedDisease = "None";
            double probability = random.nextDouble() * 100.0;
            
            if ("Kattur".equals(v.getName())) {
                predictedDisease = "Cholera";
                probability = 87.0;
            } else if ("Thirunagar".equals(v.getName())) {
                predictedDisease = "Typhoid";
                probability = 64.0;
            } else if ("Marutham".equals(v.getName())) {
                predictedDisease = "None";
                probability = 12.0;
            } else if (v.getRiskScore() > 70) {
                predictedDisease = diseases[random.nextInt(diseases.length)];
                probability = 70.0 + random.nextDouble() * 25.0;
            } else if (v.getRiskScore() > 40) {
                predictedDisease = diseases[random.nextInt(diseases.length)];
                probability = 40.0 + random.nextDouble() * 30.0;
            } else {
                probability = random.nextDouble() * 30.0;
            }

            predictions.add(DiseasePrediction.builder()
                .village(v)
                .predictedDisease(predictedDisease)
                .outbreakProbability(probability)
                .predictionDate(new Date())
                .build());
        }
        diseasePredictionRepository.saveAll(predictions);
        log.info("Generated 100 disease predictions.");

        log.info("AQUASHIELD AI DEMO DATA SEEDING COMPLETE!");
    }

    private Village createVillage(String name, String district, String state, int population, double riskScore, String waterQuality, double lat, double lon, int activeCases) {
        return Village.builder()
            .name(name)
            .district(district)
            .state(state)
            .population(population)
            .riskScore(riskScore)
            .waterQualityStatus(waterQuality)
            .latitude(lat)
            .longitude(lon)
            .activeCases(activeCases)
            .waterSources("Borewell, Municipal")
            .lastSurveyDate(new Date(System.currentTimeMillis() - random.nextInt(10) * 86400000L))
            .build();
    }
}
