package com.aquashield.backend.dto;

import lombok.Data;

@Data
public class SymptomReportDto {
    private String symptoms;
    private Integer age;
    private String gender;
    private String severity;
    private String duration;
    private String remarks;
    private String photoUrl;
    private Double latitude;
    private Double longitude;
    private Long villageId;
    private Boolean waterQualityComplaint;
    private Boolean deadAnimalReport;
    private Integer affectedFamilyMembers;
    private String drinkingWaterSource;
    private String videoUrl;
}
