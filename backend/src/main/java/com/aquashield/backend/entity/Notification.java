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
@Table(name = "notifications")
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "village_id")
    private Village village; // Nullable for global/district admins

    @Enumerated(EnumType.STRING)
    @Column(name = "target_role", nullable = false)
    private Role targetRole;

    @Column(nullable = false, length = 1000)
    private String message;

    @Column(name = "created_at")
    private Date createdAt;

    // --- New Fields for Emergency Alert System ---

    @Column(name = "title")
    private String title;

    @Column(name = "disease")
    private String disease;

    @Column(name = "village_name")
    private String villageName;

    @Column(name = "risk_level")
    private String riskLevel;

    @Column(name = "status")
    @Builder.Default
    private String status = "NEW"; // NEW, ACKNOWLEDGED, RESOLVED

    @PrePersist
    protected void onCreate() {
        createdAt = new Date();
        if (status == null) {
            status = "NEW";
        }
    }
}
