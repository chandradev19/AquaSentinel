package com.aquashield.backend.service.ai;

import com.aquashield.backend.entity.Village;
import com.aquashield.backend.entity.RiskAssessment;
import com.aquashield.backend.repository.VillageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.Month;
import java.util.List;

/**
 * HealthAdvisorAgent — Conversational AI chatbot for AquaSentinel.
 *
 * Recognises 12 question categories and routes each to a specialised builder:
 *   1. Emergency / SOS
 *   2. Hospital / PHC lookup
 *   3. Emergency numbers
 *   4. Water safety / quality
 *   5. Disease info (cholera, typhoid, dengue, malaria, diarrhea, dysentery, hepatitis)
 *   6. Symptom-based triage
 *   7. First-aid guidance
 *   8. Prevention tips
 *   9. Village risk score explanation
 *  10. Seasonal disease advice
 *  11. General recommendations ("what should we do")
 *  12. Fallback — uses knowledge base + village context
 */
@Service
public class HealthAdvisorAgent {

    @Autowired
    private VillageRepository villageRepository;

    @Autowired
    private HealthKnowledgeAgent healthKnowledgeAgent;

    @Autowired
    private RiskAssessmentAgent riskAssessmentAgent;

    @Autowired
    private MachineLearningService machineLearningService;

    @Autowired
    private RecommendationEngine recommendationEngine;

    // ─────────────────────────────────────────────────────────────
    //  Public entry point
    // ─────────────────────────────────────────────────────────────

    public String generateAdvice(Long villageId, String question) {
        Village village = villageRepository.findById(villageId).orElse(null);
        if (village == null) return "I couldn't find data for your village. Please contact your health worker.";

        String q = question.toLowerCase().trim();

        RiskAssessment risk   = riskAssessmentAgent.calculateRiskScore(villageId);
        double riskScore      = resolveRiskScore(risk, village);
        String kbContext      = healthKnowledgeAgent.retrieveKnowledgeContext(question);
        String predictedDisease = predictDisease(risk);
        List<String> citizenRecs = citizenRecommendations(risk, village, predictedDisease);

        // ── Category routing ───────────────────────────────────────
        if (isEmergency(q))                  return handleEmergency(village, riskScore);
        if (isHospital(q))                   return handleHospital(village);
        if (isEmergencyNumber(q))            return handleEmergencyNumbers();
        if (isWaterSafety(q))                return handleWaterSafety(q, risk, village);
        if (isDiseaseInfo(q))                return handleDiseaseInfo(q, kbContext, village);
        if (isSymptomBased(q))               return handleSymptomTriage(q, kbContext, village);
        if (isFirstAid(q))                   return handleFirstAid(q);
        if (isPrevention(q))                 return handlePrevention(q, kbContext, village);
        if (isRiskExplanation(q))            return handleRiskExplanation(riskScore, risk, predictedDisease, village);
        if (isWaterQualityExplain(q))        return handleWaterQualityExplanation(risk, village);
        if (isSeasonalAdvice(q))             return handleSeasonalAdvice(village, riskScore);
        if (isRecommendation(q))             return handleRecommendations(citizenRecs, village);

        // ── Default fallback ───────────────────────────────────────
        return handleFallback(question, kbContext, village, riskScore, citizenRecs);
    }

    // ─────────────────────────────────────────────────────────────
    //  Category detectors
    // ─────────────────────────────────────────────────────────────

