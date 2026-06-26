package com.aquashield.backend.service.ai;

import com.aquashield.backend.entity.SymptomReport;
import com.aquashield.backend.entity.Village;
import com.aquashield.backend.entity.WaterQualityReport;
import com.aquashield.backend.repository.SymptomReportRepository;
import com.aquashield.backend.repository.VillageRepository;
import com.aquashield.backend.repository.WaterQualityReportRepository;
import com.aquashield.backend.repository.RiskAssessmentRepository;
import com.aquashield.backend.entity.RiskAssessment;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class RiskAssessmentAgent {

    @Autowired
    private SymptomReportRepository symptomReportRepository;

    @Autowired
    private WaterQualityReportRepository waterQualityReportRepository;

    @Autowired
    private VillageRepository villageRepository;

    @Autowired
    private RiskAssessmentRepository riskAssessmentRepository;

    @Autowired
    private com.aquashield.backend.repository.VillageHistoryRepository villageHistoryRepository;

    @Autowired
    private com.aquashield.backend.service.AuditLogService auditLogService;

    @Autowired
    private com.aquashield.backend.repository.WeatherDataRepository weatherDataRepository;

    @Autowired
    private com.aquashield.backend.repository.OutbreakHistoryRepository outbreakHistoryRepository;

    /**
     * Calculates Risk Score for a given village based on:
     * Active Cases (40%), Water Quality (30%), Historical Outbreaks (20%), and Weather/Rainfall (10%).
     */
    public RiskAssessment calculateRiskScore(Long villageId) {
        Village village = villageRepository.findById(villageId).orElse(null);
        if (village == null) return null;

        List<SymptomReport> verifiedReports = symptomReportRepository.findByVillageIdAndStatus(villageId, "VERIFIED");
        List<SymptomReport> pendingReports = symptomReportRepository.findByVillageIdAndStatus(villageId, "PENDING");
        List<WaterQualityReport> waterReports = waterQualityReportRepository.findByVillageId(villageId);

        // Calculate Symptom Factor (Scale 0-100 based on recent reports. Verified=15, Pending=5)
        double symptomFactor = Math.min((verifiedReports.size() * 15.0) + (pendingReports.size() * 5.0), 100.0);

        // Calculate Water Contamination Factor
        double avgContamination = waterReports.stream()
                .mapToDouble(WaterQualityReport::getContaminationLevel)
                .average()
                .orElse(0.0);

        // Fetch Rainfall Factor from WeatherData
        List<com.aquashield.backend.entity.WeatherData> weatherList = weatherDataRepository.findAll();
        double rainfallFactor = 0.0;
        if (!weatherList.isEmpty()) {
            rainfallFactor = weatherList.get(weatherList.size()-1).getRainfall() * 2.0; // dummy multiplier
        }
        rainfallFactor = Math.min(rainfallFactor, 100.0);

        // Historical outbreaks factor
        List<com.aquashield.backend.entity.OutbreakHistory> history = outbreakHistoryRepository.findAll();
        long historicalOutbreaks = history.stream().filter(h -> h.getVillage() != null && h.getVillage().getId().equals(villageId)).count();
        double historyFactor = Math.min(historicalOutbreaks * 20.0, 100.0);

        // Apply Risk Formula: Active Cases (40%), Water Quality (30%), Historical Outbreaks (20%), Weather/Rainfall (10%)
        double riskScore = (symptomFactor * 0.4) + (avgContamination * 0.3) + (historyFactor * 0.2) + (rainfallFactor * 0.1);
        String riskLevel = getRiskCategory(riskScore);

        // Save Risk Assessment Record
        RiskAssessment assessment = RiskAssessment.builder()
                .village(village)
                .symptomCasesScore(symptomFactor)
                .contaminationScore(avgContamination)
                .rainfallFactor(rainfallFactor)
                .totalRiskScore(riskScore)
                .riskLevel(riskLevel)
                .build();
        riskAssessmentRepository.save(assessment);

        // Update Village Risk Score
        village.setRiskScore(riskScore);
        villageRepository.save(village);

        // Record history snapshot
        com.aquashield.backend.entity.VillageHistory villageHistorySnapshot = com.aquashield.backend.entity.VillageHistory.builder()
                .village(village)
                .riskScore(riskScore)
                .activeCases(verifiedReports.size())
                .waterQualityStatus(village.getWaterQualityStatus())
                .build();
        villageHistoryRepository.save(villageHistorySnapshot);

        // Log risk calculation in audit trail
        auditLogService.log("RISK_CALCULATION", "Recalculated risk score for " + village.getName() + ": " + String.format("%.1f", riskScore) + "%");

        return assessment;
    }

    public String getRiskCategory(double riskScore) {
        if (riskScore < 30.0) return "LOW";
        if (riskScore < 60.0) return "MEDIUM";
        if (riskScore < 80.0) return "HIGH";
        return "CRITICAL";
    }
}
