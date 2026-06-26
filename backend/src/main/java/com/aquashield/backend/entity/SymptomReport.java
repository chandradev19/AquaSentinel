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
@Table(name = "symptom_reports")
public class SymptomReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "village_id", nullable = false)
    private Village village;

    @Column(nullable = false, length = 1000)
    private String symptoms;

    @Column(name = "age")
    private Integer age;

    @Column(name = "gender")
    private String gender;

    @Column(name = "severity")
    private String severity; // LOW, MEDIUM, HIGH

    @Column(name = "duration")
    private String duration;

    @Column(name = "remarks", length = 1000)
    private String remarks;

    @Column(name = "photo_url")
    private String photoUrl;

    @Column(name = "video_url")
    private String videoUrl;

    @Column(name = "voice_url")
    private String voiceUrl;

    @Column(name = "latitude")
    private Double latitude;

    @Column(name = "longitude")
    private Double longitude;

    @Column(name = "report_date")
    private Date reportDate;

    @Column(name = "report_id", unique = true)
    private String reportId; // Unique ID like RPT-2026-XXXX

    @Column(name = "water_quality_complaint")
    private Boolean waterQualityComplaint;

    @Column(name = "dead_animal_report")
    private Boolean deadAnimalReport;

    @Column(name = "affected_family_members")
    private Integer affectedFamilyMembers;

    @Column(name = "drinking_water_source")
    private String drinkingWaterSource;

    @Column(nullable = false)
    private String status; // Submitted, Assigned, Under Verification, Sample Collected, Verified, AI Analysis Running, Closed

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "verified_by_id")
    private User verifiedBy;

    @Column(name = "verified_at")
    private Date verifiedAt;

    @PrePersist
    protected void onCreate() {
        reportDate = new Date();
        if (status == null) {
            status = "Submitted";
        }
    }
}