    private boolean isEmergency(String q) {
        return q.contains("emergency") || q.contains("sos") || q.contains("urgent help")
                || q.contains("outbreak") && q.contains("now")
                || q.contains("many people sick") || q.contains("mass illness");
    }
    private boolean isHospital(String q) {
        return q.contains("hospital") || q.contains("phc") || q.contains("health centre")
                || q.contains("health center") || q.contains("clinic") || q.contains("doctor")
                || q.contains("nearby") || q.contains("primary health");
    }
    private boolean isEmergencyNumber(String q) {
        return q.contains("108") || q.contains("ambulance") || q.contains("helpline")
                || q.contains("emergency number") || q.contains("call") && q.contains("help");
    }
    private boolean isWaterSafety(String q) {
        return q.contains("safe to drink") || q.contains("drinking water")
                || q.contains("water safe") || q.contains("boil water") || q.contains("water contamination")
                || q.contains("is water") || q.contains("water ok") || q.contains("water bad");
    }
    private boolean isDiseaseInfo(String q) {
        return q.contains("cholera") || q.contains("typhoid") || q.contains("dengue")
                || q.contains("malaria") || q.contains("diarrhea") || q.contains("diarrhoea")
                || q.contains("dysentery") || q.contains("hepatitis") || q.contains("disease info")
                || q.contains("what is") && (q.contains("disease") || q.contains("illness") || q.contains("infection"));
    }
    private boolean isSymptomBased(String q) {
        return q.contains("vomiting") || q.contains("diarrhea") || q.contains("fever")
                || q.contains("stomach pain") || q.contains("jaundice") || q.contains("bloody stool")
                || q.contains("weakness") || q.contains("dehydrat") || q.contains("nausea")
                || q.contains("my child") || q.contains("i feel") || q.contains("my family") && q.contains("sick");
    }
    private boolean isFirstAid(String q) {
        return q.contains("first aid") || q.contains("what to do") || q.contains("immediately")
                || q.contains("right now") || q.contains("treat") || q.contains("ors")
                || q.contains("oral rehydration");
    }
    private boolean isPrevention(String q) {
        return q.contains("prevent") || q.contains("avoid") || q.contains("protect")
                || q.contains("safe hygiene") || q.contains("how to stay") || q.contains("precaution");
    }
    private boolean isRiskExplanation(String q) {
        return q.contains("risk score") || q.contains("why high risk") || q.contains("risk level")
                || q.contains("how dangerous") || q.contains("village risk") || q.contains("risk factor")
                || q.contains("what does") && q.contains("score");
    }
    private boolean isWaterQualityExplain(String q) {
        return q.contains("water quality") || q.contains("ph level") || q.contains("turbidity")
                || q.contains("contamination level") || q.contains("tds") || q.contains("coliform")
                || q.contains("water report");
    }
    private boolean isSeasonalAdvice(String q) {
        return q.contains("monsoon") || q.contains("rainy season") || q.contains("summer")
                || q.contains("winter") || q.contains("season") || q.contains("this month")
                || q.contains("current season");
    }
    private boolean isRecommendation(String q) {
        return q.contains("recommend") || q.contains("what should") || q.contains("what can we do")
                || q.contains("advice") || q.contains("suggest") || q.contains("tips");
    }

    // ─────────────────────────────────────────────────────────────
    //  Handlers
    // ─────────────────────────────────────────────────────────────

    private String handleEmergency(Village village, double riskScore) {
        return "🚨 EMERGENCY ALERT — Please act immediately!\n\n"
                + "1️⃣ Call the National Health Emergency Helpline: 108 (ambulance / medical response)\n"
                + "2️⃣ Call the District Health Officer for " + village.getDistrict() + " district.\n"
                + "3️⃣ Ask the nearest AquaSentinel Health Worker to visit your village right away.\n"
                + "4️⃣ Isolate anyone showing severe symptoms — do not let them share food or water.\n"
                + "5️⃣ Provide ORS (Oral Rehydration Solution) to those with vomiting or diarrhoea while waiting for help.\n\n"
                + "⚠️ Current village risk score: " + String.format("%.1f", riskScore) + "/100 — "
                + riskAssessmentAgent.getRiskCategory(riskScore) + " level.\n\n"
                + "Do NOT delay. Early action saves lives. Report all new cases through the AquaSentinel app.";
    }

    private String handleHospital(Village village) {
        return "🏥 Finding care near " + village.getName() + ", " + village.getDistrict() + ":\n\n"
                + "📍 Your nearest Primary Health Centre (PHC) is operated by the State Health Department "
                + "for your block/taluk. Please contact your village health worker or panchayat office for the exact address.\n\n"
                + "General guidance:\n"
                + "• Look for the PHC at your taluk/block headquarters — usually within 5–10 km.\n"
                + "• Community Health Centres (CHC) handle referrals for serious cases.\n"
                + "• District Hospital is available in " + village.getDistrict() + " district headquarters.\n\n"
                + "📞 Emergency Ambulance: 108 (free, 24×7)\n"
                + "📞 National Health Helpline: 104 (free health advice)\n\n"
                + "💡 Tip: If transport is unavailable, call 108 — they dispatch to rural areas.";
    }

