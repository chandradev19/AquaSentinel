package com.aquashield.backend.service.ai;

import com.aquashield.backend.entity.Alert;
import com.aquashield.backend.entity.DiseasePrediction;
import com.aquashield.backend.entity.Village;
import com.aquashield.backend.repository.AlertRepository;
import com.aquashield.backend.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class AlertGenerationAgent {

    @Autowired
    private AlertRepository alertRepository;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private com.aquashield.backend.repository.EmergencyActionRepository emergencyActionRepository;

    @Autowired
    private com.aquashield.backend.service.ai.RecommendationEngine recommendationEngine;

    public void generateAlerts(Village village, double riskScore, DiseasePrediction prediction, double contaminationScore) {
        String disease = prediction != null ? prediction.getPredictedDisease() : "Water-borne disease";
        String riskLevel = riskScore > 80.0 ? "CRITICAL" : (riskScore > 70.0 ? "HIGH" : "MEDIUM");

        if (riskScore > 70.0) {
            String adminMessage = "Operational Alert: High risk of " + disease + 
                    " outbreak in " + village.getName() + " (Risk Score: " + String.format("%.1f", riskScore) + "). Immediate intervention required.";
            
            Alert alert = Alert.builder()
                    .village(village)
                    .alertLevel(riskLevel)
                    .alertType("Disease Outbreak")
                    .message(adminMessage)
                    .build();
            alertRepository.save(alert);
            
            notificationService.notifyAdmins(
                adminMessage, 
                "Disease Outbreak Alert", 
                disease, 
                village.getName(), 
                riskLevel
            );
            
            notificationService.notifyHealthWorkers(
                village.getId(), 
                "Your village (" + village.getName() + ") has reached " + riskLevel + " risk for " + disease + ". Prepare for field intervention.", 
                "Field Intervention Required", 
                disease, 
                village.getName(), 
                riskLevel
            );

            // EMERGENCY ESCALATION SYSTEM
            if (riskScore > 80.0) {
                // Generate Emergency Action Plan
                java.util.Map<String, java.util.List<String>> recommendations = recommendationEngine.generateRoleBasedRecommendations(
                    disease, 
                    contaminationScore, 
                    village.getRiskScore() != null ? village.getRiskScore() : 0.0, 
                    0, 
                    village.getActiveCases()
                );
                
                StringBuilder actionPlanBuilder = new StringBuilder();
                actionPlanBuilder.append("### CITIZEN DIRECTIVES\n");
                for(String r : recommendations.get("CITIZEN")) actionPlanBuilder.append("- ").append(r).append("\n");
                
                actionPlanBuilder.append("\n### FIELD WORKER PROTOCOLS\n");
                for(String r : recommendations.get("HEALTH_WORKER")) actionPlanBuilder.append("- ").append(r).append("\n");
                
                actionPlanBuilder.append("\n### ADMINISTRATOR ACTIONS\n");
                for(String r : recommendations.get("ADMIN")) actionPlanBuilder.append("- ").append(r).append("\n");

                String actionPlan = actionPlanBuilder.toString();

                com.aquashield.backend.entity.EmergencyAction emergencyAction = com.aquashield.backend.entity.EmergencyAction.builder()
                    .village(village)
                    .actionPlan(actionPlan)
                    .priority("CRITICAL")
                    .status("INITIATED")
                    .triggeredByAlert(alert)
                    .build();
                emergencyActionRepository.save(emergencyAction);

                // Escalate to District Health Officer
                notificationService.notifyDistrictOfficer(
                    village.getDistrict(), 
                    "ESCALATION: " + adminMessage, 
                    "District Escalation", 
                    disease, 
                    village.getName(), 
                    riskLevel
                );
                
                // Notify Citizens with a public safety message (no internal operational jargon)
                String citizenMessage = "PUBLIC HEALTH ADVISORY: We have detected a high risk of " + disease + 
                    " in " + village.getName() + ". Please boil your drinking water for at least 1 minute and practice strict hand hygiene. If you experience symptoms, report them immediately.";
                notificationService.notifyCitizens(
                    village.getId(),
                    citizenMessage,
                    "Public Health Advisory",
                    disease,
                    village.getName(),
                    riskLevel
                );
            }
        } else if (riskScore > 60.0) {
            String warningMessage = "WARNING: Elevated risk levels detected in " + village.getName() + ". Health workers should conduct immediate water quality tests.";
            
            Alert alert = Alert.builder()
                    .village(village)
                    .alertLevel("HIGH")
                    .alertType("Health Advisory")
                    .message(warningMessage)
                    .build();
            alertRepository.save(alert);
            
            notificationService.notifyAdmins(
                warningMessage,
                "Health Advisory",
                disease,
                village.getName(),
                "HIGH"
            );
            
            notificationService.notifyHealthWorkers(
                village.getId(), 
                warningMessage,
                "Water Test Required",
                disease,
                village.getName(),
                "HIGH"
            );
        }
    }
}
