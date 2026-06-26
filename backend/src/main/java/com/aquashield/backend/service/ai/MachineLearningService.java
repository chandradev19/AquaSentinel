package com.aquashield.backend.service.ai;

import com.aquashield.backend.entity.AiModelMetadata;
import com.aquashield.backend.repository.AiModelMetadataRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import weka.classifiers.trees.RandomForest;
import weka.core.Attribute;
import weka.core.DenseInstance;
import weka.core.Instances;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Random;

@Service
public class MachineLearningService {

    @Autowired
    private AiModelMetadataRepository aiModelMetadataRepository;

    private RandomForest model;
    private Instances dataset;
    private ArrayList<Attribute> attributes;

    public static final String MODEL_NAME = "DiseasePrediction_RandomForest";

    @PostConstruct
    public void init() {
        setupAttributes();
        loadOrTrainModel();
    }

    private void setupAttributes() {
        attributes = new ArrayList<>();
        attributes.add(new Attribute("contaminationLevel"));
        attributes.add(new Attribute("phLevel"));
        attributes.add(new Attribute("symptomScore"));
        attributes.add(new Attribute("rainfallFactor"));
        attributes.add(new Attribute("historicalOutbreaks"));
        attributes.add(new Attribute("temperature"));
        attributes.add(new Attribute("populationDensity"));

        List<String> classes = new ArrayList<>();
        classes.add("Cholera");
        classes.add("Typhoid");
        classes.add("Diarrhea");
        classes.add("Hepatitis A");
        classes.add("Dysentery");
        classes.add("None");
        Attribute classAttr = new Attribute("disease", classes);
        attributes.add(classAttr);

        dataset = new Instances("DiseaseData", attributes, 0);
        dataset.setClassIndex(dataset.numAttributes() - 1);
    }

    public void loadOrTrainModel() {
        AiModelMetadata metadata = aiModelMetadataRepository.findByModelName(MODEL_NAME).orElse(null);
        if (metadata == null || model == null) {
            trainModelWithSyntheticData();
        }
    }

    public synchronized void trainModelWithSyntheticData() {
        dataset.clear();
        Random rand = new Random(42);
        
        for (int i = 0; i < 800; i++) {
            double cont = rand.nextDouble() * 100;
            double ph = 5.0 + rand.nextDouble() * 4.0;
            double symp = rand.nextDouble() * 100;
            double rain = rand.nextDouble() * 100;
            double hist = rand.nextInt(5);
            double temp = 20.0 + rand.nextDouble() * 20.0; // 20 to 40 C
            double pop = 500 + rand.nextDouble() * 5000;
            
            String target = "None";
            if (cont > 80 && symp > 70) target = "Cholera";
            else if (cont > 60 && symp > 50 && ph < 6.5) target = "Typhoid";
            else if (cont > 50 && temp > 35 && hist > 1) target = "Dysentery";
            else if (cont > 40 && rain > 70 && pop > 3000) target = "Hepatitis A";
            else if (cont > 40 && symp > 40) target = "Diarrhea";

            addInstance(cont, ph, symp, rain, hist, temp, pop, target);
        }

        train();
    }

    private void addInstance(double contamination, double ph, double symptoms, double rainfall, double hist, double temp, double pop, String diseaseClass) {
        DenseInstance inst = new DenseInstance(8);
        inst.setDataset(dataset);
        inst.setValue(0, contamination);
        inst.setValue(1, ph);
        inst.setValue(2, symptoms);
        inst.setValue(3, rainfall);
        inst.setValue(4, hist);
        inst.setValue(5, temp);
        inst.setValue(6, pop);
        inst.setValue(7, diseaseClass);
        dataset.add(inst);
    }

    public synchronized void retrainModel(List<double[]> features, List<String> labels) {
        dataset.clear();
        for (int i = 0; i < features.size(); i++) {
            double[] f = features.get(i);
            addInstance(f[0], f[1], f[2], f[3], f[4], f[5], f[6], labels.get(i));
        }
        train();
    }

    private void train() {
        try {
            model = new RandomForest();
            model.setNumIterations(100);
            model.buildClassifier(dataset);

            weka.classifiers.Evaluation eval = new weka.classifiers.Evaluation(dataset);
            eval.evaluateModel(model, dataset);
            double accuracy = eval.pctCorrect();

            AiModelMetadata metadata = aiModelMetadataRepository.findByModelName(MODEL_NAME)
                    .orElse(AiModelMetadata.builder().modelName(MODEL_NAME).build());
            
            metadata.setAccuracy(accuracy);
            metadata.setDatasetSize(dataset.numInstances());
            metadata.setLastTrained(new Date());
            metadata.setStatus("ACTIVE");
            
            aiModelMetadataRepository.save(metadata);
            
            System.out.println("RandomForest Model Trained. Accuracy: " + accuracy);
        } catch (Exception e) {
            e.printStackTrace();
            AiModelMetadata metadata = aiModelMetadataRepository.findByModelName(MODEL_NAME)
                    .orElse(AiModelMetadata.builder().modelName(MODEL_NAME).build());
            metadata.setStatus("FAILED");
            aiModelMetadataRepository.save(metadata);
        }
    }

    public String predictDisease(double contamination, double ph, double symptoms, double rainfall, double hist, double temp, double pop) {
        if (model == null) return "Unknown";
        
        try {
            DenseInstance inst = new DenseInstance(7);
            inst.setDataset(dataset);
            inst.setValue(0, contamination);
            inst.setValue(1, ph);
            inst.setValue(2, symptoms);
            inst.setValue(3, rainfall);
            inst.setValue(4, hist);
            inst.setValue(5, temp);
            inst.setValue(6, pop);
            
            double pred = model.classifyInstance(inst);
            return dataset.classAttribute().value((int) pred);
        } catch (Exception e) {
            e.printStackTrace();
            return "Unknown";
        }
    }
}