    private String handleEmergencyNumbers() {
        return "📞 Important Emergency Numbers — Save these now!\n\n"
                + "🚑 108 — Free Ambulance & Emergency Medical Response (24×7, across India)\n"
                + "💊 104 — National Health Helpline (free health advice, medicines info)\n"
                + "🚓 100 — Police Emergency\n"
                + "🔥 101 — Fire & Rescue\n"
                + "📱 112 — Integrated Emergency Services (Police + Fire + Ambulance)\n"
                + "👶 1099 — Child Helpline (Childline)\n\n"
                + "State-specific numbers (Tamil Nadu example):\n"
                + "• CM Helpline: 1100\n"
                + "• Women Helpline: 181\n\n"
                + "💡 Always save 108 on your phone. It's free from any network and available in all states.";
    }

    private String handleWaterSafety(String q, RiskAssessment risk, Village village) {
        double contamination = risk != null ? risk.getContaminationScore() : 0.0;
        boolean unsafe = contamination > 50;

        if (unsafe) {
            return "⚠️ Water Safety Alert for " + village.getName() + ":\n\n"
                    + "Current contamination level is elevated (" + String.format("%.1f", contamination) + "/100). "
                    + "We strongly advise the following:\n\n"
                    + "🔥 Boil all drinking water vigorously for at least 3–5 minutes before consuming.\n"
                    + "💊 If available, use water purification tablets (chlorine or iodine tablets).\n"
                    + "🚫 Avoid water from open wells, ponds, or stagnant sources until further notice.\n"
                    + "🧴 Use filtered or packaged water for cooking and drinking if boiling is not possible.\n"
                    + "🧼 Wash hands with clean water and soap before handling food.\n\n"
                    + "📊 Contamination Score: " + String.format("%.1f", contamination) + "/100 — "
                    + (contamination > 80 ? "CRITICAL — do not use tap water at all." : "HIGH — boil before use.");
        } else {
            return "✅ Water quality in " + village.getName() + " is currently within safe parameters.\n\n"
                    + "Contamination score: " + String.format("%.1f", contamination) + "/100 — LOW risk.\n\n"
                    + "However, we always recommend:\n"
                    + "• Boiling water during monsoon season as a precaution.\n"
                    + "• Not drinking from open, uncovered wells or ponds.\n"
                    + "• Storing water in clean, covered containers.\n"
                    + "• Washing hands before meals and after using the toilet.\n\n"
                    + "Stay safe and report any changes in water colour, smell, or taste immediately through the app! 💧";
        }
    }

