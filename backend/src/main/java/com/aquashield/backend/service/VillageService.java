package com.aquashield.backend.service;

import com.aquashield.backend.entity.Village;
import com.aquashield.backend.repository.VillageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class VillageService {

    @Autowired
    private VillageRepository villageRepository;

    public List<Village> getAllVillages() {
        return villageRepository.findAll();
    }

    public Village getVillageById(Long id) {
        return villageRepository.findById(id).orElse(null);
    }

    public Village saveVillage(Village village) {
        return villageRepository.save(village);
    }

    public void updateVillageRiskScore(Long villageId, Double riskScore) {
        Village village = getVillageById(villageId);
        if (village != null) {
            village.setRiskScore(riskScore);
            villageRepository.save(village);
        }
    }

    public void incrementActiveCases(Long villageId) {
        Village village = getVillageById(villageId);
        if (village != null) {
            village.setActiveCases((village.getActiveCases() == null ? 0 : village.getActiveCases()) + 1);
            villageRepository.save(village);
        }
    }
}
