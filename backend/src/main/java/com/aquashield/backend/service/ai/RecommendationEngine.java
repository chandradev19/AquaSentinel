package com.aquashield.backend.service.ai;

import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class RecommendationEngine {

    public Map<String, List<String>> generateRoleBasedRecommendations(
            String disease, 
            double waterQuality, 
            double rainfall, 
            int historicalCases, 
            int activeCases) {
            
        Map<String, List<String>> recommendations = new HashMap<>();
        List<String> citizen = new ArrayList<>();
        List<String> worker = new ArrayList<>();
        List<String> admin = new ArrayList<>();

        boolean hasDisease = disease != null && !disease.equals("None") && !disease.equals("Unknown");

        // CITIZEN RECOMMENDATIONS
        if (waterQuality > 50) {
            citizen.add("Boil drinking water for at least 3 minutes.");
            citizen.add("Avoid drawing water from heavily contaminated open wells or ponds.");
        }
        if (hasDisease && (disease.equals("Cholera") || disease.equals("Diarrhea") || disease.equals("Dysentery"))) {
            citizen.add("Consume ORS (Oral Rehydration Solution) immediately if experiencing fluid loss.");
        }
        if (hasDisease) {
            citizen.add("Wash hands strictly with soap after using the toilet and before meals.");
            citizen.add("Visit the nearest Primary Health Center (PHC) if symptoms arise.");
        }
        if (rainfall > 100) {
            citizen.add("Clear stagnant water around your home to prevent vector breeding.");
        }
        if (citizen.isEmpty()) {
            citizen.add("Maintain standard personal hygiene and hydration.");
        }

        // FIELD WORKER RECOMMENDATIONS
        if (waterQuality > 50) {
            worker.add("Collect urgent water samples from primary sources for lab testing.");
            worker.add("Chlorinate local water storage tanks and distribute purification tablets.");
        }
        if (activeCases > 5) {
            worker.add("Visit the village for immediate door-to-door verification and symptom recording.");
        }
        if (activeCases > 0) {
            worker.add("Verify all pending citizen symptom reports in the field.");
        }
        if (rainfall > 100) {
            worker.add("Inspect drainage systems and low-lying areas for overflow contamination.");
        }
        if (worker.isEmpty()) {
            worker.add("Continue routine field surveillance.");
        }

        // ADMINISTRATOR RECOMMENDATIONS
        if (hasDisease && activeCases > 20) {
            admin.add("Deploy mobile medical teams and emergency supplies to the region.");
        }
        if (hasDisease && (activeCases > 0 || historicalCases > 50)) {
            admin.add("Issue district-wide public health advisory regarding " + disease + " prevention.");
        }
        if (waterQuality > 80) {
            admin.add("Request emergency tanker water dispatch to provide safe drinking water.");
        }
        if (hasDisease && (disease.equals("Cholera") || disease.equals("Typhoid")) && activeCases > 30) {
            admin.add("Evaluate temporary closure of local schools and public gatherings to prevent epidemic spread.");
        }
        if (rainfall > 200) {
            admin.add("Coordinate with disaster management for potential flood-induced sanitation collapse.");
        }
        if (admin.isEmpty()) {
            admin.add("Monitor intelligence dashboards for emerging anomalies.");
        }

        recommendations.put("CITIZEN", citizen);
        recommendations.put("HEALTH_WORKER", worker);
        recommendations.put("ADMIN", admin);

        return recommendations;
    }
}