    private String handleDiseaseInfo(String q, String kbContext, Village village) {
        StringBuilder sb = new StringBuilder();

        if (q.contains("cholera")) {
            sb.append("💧 About Cholera:\n\n")
              .append("Cholera is an acute waterborne bacterial infection (Vibrio cholerae). It spreads through contaminated water and food.\n\n")
              .append("Symptoms: Sudden severe watery diarrhoea (rice-water stools), vomiting, rapid dehydration, leg cramps.\n")
              .append("Severity: HIGH — can be fatal within hours if untreated.\n\n")
              .append("Prevention: Boil all drinking water, strict hand hygiene, avoid raw food from unknown sources.\n")
              .append("Treatment: ORS immediately. Antibiotics (tetracycline/doxycycline) if severe. Go to PHC.\n");
        } else if (q.contains("typhoid")) {
            sb.append("🌡️ About Typhoid Fever:\n\n")
              .append("Typhoid is caused by Salmonella Typhi, spread through contaminated water or food handled by infected persons.\n\n")
              .append("Symptoms: Prolonged high fever (103–104°F), fatigue, stomach pain, loss of appetite, sometimes rose-coloured spots.\n")
              .append("Severity: HIGH — untreated cases can cause intestinal bleeding or perforation.\n\n")
              .append("Prevention: Typhoid vaccine, safe water and food, proper sanitation.\n")
              .append("Treatment: Antibiotics (ciprofloxacin or cefixime). Rest and proper hydration. Visit PHC.\n");
        } else if (q.contains("dengue")) {
            sb.append("🦟 About Dengue Fever:\n\n")
              .append("Dengue is a mosquito-borne viral infection spread by the Aedes aegypti mosquito (bites during the day).\n\n")
              .append("Symptoms: Sudden high fever, severe headache, pain behind the eyes, joint/muscle pain, skin rash, easy bruising.\n")
              .append("Severity: HIGH — dengue haemorrhagic fever can be life-threatening.\n\n")
              .append("Prevention: Eliminate stagnant water (flower pots, tyres, containers). Use mosquito nets and repellents.\n")
              .append("Treatment: No specific antiviral. Paracetamol for fever, avoid aspirin. Stay hydrated. Visit PHC if platelet count drops.\n");
        } else if (q.contains("malaria")) {
            sb.append("🦟 About Malaria:\n\n")
              .append("Malaria is caused by Plasmodium parasites spread through the bite of infected female Anopheles mosquitoes (bites at night).\n\n")
              .append("Symptoms: Cyclic fever, chills, sweating, headache, body ache, nausea. Severe cases cause organ failure.\n")
              .append("Severity: HIGH — P. falciparum malaria can be fatal without timely treatment.\n\n")
              .append("Prevention: Sleep under insecticide-treated bed nets, use mosquito repellents, clear stagnant water.\n")
              .append("Treatment: Antimalarial drugs (chloroquine/artemisinin-based combination). Requires blood test confirmation. Go to PHC.\n");
        } else if (q.contains("diarrhea") || q.contains("diarrhoea")) {
            sb.append("💊 About Diarrhoea:\n\n")
              .append("Diarrhoea is loose, watery stools — a symptom of many infections, most commonly from contaminated water or food.\n\n")
              .append("Symptoms: Frequent watery stools, abdominal cramps, bloating, possible vomiting and mild fever.\n")
              .append("Severity: MEDIUM — dangerous mainly due to dehydration, especially in children under 5.\n\n")
              .append("Prevention: Safe drinking water, hand washing, proper food hygiene.\n")
              .append("Treatment: Start ORS (Oral Rehydration Solution) immediately. Zinc supplements for children. Visit PHC if it lasts more than 2 days or blood appears.\n");
        } else if (q.contains("dysentery")) {
            sb.append("🩸 About Dysentery:\n\n")
              .append("Dysentery is intestinal inflammation causing bloody or mucus-filled diarrhoea. Caused by bacteria (Shigella) or amoeba.\n\n")
              .append("Symptoms: Bloody or mucus-containing diarrhoea, severe stomach cramps, fever, tenesmus (urge to pass stool).\n")
              .append("Severity: HIGH — indicates active intestinal tissue damage.\n\n")
              .append("Prevention: Safe water, hand washing, avoid street food in outbreaks.\n")
              .append("Treatment: Do NOT take anti-diarrhoeal drugs (worsens condition). See a doctor for antibiotics. Maintain hydration.\n");
        } else if (q.contains("hepatitis")) {
            sb.append("💛 About Hepatitis A:\n\n")
              .append("Hepatitis A is a highly contagious liver infection caused by the Hepatitis A virus, spread through contaminated water and food.\n\n")
              .append("Symptoms: Jaundice (yellowing of skin/eyes), dark urine, fatigue, nausea, loss of appetite, abdominal discomfort.\n")
              .append("Severity: HIGH — usually self-limiting but can cause acute liver failure in rare cases.\n\n")
              .append("Prevention: Hepatitis A vaccine, safe water, proper sanitation, hand washing.\n")
              .append("Treatment: Rest and supportive care. Avoid alcohol. Visit PHC for monitoring. No specific antiviral drug.\n");
        } else {
            sb.append("🏥 Disease Information Request:\n\n")
              .append("I can provide detailed information about: Cholera, Typhoid, Dengue, Malaria, Diarrhoea, Dysentery, and Hepatitis A.\n\n")
              .append("Please ask about a specific disease by name, for example:\n")
              .append("• \"Tell me about cholera\"\n")
              .append("• \"What is dengue fever?\"\n")
              .append("• \"How do I treat diarrhoea?\"\n\n");
        }

        if (!kbContext.isEmpty()) {
            sb.append("\n📚 From the Health Knowledge Base:\n").append(kbContext);
        }
        sb.append("\n💡 For personalised medical advice, always visit your nearest PHC or call 108.");
        return sb.toString();
    }

