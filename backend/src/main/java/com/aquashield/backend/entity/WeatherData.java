package com.aquashield.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Date;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "weather_data")
public class WeatherData {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "village_id")
    private Village village;

    private Double temperature;
    private Double rainfall;
    private Double humidity;
    private Double windSpeed;

    @Column(name = "recorded_at")
    private Date recordedAt;

    @PrePersist
    protected void onCreate() {
        if (recordedAt == null) recordedAt = new Date();
    }
}
