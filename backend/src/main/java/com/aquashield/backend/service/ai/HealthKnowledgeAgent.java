package com.aquashield.backend.service.ai;

import com.aquashield.backend.entity.knowledge.*;
import com.aquashield.backend.repository.knowledge.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class HealthKnowledgeAgent {

    @Autowired
    private DiseaseRepository diseaseRepository;

    @Autowired
    private DiseaseSymptomRepository symptomRepository;

    @Autowired
    private PreventionGuidelineRepository preventionRepository;

    @Autowired
    private WaterQualityGuidelineRepository wqRepository;

    @Autowired
    private FaqEntryRepository faqRepository;

    public String retrieveKnowledgeContext(String query) {
        StringBuilder context = new StringBuilder();
        String lowerQuery = query.toLowerCase();
        
        List<Disease> diseases = diseaseRepository.findAll();
        java.util.Set<Disease> matchedDiseases = new java.util.HashSet<>();
        
        // 1. Keyword search / direct disease match
        for (Disease d : diseases) {
            if (lowerQuery.contains(d.getName().toLowerCase())) {
                matchedDiseases.add(d);
            }
        }
        
        // 2. Symptom matching & Disease mapping
        List<DiseaseSymptom> allSymptoms = symptomRepository.findAll();
        for (DiseaseSymptom s : allSymptoms) {
            if (lowerQuery.contains(s.getSymptom().toLowerCase())) {
                matchedDiseases.add(s.getDisease());
            }
        }
        
        // 3. Build diagnostic context for matched diseases
        for (Disease d : matchedDiseases) {
            context.append("Disease Profile: ").append(d.getName()).append("\n");
            context.append("- Description: ").append(d.getDescription()).append("\n");
            context.append("- Severity level: ").append(d.getSeverity()).append("\n");
            
            List<DiseaseSymptom> symptoms = symptomRepository.findByDiseaseId(d.getId());
            if (!symptoms.isEmpty()) {
                context.append("- Common symptoms: ");
                for (int i = 0; i < symptoms.size(); i++) {
                    context.append(symptoms.get(i).getSymptom());
                    if (i < symptoms.size() - 1) context.append(", ");
                }
                context.append("\n");
            }
            
            // Prevention recommendations
            List<PreventionGuideline> guidelines = preventionRepository.findAll().stream()
                    .filter(g -> g.getRelatedDisease() != null && g.getRelatedDisease().getId().equals(d.getId()))
                    .collect(java.util.stream.Collectors.toList());
            if (!guidelines.isEmpty()) {
                context.append("- Prevention Recommendations:\n");
                for (PreventionGuideline g : guidelines) {
                    context.append("  * ").append(g.getTitle()).append(": ").append(g.getContent()).append("\n");
                }
            }
            context.append("\n");
        }
        
        // 4. FAQ Match
        List<FaqEntry> faqs = faqRepository.findAll();
        for (FaqEntry faq : faqs) {
            if (lowerQuery.contains(faq.getQuestion().toLowerCase()) || faq.getQuestion().toLowerCase().contains(lowerQuery)) {
                context.append("FAQ: ").append(faq.getQuestion()).append("\n-> Answer: ").append(faq.getAnswer()).append("\n\n");
            }
        }

        // 5. General guidelines fallback if nothing matched
        if (matchedDiseases.isEmpty() && context.length() == 0) {
            List<WaterQualityGuideline> wq = wqRepository.findAll();
            for (WaterQualityGuideline g : wq) {
                 context.append("Water Quality Guideline (").append(g.getParameter()).append("): ")
                        .append(g.getAdvice()).append("\n");
            }
        }

        return context.toString();
    }
}