    private String handleSymptomTriage(String q, String kbContext, Village village) {
        StringBuilder sb = new StringBuilder();
        sb.append("🩺 Symptom Assessment for " + village.getName() + ":\n\n");

        boolean severe = false;

        if (q.contains("bloody") || q.contains("blood in stool") || q.contains("blood in urine")) {
            sb.append("🔴 SERIOUS: Presence of blood in stool or urine is a red flag. This could indicate Dysentery, Typhoid, or a severe infection.\n")
              .append("→ Go to the nearest PHC or hospital IMMEDIATELY.\n→ Call 108 if transport is unavailable.\n\n");
            severe = true;
        }
        if (q.contains("unconscious") || q.contains("collapse") || q.contains("not responding") || q.contains("convuls")) {
            sb.append("🆘 CRITICAL: Loss of consciousness or convulsions is a medical emergency.\n")
              .append("→ Call 108 RIGHT NOW. Do not wait.\n\n");
            severe = true;
        }
        if (q.contains("fever") && (q.contains("high") || q.contains("103") || q.contains("104"))) {
            sb.append("🌡️ High fever detected: This could indicate Typhoid, Malaria, or Dengue.\n")
              .append("• Give paracetamol (not aspirin) for fever management.\n")
              .append("• Keep the patient hydrated with ORS, clean water, or coconut water.\n")
              .append("• Do NOT self-diagnose — visit PHC for a blood test.\n\n");
        }
        if (q.contains("vomiting") || q.contains("diarrhea") || q.contains("diarrhoea")) {
            sb.append("💧 Vomiting or Diarrhoea:\n")
              .append("• Start ORS (Oral Rehydration Solution) immediately — one sachet in 1 litre of clean boiled water.\n")
              .append("• Give sips every few minutes, especially to children and elderly.\n")
              .append("• Avoid solid food until vomiting stops.\n")
              .append("• Visit PHC if it continues for more than 24 hours, or sooner if the patient is a child under 5.\n\n");
        }
        if (q.contains("jaundice") || q.contains("yellow skin") || q.contains("yellow eyes")) {
            sb.append("💛 Jaundice (yellowing of skin/eyes):\n")
              .append("• This may indicate Hepatitis A or a liver condition.\n")
              .append("• Rest completely. Avoid alcohol, fatty foods, and over-the-counter painkillers.\n")
              .append("• Visit PHC or District Hospital for liver function tests.\n\n");
        }

        if (!severe) {
            sb.append("General advice:\n")
              .append("• Monitor temperature and fluid intake carefully.\n")
              .append("• Keep the patient isolated to prevent spread.\n")
              .append("• Do not share utensils, water, or food.\n")
              .append("• Report this case through the AquaSentinel app to alert health workers.\n\n");
        }

        if (!kbContext.isEmpty()) {
            sb.append("📚 Knowledge Base:\n").append(kbContext).append("\n");
        }
        sb.append("📞 Emergency: Call 108 | Health Helpline: 104");
        return sb.toString();
    }

    private String handleFirstAid(String q) {
        StringBuilder sb = new StringBuilder("🩹 First Aid Guidance:\n\n");

        if (q.contains("ors") || q.contains("oral rehydration") || q.contains("dehydrat") || q.contains("diarrhea") || q.contains("vomit")) {
            sb.append("💧 Preparing ORS (Oral Rehydration Solution):\n")
              .append("1. Dissolve 1 ORS sachet in 1 litre of clean boiled (then cooled) water.\n")
              .append("2. If no sachet: mix 6 teaspoons of sugar + ½ teaspoon of salt in 1 litre of water.\n")
              .append("3. Give small sips every 5 minutes — do not rush.\n")
              .append("4. For children under 2: give 50–100 ml after every loose stool.\n")
              .append("5. Continue until the patient feels better and urination is normal.\n\n");
        }
        if (q.contains("fever") || q.contains("temperature")) {
            sb.append("🌡️ Managing High Fever:\n")
              .append("1. Give paracetamol at the correct dose for age/weight (NOT aspirin for children).\n")
              .append("2. Apply a cool, wet cloth to forehead, armpits, and neck.\n")
              .append("3. Ensure the patient drinks plenty of fluids.\n")
              .append("4. Do not bundle in heavy blankets — keep room ventilated.\n")
              .append("5. If fever exceeds 103°F or persists more than 2 days — go to PHC immediately.\n\n");
        }
        if (q.contains("wound") || q.contains("cut") || q.contains("bleeding")) {
            sb.append("🩸 For Cuts / Wounds:\n")
              .append("1. Apply firm pressure with a clean cloth to stop bleeding.\n")
              .append("2. Clean the wound gently with clean water (do not use contaminated water).\n")
              .append("3. Apply antiseptic if available.\n")
              .append("4. Cover with a clean bandage.\n")
              .append("5. For deep wounds, go to PHC — tetanus vaccination may be needed.\n\n");
        }

        // Generic if no specific match
        if (sb.length() < 100) {
            sb.append("General First Aid steps for waterborne illnesses:\n")
              .append("1. Keep the patient calm and lying down.\n")
              .append("2. Start ORS immediately for vomiting or diarrhoea.\n")
              .append("3. Isolate the patient from food handling.\n")
              .append("4. Do not give any antibiotic without a doctor's prescription.\n")
              .append("5. Report to the nearest PHC and call 108 if condition is severe.\n\n");
        }

        sb.append("📞 Emergency Ambulance: 108 | Health Advice: 104");
        return sb.toString();
    }

