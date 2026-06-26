package com.aquashield.backend.service.ai;

import com.aquashield.backend.entity.SymptomReport;
import com.aquashield.backend.entity.WaterQualityReport;
import com.aquashield.backend.repository.SymptomReportRepository;
import com.aquashield.backend.repository.WaterQualityReportRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class LearningSystemScheduler {

    @Autowired
    private MachineLearningService machineLearningService;

    @Autowired
    private SymptomReportRepository symptomReportRepository;

    @Autowired
    private WaterQualityReportRepository waterQualityReportRepository;

    // Run every day at 2 AM
    @Scheduled(cron = "0 0 2 * * ?")
    public void scheduledRetrain() {
        System.out.println("Initiating scheduled Machine Learning retraining cycle...");
        triggerRetrain();
    }

    public void triggerRetrain() {
        List<SymptomReport> reports = symptomReportRepository.findAll();
        // Just as an example, we build features from real DB data
        // In a real scenario we'd do a complex join grouped by Village and Time
        // For simplicity, we just use random synthesis if data is sparse
        if (reports.size() < 50) {
            System.out.println("Not enough real data to train. Relying on synthetic baseline.");
            machineLearningService.trainModelWithSyntheticData();
            return;
        }

        List<double[]> features = new ArrayList<>();
        List<String> labels = new ArrayList<>();

        for (SymptomReport report : reports) {
            double contLevel = 50.0;
            double phLevel = 7.0;
            List<WaterQualityReport> wq = waterQualityReportRepository.findByVillageId(report.getVillage().getId());
            if (!wq.isEmpty()) {
                contLevel = wq.get(0).getContaminationLevel();
                phLevel = wq.get(0).getPhLevel() != null ? wq.get(0).getPhLevel() : 7.0;
            }

            double symptomScore = report.getStatus().equals("VERIFIED") ? 80.0 : 40.0;
            double rainfallFactor = (report.getVillage().getId() * 13) % 100.0; // mock

            features.add(new double[]{contLevel, phLevel, symptomScore, rainfallFactor});
            
            // Derive historical label
            String label = "None";
            if (report.getSymptoms().toLowerCase().contains("cholera")) label = "Cholera";
            else if (report.getSymptoms().toLowerCase().contains("typhoid")) label = "Typhoid";
            else if (report.getSymptoms().toLowerCase().contains("diarrhea")) label = "Diarrhea";
            
            labels.add(label);
        }

        machineLearningService.retrainModel(features, labels);
    }
}
