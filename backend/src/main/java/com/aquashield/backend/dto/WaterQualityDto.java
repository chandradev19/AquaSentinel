package com.aquashield.backend.dto;

import lombok.Data;

@Data
public class WaterQualityDto {
    private Long villageId;
    private Double phLevel;
    private Double turbidity;
    private Double contaminationLevel;
    private Boolean safeToDrink;
}