    private String handlePrevention(String q, String kbContext, Village village) {
        StringBuilder sb = new StringBuilder();
        sb.append("🛡️ Prevention Tips for " + village.getName() + ":\n\n");

        // Disease-specific prevention
        if (q.contains("cholera") || q.contains("diarrhea") || q.contains("typhoid") || q.contains("dysentery")) {
            sb.append("💧 Water Safety:\n")
              .append("• Always boil drinking water for 3–5 minutes.\n")
              .append("• Use a certified water filter or purification tablets.\n")
              .append("• Store water in a covered, clean container — never in open buckets.\n\n")
              .append("🧼 Hand Hygiene:\n")
              .append("• Wash hands with soap for at least 20 seconds before eating and after using the toilet.\n")
              .append("• Use hand sanitiser when soap is unavailable.\n\n");
        }
        if (q.contains("dengue") || q.contains("malaria")) {
            sb.append("🦟 Mosquito Control:\n")
              .append("• Drain and cover all stagnant water sources (flower pots, tyres, buckets).\n")
              .append("• Sleep under insecticide-treated bed nets every night.\n")
              .append("• Apply mosquito repellent (DEET-based) on exposed skin.\n")
              .append("• Wear full-sleeve clothes during peak mosquito activity (dusk/dawn for malaria, daytime for dengue).\n\n");
        }

        // General prevention always shown
        sb.append("🥗 Food Safety:\n")
          .append("• Eat freshly cooked hot food. Avoid raw or reheated food from unknown sources.\n")
          .append("• Wash fruits and vegetables with clean water before eating.\n")
          .append("• Avoid street food during outbreak periods.\n\n")
          .append("🏡 Home & Community Hygiene:\n")
          .append("• Dispose of human and animal waste in proper sanitation facilities.\n")
          .append("• Keep the area around wells and water points clean.\n")
          .append("• Regularly clean water storage tanks.\n\n")
          .append("💉 Vaccination:\n")
          .append("• Ensure Hepatitis A, Typhoid, and other vaccines are up to date for children and travellers.\n")
          .append("• Visit your PHC for free vaccination schedules.\n");

        if (!kbContext.isEmpty()) {
            sb.append("\n📚 Knowledge Base Recommendations:\n").append(kbContext);
        }
        return sb.toString();
    }

    private String handleRiskExplanation(double riskScore, RiskAssessment risk, String predictedDisease, Village village) {
        String level = riskAssessmentAgent.getRiskCategory(riskScore);
        StringBuilder sb = new StringBuilder();

        sb.append("📊 Risk Score Explained — " + village.getName() + ":\n\n");
        sb.append("Current Score: ").append(String.format("%.1f", riskScore)).append("/100 → Level: ").append(level).append("\n\n");

        sb.append("How the score is calculated:\n")
          .append("• 40% — Symptom reports (verified cases carry more weight than pending ones)\n")
          .append("• 30% — Water contamination level from sensor/field data\n")
          .append("• 20% — Historical outbreak records for this village\n")
          .append("• 10% — Rainfall/weather data (heavy rain increases waterborne disease risk)\n\n");

        if (risk != null) {
            sb.append("Current breakdown:\n")
              .append("  Symptom cases factor: ").append(String.format("%.1f", risk.getSymptomCasesScore())).append("/100\n")
              .append("  Contamination factor: ").append(String.format("%.1f", risk.getContaminationScore())).append("/100\n")
              .append("  Rainfall factor:      ").append(String.format("%.1f", risk.getRainfallFactor())).append("/100\n\n");
        }

        sb.append("What your level means:\n");
        switch (level) {
            case "LOW"      -> sb.append("✅ LOW (0–30): Situation is stable. Maintain standard hygiene practices.\n");
            case "MEDIUM"   -> sb.append("⚠️ MEDIUM (30–60): Some risk factors present. Increase vigilance, boil water, and report symptoms.\n");
            case "HIGH"     -> sb.append("🔶 HIGH (60–80): Significant risk. Health workers are alerted. Follow all hygiene protocols strictly.\n");
            case "CRITICAL" -> sb.append("🔴 CRITICAL (80–100): Immediate action required. Contact health worker and call 108 if there are multiple sick people.\n");
        }

        if (!predictedDisease.equals("None") && !predictedDisease.equals("Unknown")) {
            sb.append("\n🤖 AI Disease Prediction: Our models predict an elevated risk of ").append(predictedDisease).append(" in your area based on current conditions.");
        }
        return sb.toString();
    }

