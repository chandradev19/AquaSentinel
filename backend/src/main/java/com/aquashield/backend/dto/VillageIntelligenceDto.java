package com.aquashield.backend.dto;

import com.aquashield.backend.entity.DiseasePrediction;
import com.aquashield.backend.entity.Village;
import com.aquashield.backend.entity.VillageHistory;
import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
@Builder
public class VillageIntelligenceDto {
    private Village village;
    private Long totalReports;
    private String emergencyStatus;
    private List<UserDto> assignedWorkers;
    private List<Map<String, String>> nearbyHospitals;
    private DiseasePrediction aiPrediction;
    private List<VillageHistory> riskTimeline;
}
