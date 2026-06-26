package com.aquashield.backend.controller;

import com.aquashield.backend.dto.ApiResponse;
import com.aquashield.backend.dto.WaterQualityDto;
import com.aquashield.backend.entity.User;
import com.aquashield.backend.entity.Village;
import com.aquashield.backend.entity.WaterQualityReport;
import com.aquashield.backend.repository.UserRepository;
import com.aquashield.backend.repository.VillageRepository;
import com.aquashield.backend.repository.WaterQualityReportRepository;
import com.aquashield.backend.entity.HealthSurvey;
import com.aquashield.backend.repository.HealthSurveyRepository;
import com.aquashield.backend.repository.SymptomReportRepository;
import com.aquashield.backend.service.ai.AgentCoordinator;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/worker")
public class HealthWorkerController {

    @Autowired
    private WaterQualityReportRepository waterQualityRepository;

    @Autowired
    private HealthSurveyRepository healthSurveyRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private VillageRepository villageRepository;

    @Autowired
    private SymptomReportRepository symptomReportRepository;

    @Autowired
    private AgentCoordinator agentCoordinator;

    @Autowired
    private com.aquashield.backend.service.ReportService reportService;

    @Autowired
    private com.aquashield.backend.service.AuditLogService auditLogService;

    @PostMapping("/water-quality")
    @PreAuthorize("hasRole('HEALTH_WORKER') or hasRole('ADMIN')")
    public ResponseEntity<?> submitWaterQuality(@RequestBody WaterQualityDto request) {
        UserDetails userDetails = (UserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User worker = userRepository.findByEmail(userDetails.getUsername()).orElse(null);
        Village village = villageRepository.findById(request.getVillageId()).orElse(null);

        if (worker == null || village == null) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, "Invalid worker or village ID"));
        }

        WaterQualityReport report = WaterQualityReport.builder()
                .healthWorker(worker)
                .village(village)
                .phLevel(request.getPhLevel())
                .turbidity(request.getTurbidity())
                .contaminationLevel(request.getContaminationLevel())
                .safeToDrink(request.getSafeToDrink())
                .build();

        waterQualityRepository.save(report);

        // Update village status
        village.setWaterQualityStatus(request.getSafeToDrink() ? "SAFE" : "CONTAMINATED");
        villageRepository.save(village);

        // Trigger AI Agent Analysis Cycle for this village
        agentCoordinator.runAnalysisForVillage(village.getId());

        return ResponseEntity.ok(new ApiResponse(true, "Water quality report submitted."));
    }

    @PostMapping("/surveys")
    @PreAuthorize("hasRole('HEALTH_WORKER') or hasRole('ADMIN')")
    public ResponseEntity<?> submitHealthSurvey(@RequestBody java.util.Map<String, Object> request) {
        UserDetails userDetails = (UserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User worker = userRepository.findByEmail(userDetails.getUsername()).orElse(null);
        Long villageId = Long.valueOf(request.get("villageId").toString());
        Village village = villageRepository.findById(villageId).orElse(null);

        if (worker == null || village == null) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, "Invalid worker or village ID"));
        }

        HealthSurvey survey = HealthSurvey.builder()
                .healthWorker(worker)
                .village(village)
                .householdsSurveyed(Integer.valueOf(request.get("householdsSurveyed").toString()))
                .illnessCount(Integer.valueOf(request.get("illnessCount").toString()))
                .primaryConcerns(request.getOrDefault("primaryConcerns", "").toString())
                .notes(request.getOrDefault("notes", "").toString())
                .build();

        healthSurveyRepository.save(survey);

        // Update active cases from survey
        village.setActiveCases((village.getActiveCases() == null ? 0 : village.getActiveCases()) + survey.getIllnessCount());
        villageRepository.save(village);

        // Trigger AI Agent Analysis Cycle for this village
        agentCoordinator.runAnalysisForVillage(village.getId());

        return ResponseEntity.ok(new ApiResponse(true, "Health survey submitted successfully."));
    }

    @PostMapping("/reports/{id}/verify")
    @PreAuthorize("hasRole('HEALTH_WORKER') or hasRole('ADMIN')")
    public ResponseEntity<?> verifySymptomReport(@PathVariable Long id) {
        UserDetails userDetails = (UserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User worker = userRepository.findByEmail(userDetails.getUsername()).orElse(null);
        if (worker == null) return ResponseEntity.badRequest().build();

        reportService.verifyReport(id, worker);
        auditLogService.log("REPORT_VERIFICATION", "Verified report ID: " + id + " by " + worker.getEmail());
        return ResponseEntity.ok(new ApiResponse(true, "Report verified successfully."));
    }

    @PostMapping("/reports/{id}/reject")
    @PreAuthorize("hasRole('HEALTH_WORKER') or hasRole('ADMIN')")
    public ResponseEntity<?> rejectSymptomReport(@PathVariable Long id) {
        UserDetails userDetails = (UserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User worker = userRepository.findByEmail(userDetails.getUsername()).orElse(null);
        if (worker == null) return ResponseEntity.badRequest().build();

        reportService.rejectReport(id, worker);
        auditLogService.log("REPORT_VERIFICATION", "Rejected/invalidated report ID: " + id + " by " + worker.getEmail());
        return ResponseEntity.ok(new ApiResponse(true, "Report rejected successfully."));
    }

    @GetMapping("/reports/pending")
    @PreAuthorize("hasRole('HEALTH_WORKER') or hasRole('ADMIN')")
    public ResponseEntity<?> getPendingReports() {
        UserDetails userDetails = (UserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User worker = userRepository.findByEmail(userDetails.getUsername()).orElse(null);

        if (worker == null || worker.getVillage() == null) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, "Invalid worker or unassigned village"));
        }

        return ResponseEntity.ok(symptomReportRepository.findByVillageIdAndStatus(worker.getVillage().getId(), "PENDING"));
    }

    @GetMapping("/villages/assigned")
    @PreAuthorize("hasRole('HEALTH_WORKER') or hasRole('ADMIN')")
    public ResponseEntity<?> getAssignedVillages() {
        UserDetails userDetails = (UserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User worker = userRepository.findByEmail(userDetails.getUsername()).orElse(null);

        if (worker == null || worker.getVillage() == null) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, "Invalid worker or unassigned village"));
        }

        return ResponseEntity.ok(java.util.List.of(worker.getVillage()));
    }

    @Autowired
    private com.aquashield.backend.repository.AuditLogRepository auditLogRepository;

    @GetMapping("/reports/verified")
    @PreAuthorize("hasRole('HEALTH_WORKER') or hasRole('ADMIN')")
    public ResponseEntity<?> getVerifiedReports() {
        UserDetails userDetails = (UserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User worker = userRepository.findByEmail(userDetails.getUsername()).orElse(null);

        if (worker == null || worker.getVillage() == null) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, "Invalid worker or unassigned village"));
        }

        return ResponseEntity.ok(symptomReportRepository.findByVillageIdAndStatus(worker.getVillage().getId(), "VERIFIED"));
    }

    @GetMapping("/activity")
    @PreAuthorize("hasRole('HEALTH_WORKER') or hasRole('ADMIN')")
    public ResponseEntity<?> getWorkerActivity() {
        UserDetails userDetails = (UserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User worker = userRepository.findByEmail(userDetails.getUsername()).orElse(null);
        if (worker == null) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, "Invalid worker"));
        }
        return ResponseEntity.ok(auditLogRepository.findByUserIdOrderByCreatedAtDesc(worker.getId()));
    }

    @PutMapping("/villages/{id}/conditions")
    @PreAuthorize("hasRole('HEALTH_WORKER') or hasRole('ADMIN')")
    public ResponseEntity<?> updateVillageConditions(@PathVariable Long id, @RequestBody java.util.Map<String, Object> payload) {
        Village village = villageRepository.findById(id).orElse(null);
        if (village == null) {
            return ResponseEntity.notFound().build();
        }
        if (payload.containsKey("waterSources")) {
            village.setWaterSources(payload.get("waterSources").toString());
        }
        if (payload.containsKey("population")) {
            village.setPopulation(Integer.valueOf(payload.get("population").toString()));
        }
        village.setLastSurveyDate(new java.util.Date());
        villageRepository.save(village);
        
        UserDetails userDetails = (UserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        auditLogService.log("SETTINGS_CHANGE", "Updated conditions for village: " + village.getName() + " by " + userDetails.getUsername());
        
        agentCoordinator.runAnalysisForVillage(village.getId());
        
        return ResponseEntity.ok(new ApiResponse(true, "Village conditions updated successfully."));
    }
}