    private String handleWaterQualityExplanation(RiskAssessment risk, Village village) {
        double contamination = risk != null ? risk.getContaminationScore() : 0.0;
        StringBuilder sb = new StringBuilder();

        sb.append("💧 Water Quality Explained — " + village.getName() + ":\n\n");
        sb.append("Contamination Score: ").append(String.format("%.1f", contamination)).append("/100\n\n");

        sb.append("Key water quality parameters we monitor:\n")
          .append("• pH (ideal: 6.5–8.5) — Measures acidity/alkalinity. Out-of-range water may be harmful.\n")
          .append("• Turbidity (ideal: < 5 NTU) — High turbidity means suspended particles, often indicating contamination.\n")
          .append("• Total Dissolved Solids (ideal: < 500 mg/L) — Excess TDS can affect taste and safety.\n")
          .append("• Coliform Bacteria (ideal: 0 CFU/100mL) — Any detection indicates fecal contamination. DO NOT drink.\n\n");

        if (contamination > 80) {
            sb.append("🔴 Status: CRITICAL — Do not use tap or well water for drinking or cooking without boiling and filtering.\n");
        } else if (contamination > 50) {
            sb.append("🔶 Status: HIGH RISK — Boil all water before use. Avoid open water sources.\n");
        } else if (contamination > 20) {
            sb.append("⚠️ Status: MODERATE — Take precautions. Boil water during monsoon.\n");
        } else {
            sb.append("✅ Status: SAFE — Water quality is within normal parameters. Continue standard precautions.\n");
        }

        sb.append("\nIf your water looks cloudy, smells odd, or has unusual colour — do not drink it. Report it immediately through the AquaSentinel app.");
        return sb.toString();
    }

    private String handleSeasonalAdvice(Village village, double riskScore) {
        Month currentMonth = LocalDate.now().getMonth();
        StringBuilder sb = new StringBuilder();

        sb.append("🌦️ Seasonal Health Advisory — " + village.getName() + ":\n\n");

        boolean isMonsoon = (currentMonth.getValue() >= 6 && currentMonth.getValue() <= 9);
        boolean isSummer  = (currentMonth.getValue() >= 3 && currentMonth.getValue() <= 5);
        boolean isWinter  = (currentMonth.getValue() == 12 || currentMonth.getValue() <= 2);

        if (isMonsoon) {
            sb.append("🌧️ Monsoon Season (June–September) — High-Risk Period:\n\n")
              .append("During the monsoon, contamination of water sources is at its peak. Please follow these guidelines:\n\n")
              .append("⚡ Top risks: Cholera, Typhoid, Leptospirosis, Dengue, Malaria\n\n")
              .append("Do's:\n")
              .append("• Boil ALL drinking water without exception.\n")
              .append("• Keep food covered at all times.\n")
              .append("• Clear stagnant water around your home daily.\n")
              .append("• Sleep under mosquito nets every night.\n")
              .append("• Report any fever, vomiting, or diarrhoea immediately.\n\n")
              .append("Don'ts:\n")
              .append("• Don't drink from open wells or ponds.\n")
              .append("• Don't eat from uncovered street food stalls.\n")
              .append("• Don't allow children to play in floodwater.\n");
        } else if (isSummer) {
            sb.append("☀️ Summer Season (March–May) — Heat & Dehydration Risk:\n\n")
              .append("⚡ Top risks: Heatstroke, Dehydration, Gastroenteritis\n\n")
              .append("Do's:\n")
              .append("• Drink at least 8–10 glasses of water daily.\n")
              .append("• Use ORS if feeling very weak or dehydrated.\n")
              .append("• Stay indoors during peak heat (12 PM–3 PM).\n")
              .append("• Store water in clean, covered containers.\n\n")
              .append("Don'ts:\n")
              .append("• Don't eat food that has been sitting out for more than 2 hours.\n")
              .append("• Don't drink chilled water immediately after physical exertion — room temperature is safer.\n");
        } else if (isWinter) {
            sb.append("❄️ Winter Season (December–February) — Respiratory & Typhoid Risk:\n\n")
              .append("⚡ Top risks: Typhoid, Respiratory infections, Pneumonia in elderly\n\n")
              .append("Do's:\n")
              .append("• Keep warm — especially children and the elderly.\n")
              .append("• Ensure proper ventilation indoors to prevent respiratory infections.\n")
              .append("• Continue to boil water — waterborne diseases don't stop in winter.\n\n");
        } else {
            sb.append("🍂 Post-Monsoon (October–November) — Recovery Period:\n\n")
              .append("⚡ Risks: Dengue peaks in post-monsoon, Leptospirosis from floodwater contact.\n\n")
              .append("Do's:\n")
              .append("• Continue mosquito prevention measures — Dengue peaks after rains.\n")
              .append("• Disinfect water storage containers cleaned after flooding.\n")
              .append("• Get health check-ups — many infections show delayed symptoms.\n\n");
        }

        sb.append("\n📊 Village Risk Score: ").append(String.format("%.1f", riskScore)).append("/100 — ")
          .append(riskAssessmentAgent.getRiskCategory(riskScore)).append(" level.\n")
          .append("📞 Call 108 for emergencies | 104 for health advice.");
        return sb.toString();
    }

