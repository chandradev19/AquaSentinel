package com.aquashield.backend.service.ai;

import com.aquashield.backend.entity.Village;
import com.aquashield.backend.entity.RiskAssessment;
import com.aquashield.backend.repository.VillageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class HealthAdvisorAgent {

    @Autowired
    private VillageRepository villageRepository;

    @Autowired
    private HealthKnowledgeAgent healthKnowledgeAgent;

    @Autowired
    private RiskAssessmentAgent riskAssessmentAgent;

    @Autowired
    private MachineLearningService machineLearningService;

    @Autowired
    private RecommendationEngine recommendationEngine;

    public String generateAdvice(Long villageId, String question) {
        Village village = villageRepository.findById(villageId).orElse(null);
        if (village == null) return "I cannot find data for this village.";

        RiskAssessment riskAssessment = riskAssessmentAgent.calculateRiskScore(village.getId());
        double riskScore = riskAssessment != null ? riskAssessment.getTotalRiskScore() : (village.getRiskScore() != null ? village.getRiskScore() : 0.0);
        
        String lowerQuestion = question.toLowerCase();
        String kbContext = healthKnowledgeAgent.retrieveKnowledgeContext(question);
        
        StringBuilder response = new StringBuilder();

        // Use ML to predict disease directly if they ask about high risk or diseases
        String predictedDisease = "None";
        List<String> recommendations = null;
        if (riskAssessment != null) {
            predictedDisease = machineLearningService.predictDisease(
                    riskAssessment.getContaminationScore(),
                    7.0,
                    riskAssessment.getSymptomCasesScore(),
                    riskAssessment.getRainfallFactor(),
                    1.0, 30.0, 2000.0
            );
            java.util.Map<String, List<String>> recMap = recommendationEngine.generateRoleBasedRecommendations(
                predictedDisease, 
                riskAssessment.getContaminationScore(), 
                riskAssessment.getRainfallFactor(), 
                0, 
                village.getActiveCases()
            );
            // Just show citizen rules for the chatbot if they are a citizen
            recommendations = recMap.get("CITIZEN");
        }

        if (lowerQuestion.contains("why") && lowerQuestion.contains("high risk")) {
            if (riskScore > 70) {
                response.append("The village is classified as high risk because the recent risk score calculated is ")
                        .append(String.format("%.1f", riskScore))
                        .append("/100. This is based on a combination of recent symptom reports, high water contamination levels, and recent rainfall patterns which act as a catalyst.\n\n");
                if (!predictedDisease.equals("None") && !predictedDisease.equals("Unknown")) {
                    response.append("Our AI models also predict a high probability of a ").append(predictedDisease).append(" outbreak.\n\n");
                }
            } else {
                response.append("Currently, the village is not at high risk. The risk score is ")
                        .append(String.format("%.1f", riskScore)).append("/100.\n\n");
            }
        } else if (lowerQuestion.contains("safe to drink") || lowerQuestion.contains("water quality")) {
            if (riskAssessment != null && riskAssessment.getContaminationScore() > 50) {
                response.append("Based on recent sensor data, we advise BOILING your water before consumption. Turbidity and contamination levels are elevated.\n\n");
            } else {
                response.append("The water quality in your area is currently within safe parameters. However, always exercise caution during monsoon season.\n\n");
            }
        } else if (lowerQuestion.contains("recommendation") || lowerQuestion.contains("what should we do")) {
            response.append("Based on current village parameters, here are our automated recommendations for you:\n");
            if (recommendations != null && !recommendations.isEmpty()) {
                for (String r : recommendations) {
                    response.append("- ").append(r).append("\n");
                }
            } else {
                response.append("Maintain standard protocols.\n");
            }
            response.append("\n");
        } else {
            response.append("Based on the data for ").append(village.getName()).append(" (Risk Score: ").append(String.format("%.1f", riskScore)).append("), I recommend maintaining standard hygiene practices. If you experience symptoms, please report them immediately.\n\n");
        }

        if (!kbContext.isEmpty()) {
            response.append("--- Health Knowledge Base Reference ---\n").append(kbContext);
        }

        return response.toString();
    }
}
