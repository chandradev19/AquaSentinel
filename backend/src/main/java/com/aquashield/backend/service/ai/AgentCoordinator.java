package com.aquashield.backend.service.ai;

import com.aquashield.backend.entity.DiseasePrediction;
import com.aquashield.backend.entity.Village;
import com.aquashield.backend.repository.VillageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AgentCoordinator {

    @Autowired
    private VillageRepository villageRepository;

    @Autowired
    private RiskAssessmentAgent riskAssessmentAgent;

    @Autowired
    private OutbreakPredictionAgent outbreakPredictionAgent;

    @Autowired
    private AlertGenerationAgent alertGenerationAgent;

    /**
     * Runs the multi-agent simulation for all villages.
     * This orchestrates the flow: Risk -> Prediction -> Alert
     */
    public void runAnalysisCycle() {
        List<Village> villages = villageRepository.findAll();
        
        for (Village village : villages) {
            runAnalysisForVillage(village.getId());
        }
    }

    public void runAnalysisForVillage(Long villageId) {
        Village village = villageRepository.findById(villageId).orElse(null);
        if (village == null) return;

        com.aquashield.backend.entity.RiskAssessment assessment = riskAssessmentAgent.calculateRiskScore(village.getId());
        if (assessment == null) return;

        DiseasePrediction prediction = outbreakPredictionAgent.predictOutbreak(village.getId(), assessment);
        alertGenerationAgent.generateAlerts(village, assessment.getTotalRiskScore(), prediction, assessment.getContaminationScore());
    }
}