    private String handleRecommendations(List<String> recs, Village village) {
        StringBuilder sb = new StringBuilder();
        sb.append("💡 Current Recommendations for " + village.getName() + ":\n\n");
        if (recs != null && !recs.isEmpty()) {
            for (String r : recs) {
                sb.append("✅ ").append(r).append("\n");
            }
        } else {
            sb.append("✅ Maintain standard personal hygiene and hydration.\n")
              .append("✅ Boil drinking water as a precaution.\n")
              .append("✅ Report any illness symptoms through the AquaSentinel app.\n");
        }
        sb.append("\n📞 Nearest PHC for medical care. Emergency: 108.");
        return sb.toString();
    }

    private String handleFallback(String question, String kbContext, Village village, double riskScore, List<String> recs) {
        StringBuilder sb = new StringBuilder();
        String level = riskAssessmentAgent.getRiskCategory(riskScore);

        sb.append("👋 Hello! Here's what I know about your village's current health situation:\n\n");
        sb.append("📍 Village: ").append(village.getName()).append(", ").append(village.getDistrict()).append("\n");
        sb.append("📊 Risk Level: ").append(level).append(" (Score: ").append(String.format("%.1f", riskScore)).append("/100)\n\n");

        if (!kbContext.isEmpty()) {
            sb.append("📚 Relevant Health Information:\n").append(kbContext).append("\n");
        }

        sb.append("💡 Active recommendations:\n");
        if (recs != null && !recs.isEmpty()) {
            for (String r : recs) {
                sb.append("• ").append(r).append("\n");
            }
        } else {
            sb.append("• Maintain good hygiene practices.\n• Boil drinking water.\n• Report symptoms through the app.\n");
        }

        sb.append("\n🤔 You can ask me about:\n")
          .append("• Water safety in your area\n")
          .append("• Disease information (cholera, typhoid, dengue, malaria, etc.)\n")
          .append("• Prevention tips & first aid\n")
          .append("• Your village risk score\n")
          .append("• Nearby hospitals or PHC\n")
          .append("• Emergency numbers\n")
          .append("• Seasonal health advice\n");
        return sb.toString();
    }

    // ─────────────────────────────────────────────────────────────
    //  Helper utilities
    // ─────────────────────────────────────────────────────────────

    private double resolveRiskScore(RiskAssessment risk, Village village) {
        if (risk != null) return risk.getTotalRiskScore();
        return village.getRiskScore() != null ? village.getRiskScore() : 0.0;
    }

    private String predictDisease(RiskAssessment risk) {
        if (risk == null) return "None";
        return machineLearningService.predictDisease(
                risk.getContaminationScore(), 7.0,
                risk.getSymptomCasesScore(), risk.getRainfallFactor(),
                1.0, 30.0, 2000.0);
    }

    private List<String> citizenRecommendations(RiskAssessment risk, Village village, String disease) {
        if (risk == null) return List.of();
        java.util.Map<String, List<String>> recMap = recommendationEngine.generateRoleBasedRecommendations(
                disease, risk.getContaminationScore(), risk.getRainfallFactor(), 0,
                village.getActiveCases() != null ? village.getActiveCases() : 0);
        return recMap.getOrDefault("CITIZEN", List.of());
    }
}
