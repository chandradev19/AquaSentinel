package com.aquashield.backend.config;

import com.aquashield.backend.entity.*;
import com.aquashield.backend.entity.knowledge.*;
import com.aquashield.backend.repository.*;
import com.aquashield.backend.repository.knowledge.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;

@Configuration
public class DatabaseInitializer {

    @Bean
    public CommandLineRunner initKnowledgeBase(
            DiseaseRepository diseaseRepo,
            DiseaseSymptomRepository symptomRepo,
            PreventionGuidelineRepository prevRepo,
            WaterQualityGuidelineRepository wqRepo,
            HealthAdvisoryRepository advRepo,
            FaqEntryRepository faqRepo) {
        return args -> {
            if (diseaseRepo.count() == 0) {
                Disease cholera = Disease.builder().name("Cholera").description("An acute diarrheal illness caused by infection of the intestine with Vibrio cholerae bacteria.").severity("HIGH").build();
                Disease typhoid = Disease.builder().name("Typhoid").description("A life-threatening infection caused by the bacterium Salmonella Typhi.").severity("HIGH").build();
                Disease diarrhea = Disease.builder().name("Diarrhea").description("Loose, watery stools that occur more frequently than usual. Often caused by contaminated water.").severity("MEDIUM").build();
                Disease dysentery = Disease.builder().name("Dysentery").description("An inflammatory disease of the intestine, resulting in severe diarrhea with mucus or blood in the feces.").severity("HIGH").build();
                Disease hepatitisA = Disease.builder().name("Hepatitis A").description("A highly contagious liver infection caused by the Hepatitis A virus, typically spread through contaminated food or water.").severity("HIGH").build();
                diseaseRepo.saveAll(List.of(cholera, typhoid, diarrhea, dysentery, hepatitisA));

                symptomRepo.saveAll(List.of(
                    DiseaseSymptom.builder().disease(cholera).symptom("Severe watery diarrhea").build(),
                    DiseaseSymptom.builder().disease(cholera).symptom("Vomiting").build(),
                    DiseaseSymptom.builder().disease(cholera).symptom("Leg cramps").build(),
                    DiseaseSymptom.builder().disease(typhoid).symptom("Prolonged high fever").build(),
                    DiseaseSymptom.builder().disease(typhoid).symptom("Fatigue").build(),
                    DiseaseSymptom.builder().disease(typhoid).symptom("Stomach pain").build(),
                    DiseaseSymptom.builder().disease(diarrhea).symptom("Loose watery stools").build(),
                    DiseaseSymptom.builder().disease(diarrhea).symptom("Abdominal bloating").build(),
                    DiseaseSymptom.builder().disease(dysentery).symptom("Bloody diarrhea").build(),
                    DiseaseSymptom.builder().disease(dysentery).symptom("Mucus in stool").build(),
                    DiseaseSymptom.builder().disease(dysentery).symptom("Severe stomach cramps").build(),
                    DiseaseSymptom.builder().disease(hepatitisA).symptom("Jaundice").build(),
                    DiseaseSymptom.builder().disease(hepatitisA).symptom("Dark urine").build(),
                    DiseaseSymptom.builder().disease(hepatitisA).symptom("Loss of appetite").build()
                ));

                prevRepo.saveAll(List.of(
                    PreventionGuideline.builder().title("Safe Drinking Water").content("Always boil water before drinking or use a certified water purifier.").relatedDisease(cholera).build(),
                    PreventionGuideline.builder().title("Hand Hygiene").content("Wash hands frequently with soap and clean water, especially before eating and after using the restroom.").relatedDisease(typhoid).build(),
                    PreventionGuideline.builder().title("Sanitation Measures").content("Dispose of waste safely and protect community water sources from contamination.").relatedDisease(diarrhea).build(),
                    PreventionGuideline.builder().title("Avoid Raw Foods").content("Wash fruits and vegetables with purified water. Eat fully cooked hot meals to prevent pathogen ingestion.").relatedDisease(dysentery).build(),
                    PreventionGuideline.builder().title("Hepatitis A Vaccination").content("Ensure vaccination coverage is up to date, particularly for children and travelers in vulnerable zones.").relatedDisease(hepatitisA).build()
                ));

                wqRepo.saveAll(List.of(
                    WaterQualityGuideline.builder().parameter("Turbidity").acceptableRange("0 - 5 NTU").advice("High turbidity can indicate contamination. Filter water before use.").build(),
                    WaterQualityGuideline.builder().parameter("pH").acceptableRange("6.5 - 8.5").advice("Water outside this range may be corrosive or have a bad taste.").build(),
                    WaterQualityGuideline.builder().parameter("Coliform bacteria").acceptableRange("0 CFU/100mL").advice("Any detection of coliform bacteria indicates fecal contamination. Do not consume.").build(),
                    WaterQualityGuideline.builder().parameter("Total Dissolved Solids").acceptableRange("< 500 mg/L").advice("High TDS can affect taste and indicate contamination from runoff.").build()
                ));

                advRepo.saveAll(List.of(
                    HealthAdvisory.builder().title("Boil Water Advisory").content("Due to recent heavy rains, all residents are advised to boil tap water before consumption until further notice.").riskLevel("WARNING").build(),
                    HealthAdvisory.builder().title("Cholera Outbreak Alert").content("Increased cholera cases reported in Vellore district. Avoid untreated water. ORS kits available at community centers.").riskLevel("CRITICAL").build()
                ));

                faqRepo.saveAll(List.of(
                    FaqEntry.builder().question("What should I do if my water looks cloudy?").answer("Do not drink cloudy water directly. Let it settle, filter it through a clean cloth, and then boil it vigorously for at least 1 minute.").build(),
                    FaqEntry.builder().question("What are the warning signs of Cholera?").answer("Look out for sudden onset of severe, watery diarrhea (rice-water stools), rapid heart rate, loss of skin elasticity, dry mucous membranes, and muscle cramps.").build(),
                    FaqEntry.builder().question("How is Dysentery different from Diarrhea?").answer("While diarrhea involves frequent loose stools, Dysentery is characterized by painful, bloody diarrhea often accompanied by mucus and high fever, indicating bacterial or amoebic intestinal damage.").build(),
                    FaqEntry.builder().question("How often should wells be tested?").answer("Wells used for drinking water should be tested at least twice a year — once before monsoon season and once after. Test immediately after flooding.").build(),
                    FaqEntry.builder().question("Is it safe to eat food from street vendors?").answer("Exercise caution. Prefer freshly cooked hot food. Avoid raw salads, cut fruits, and beverages made with unfiltered water. Always wash hands before eating.").build()
                ));
            }
        };
    }

