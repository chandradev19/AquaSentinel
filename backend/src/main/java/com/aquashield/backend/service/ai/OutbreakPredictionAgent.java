package com.aquashield.backend.service.ai;

import com.aquashield.backend.entity.DiseasePrediction;
import com.aquashield.backend.entity.RiskAssessment;
import com.aquashield.backend.entity.Village;
import com.aquashield.backend.repository.DiseasePredictionRepository;
import com.aquashield.backend.repository.VillageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class OutbreakPredictionAgent {

    @Autowired
    private DiseasePredictionRepository predictionRepository;

    @Autowired
    private VillageRepository villageRepository;

    @Autowired
    private MachineLearningService machineLearningService;

    public DiseasePrediction predictOutbreak(Long villageId, RiskAssessment riskAssessment) {
        Village village = villageRepository.findById(villageId).orElse(null);
        if (village == null || riskAssessment == null) return null;

        // Mock extra attributes for prediction if not in DB yet
        double hist = Math.random() * 3; // Historical outbreaks mock
        double temp = 25.0 + Math.random() * 10.0; // Temp mock 25-35C
        double pop = village.getPopulation() != null ? village.getPopulation() : 2000;

        String predictedDisease = machineLearningService.predictDisease(
                riskAssessment.getContaminationScore(),
                7.0, 
                riskAssessment.getSymptomCasesScore(),
                riskAssessment.getRainfallFactor(),
                hist, temp, pop
        );

        double probability = 0.0;
        double confidence = 0.0;
        double expectedSpreadRadius = 0.0;
        String riskLevel = "LOW";
        String recommendedAction = "Continue routine monitoring.";

        if (!predictedDisease.equals("None") && !predictedDisease.equals("Unknown")) {
             probability = Math.min(riskAssessment.getTotalRiskScore() * 1.2, 99.9);
             confidence = 75.0 + Math.random() * 20.0; // Mock confidence
             expectedSpreadRadius = 1.5 + (probability / 10.0);
             
             if (probability > 80) {
                 riskLevel = "CRITICAL";
                 recommendedAction = "Immediate medical intervention required. Deploy mobile clinics and enforce boil-water advisories.";
             } else if (probability > 50) {
                 riskLevel = "HIGH";
                 recommendedAction = "Alert local hospitals. Increase water testing frequency.";
             } else {
                 riskLevel = "MODERATE";
                 recommendedAction = "Issue public health warnings. Monitor symptom reports closely.";
             }
        }

        if (!predictedDisease.equals("None") && !predictedDisease.equals("Unknown")) {
            int currentCases = village.getActiveCases() != null ? village.getActiveCases() : 0;
            double r0 = 1.0 + (probability / 100.0);
            
            int expected3Days = (int) Math.round(currentCases * Math.pow(r0, 3.0));
            int expected7Days = (int) Math.round(currentCases * Math.pow(r0, 7.0));

            DiseasePrediction prediction = DiseasePrediction.builder()
                    .village(village)
                    .predictedDisease(predictedDisease)
                    .outbreakProbability(probability)
                    .expectedCases3Days(expected3Days)
                    .expectedCases7Days(expected7Days)
                    .confidence(confidence)
                    .expectedSpreadRadius(expectedSpreadRadius)
                    .riskLevel(riskLevel)
                    .recommendedAction(recommendedAction)
                    .build();
            return predictionRepository.save(prediction);
        }

        return null;
    }
}
