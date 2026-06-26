package com.aquashield.backend.service;

import com.aquashield.backend.entity.SymptomReport;
import com.aquashield.backend.entity.User;
import com.aquashield.backend.repository.SymptomReportRepository;
import com.aquashield.backend.service.ai.RiskAssessmentAgent;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.List;

@Service
public class ReportService {

    @Autowired
    private SymptomReportRepository symptomReportRepository;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private VillageService villageService;

    @Autowired
    private RiskAssessmentAgent riskAssessmentAgent;

    public SymptomReport submitReport(SymptomReport report) {
        report.setStatus("Submitted");
        report.setReportDate(new Date());
        
        // Generate Unique Report ID
        String uniqueId = "RPT-" + java.time.Year.now().getValue() + "-" + java.util.UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        report.setReportId(uniqueId);

        SymptomReport saved = symptomReportRepository.save(report);

        // Notify Health Workers in the same village
        notificationService.notifyHealthWorkers(
                report.getVillage().getId(), 
                "New citizen report submitted [" + uniqueId + "] in " + report.getVillage().getName() + ". Please verify.",
                "New Citizen Report: " + uniqueId,
                "Pending Review",
                report.getVillage().getName(),
                "LOW"
        );
        
        // Notify Admins
        notificationService.notifyAdmins(
                "New citizen report submitted [" + uniqueId + "] in " + report.getVillage().getName(),
                "New Citizen Report: " + uniqueId,
                "Pending Review",
                report.getVillage().getName(),
                "LOW"
        );

        return saved;
    }

    public SymptomReport updateReport(Long reportId, com.aquashield.backend.dto.SymptomReportDto dto, Long userId) {
        SymptomReport report = symptomReportRepository.findById(reportId).orElseThrow(() -> new RuntimeException("Report not found"));
        if (!report.getUser().getId().equals(userId)) {
            throw new RuntimeException("Unauthorized to edit this report");
        }
        if (!"Submitted".equals(report.getStatus()) && !"Assigned".equals(report.getStatus())) {
            throw new RuntimeException("Report cannot be edited after verification has started");
        }

        report.setSymptoms(dto.getSymptoms());
        report.setAge(dto.getAge());
        report.setGender(dto.getGender());
        report.setSeverity(dto.getSeverity() != null ? dto.getSeverity() : "MEDIUM");
        report.setDuration(dto.getDuration());
        report.setRemarks(dto.getRemarks());
        report.setPhotoUrl(dto.getPhotoUrl());
        report.setVideoUrl(dto.getVideoUrl());
        report.setLatitude(dto.getLatitude());
        report.setLongitude(dto.getLongitude());
        report.setWaterQualityComplaint(dto.getWaterQualityComplaint());
        report.setDeadAnimalReport(dto.getDeadAnimalReport());
        report.setAffectedFamilyMembers(dto.getAffectedFamilyMembers());
        report.setDrinkingWaterSource(dto.getDrinkingWaterSource());

        return symptomReportRepository.save(report);
    }

    public List<SymptomReport> getReportsByUser(Long userId) {
        return symptomReportRepository.findByUserId(userId);
    }

    public List<SymptomReport> getReportsByVillage(Long villageId) {
        return symptomReportRepository.findByVillageId(villageId);
    }

    public List<SymptomReport> getAllReports() {
        return symptomReportRepository.findAll();
    }

    public SymptomReport verifyReport(Long reportId, User verifiedBy) {
        SymptomReport report = symptomReportRepository.findById(reportId).orElseThrow(() -> new RuntimeException("Report not found"));
        report.setStatus("VERIFIED");
        report.setVerifiedBy(verifiedBy);
        report.setVerifiedAt(new Date());
        SymptomReport saved = symptomReportRepository.save(report);

        // Workflow: Status -> VERIFIED
        // 1. Notify Citizen
        notificationService.notifyUser(report.getUser(), "Your symptom report has been verified.");
        
        // 2. Notify Admin
        notificationService.notifyAdmins(
                "Symptom report verified in " + report.getVillage().getName(),
                "Symptom Report Verified",
                "Verified Case",
                report.getVillage().getName(),
                "MEDIUM"
        );

        // 3. Increment active cases in Village
        villageService.incrementActiveCases(report.getVillage().getId());

        // 4. Trigger AI Risk Assessment
        try {
            riskAssessmentAgent.calculateRiskScore(report.getVillage().getId());
        } catch (Exception e) {
            System.err.println("Failed to trigger RiskAssessmentAgent: " + e.getMessage());
        }

        return saved;
    }

    public SymptomReport rejectReport(Long reportId, User rejectedBy) {
        SymptomReport report = symptomReportRepository.findById(reportId).orElseThrow(() -> new RuntimeException("Report not found"));
        report.setStatus("REJECTED");
        report.setVerifiedBy(rejectedBy);
        report.setVerifiedAt(new Date());
        SymptomReport saved = symptomReportRepository.save(report);

        notificationService.notifyUser(report.getUser(), "Your symptom report has been rejected after review.");
        return saved;
    }
}
