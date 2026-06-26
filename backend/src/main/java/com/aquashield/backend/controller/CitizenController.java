package com.aquashield.backend.controller;

import com.aquashield.backend.service.ReportService;

import com.aquashield.backend.dto.AiChatRequest;
import com.aquashield.backend.dto.ApiResponse;
import com.aquashield.backend.dto.SymptomReportDto;
import com.aquashield.backend.entity.SymptomReport;
import com.aquashield.backend.entity.User;
import com.aquashield.backend.entity.Village;

import com.aquashield.backend.repository.UserRepository;
import com.aquashield.backend.service.ai.AgentCoordinator;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/citizen")
public class CitizenController {

    @Autowired
    private ReportService reportService;

    @Autowired
    private com.aquashield.backend.service.VillageService villageService;

    @Autowired
    private com.aquashield.backend.repository.WaterQualityReportRepository waterQualityRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AgentCoordinator agentCoordinator;



    @Autowired
    private com.aquashield.backend.service.ai.HealthAdvisorAgent healthAdvisorAgent;

    @Autowired
    private com.aquashield.backend.service.AuditLogService auditLogService;

    @PostMapping("/symptoms")
    public ResponseEntity<?> reportSymptoms(@RequestBody SymptomReportDto request) {
        UserDetails userDetails = (UserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User user = userRepository.findByEmail(userDetails.getUsername()).orElse(null);

        if (user == null) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, "User not found"));
        }

        Village reportVillage = user.getVillage();
        if (request.getVillageId() != null) {
            reportVillage = villageService.getVillageById(request.getVillageId());
        }
        if (reportVillage == null) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, "Village not found"));
        }

        SymptomReport report = SymptomReport.builder()
                .user(user)
                .village(reportVillage)
                .symptoms(request.getSymptoms())
                .age(request.getAge())
                .gender(request.getGender())
                .severity(request.getSeverity() != null ? request.getSeverity() : "MEDIUM")
                .duration(request.getDuration())
                .remarks(request.getRemarks())
                .photoUrl(request.getPhotoUrl())
                .videoUrl(request.getVideoUrl())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .waterQualityComplaint(request.getWaterQualityComplaint())
                .deadAnimalReport(request.getDeadAnimalReport())
                .affectedFamilyMembers(request.getAffectedFamilyMembers())
                .drinkingWaterSource(request.getDrinkingWaterSource())
                .build();

        SymptomReport saved = reportService.submitReport(report);

        // Record audit trail
        auditLogService.log("REPORT_SUBMISSION", "Symptom report logged for " + reportVillage.getName() + " by " + user.getEmail());

        // Trigger AI Agent Analysis Cycle for this village
        agentCoordinator.runAnalysisForVillage(reportVillage.getId());

        java.util.Map<String, Object> responseData = new java.util.HashMap<>();
        responseData.put("success", true);
        responseData.put("message", "Report Submitted Successfully.");
        responseData.put("reportId", saved.getReportId());

        return ResponseEntity.ok(responseData);
    }

    @PutMapping("/symptoms/{id}")
    public ResponseEntity<?> updateReport(@PathVariable Long id, @RequestBody SymptomReportDto request) {
        UserDetails userDetails = (UserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User user = userRepository.findByEmail(userDetails.getUsername()).orElse(null);

        if (user == null) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, "User not found"));
        }

        try {
            reportService.updateReport(id, request, user.getId());
            return ResponseEntity.ok(new ApiResponse(true, "Report updated successfully."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, e.getMessage()));
        }
    }

    @GetMapping("/reports")
    public ResponseEntity<?> getMyReports() {
        UserDetails userDetails = (UserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User user = userRepository.findByEmail(userDetails.getUsername()).orElse(null);
        if (user == null) return ResponseEntity.badRequest().build();
        
        return ResponseEntity.ok(reportService.getReportsByUser(user.getId()));
    }

    @GetMapping("/village")
    public ResponseEntity<?> getMyVillageStatus() {
        UserDetails userDetails = (UserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User user = userRepository.findByEmail(userDetails.getUsername()).orElse(null);
        if (user == null || user.getVillage() == null) return ResponseEntity.badRequest().build();
        
        return ResponseEntity.ok(villageService.getVillageById(user.getVillage().getId()));
    }

    @GetMapping("/water-quality")
    public ResponseEntity<?> getVillageWaterQuality() {
        UserDetails userDetails = (UserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User user = userRepository.findByEmail(userDetails.getUsername()).orElse(null);
        if (user == null || user.getVillage() == null) return ResponseEntity.badRequest().build();
        
        return ResponseEntity.ok(waterQualityRepository.findByVillageId(user.getVillage().getId()));
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(@RequestBody java.util.Map<String, String> request) {
        UserDetails userDetails = (UserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User user = userRepository.findByEmail(userDetails.getUsername()).orElse(null);
        if (user == null) return ResponseEntity.badRequest().build();

        if (request.containsKey("name")) user.setName(request.get("name"));
        if (request.containsKey("phone")) user.setPhone(request.get("phone"));
        userRepository.save(user);

        return ResponseEntity.ok(new ApiResponse(true, "Profile updated successfully"));
    }

    @GetMapping("/alerts")
    public ResponseEntity<?> getAlerts() {
        UserDetails userDetails = (UserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User user = userRepository.findByEmail(userDetails.getUsername()).orElse(null);
        if (user == null || user.getVillage() == null) return ResponseEntity.badRequest().build();
        return ResponseEntity.ok(new ApiResponse(true, "Alerts fetched"));
    }

    @PostMapping("/ai-chat")
    public ResponseEntity<?> chatWithAi(@RequestBody AiChatRequest request) {
        UserDetails userDetails = (UserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User user = userRepository.findByEmail(userDetails.getUsername()).orElse(null);
        if (user == null || user.getVillage() == null) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, "User or village not found"));
        }

        String advice = healthAdvisorAgent.generateAdvice(user.getVillage().getId(), request.getMessage());
        return ResponseEntity.ok(new ApiResponse(true, advice));
    }
}
// End of file