    @Bean
    public CommandLineRunner initAdminUser(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            if (userRepository.findByEmail("admin@aquashield.gov").isEmpty()) {
                User admin = User.builder()
                        .name("System Administrator")
                        .email("admin@aquashield.gov")
                        .password(passwordEncoder.encode("admin123"))
                        .role(Role.ADMIN)
                        .phone("+91-9800001111")
                        .build();
                userRepository.save(admin);
                System.out.println("[INIT] Admin user created: admin@aquashield.gov / admin123");
            } else {
                User admin = userRepository.findByEmail("admin@aquashield.gov").get();
                if (admin.getRole() != Role.ADMIN) {
                    admin.setRole(Role.ADMIN);
                    admin.setPassword(passwordEncoder.encode("admin123"));
                    userRepository.save(admin);
                }
            }
        };
    }

    @Bean
    public CommandLineRunner initPrimaryAdmin(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            String adminEmail = "admin@aquashield.com";
            if (userRepository.findByEmail(adminEmail).isEmpty()) {
                User admin = User.builder()
                        .name("AquaShield Administrator")
                        .email(adminEmail)
                        .password(passwordEncoder.encode("Admin@123"))
                        .role(Role.ADMIN)
                        .build();
                userRepository.save(admin);
                System.out.println("[INIT] Primary admin created: " + adminEmail);
            } else {
                System.out.println("[INIT] Primary admin already exists: " + adminEmail);
            }
        };
    }
}
