package com.aquashield.backend.service;

import com.aquashield.backend.entity.knowledge.*;
import com.aquashield.backend.repository.knowledge.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class KnowledgeBaseService {

    @Autowired
    private DiseaseRepository diseaseRepository;
    @Autowired
    private FaqEntryRepository faqEntryRepository;
    @Autowired
    private HealthAdvisoryRepository healthAdvisoryRepository;
    @Autowired
    private PreventionGuidelineRepository preventionGuidelineRepository;
    @Autowired
    private WaterQualityGuidelineRepository waterQualityGuidelineRepository;

    public List<Disease> getAllDiseases() {
        return diseaseRepository.findAll();
    }

    public List<FaqEntry> getAllFaqs() {
        return faqEntryRepository.findAll();
    }

    public List<HealthAdvisory> getAllHealthAdvisories() {
        return healthAdvisoryRepository.findAll();
    }

    public List<PreventionGuideline> getPreventionGuidelinesForDisease(Long diseaseId) {
        // Find guidelines containing the disease name or linked somehow.
        // Assuming there's a findByDiseaseId or similar, we'll fetch all and filter for now if there isn't.
        return preventionGuidelineRepository.findAll().stream()
                .filter(pg -> pg.getRelatedDisease() != null && pg.getRelatedDisease().getId().equals(diseaseId))
                .collect(Collectors.toList());
    }

    public String buildKnowledgeContextForAi() {
        StringBuilder context = new StringBuilder();
        context.append("Water Quality Guidelines:\n");
        waterQualityGuidelineRepository.findAll().forEach(g -> context.append("- ").append(g.getParameter()).append(": ").append(g.getAcceptableRange()).append(" - ").append(g.getAdvice()).append("\n"));
        
        context.append("\nDiseases & Prevention:\n");
        diseaseRepository.findAll().forEach(d -> {
            context.append("Disease: ").append(d.getName()).append(" - ").append(d.getDescription()).append("\n");
            getPreventionGuidelinesForDisease(d.getId()).forEach(p -> context.append("  Prevention: ").append(p.getContent()).append("\n"));
        });
        
        context.append("\nGeneral Health Advisories:\n");
        healthAdvisoryRepository.findAll().forEach(h -> context.append("- ").append(h.getContent()).append("\n"));
        
        return context.toString();
    }
}
