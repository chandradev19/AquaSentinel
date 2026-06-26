-- AquaShield Demo Data Generation Script

DO $$
DECLARE
    v_ids bigint[];
    v_id bigint;
    u_ids bigint[];
    u_id bigint;
    w_ids bigint[];
    w_id bigint;
    i int;
    statuses varchar[] := ARRAY['PENDING', 'VERIFIED', 'REJECTED'];
    severities varchar[] := ARRAY['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
    genders varchar[] := ARRAY['Male', 'Female'];
    symptoms_list varchar[] := ARRAY['Watery diarrhea', 'High fever, fatigue', 'Stomach cramps', 'Vomiting', 'Jaundice'];
    alert_levels varchar[] := ARRAY['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
    alert_types varchar[] := ARRAY['Disease Outbreak', 'Water Contamination', 'Health Advisory', 'Weather Warning'];
BEGIN
    -- 1. Create 100 Villages
    FOR i IN 1..100 LOOP
        INSERT INTO villages (name, district, state, latitude, longitude, risk_score, active_cases, population, water_quality_status, water_sources)
        VALUES (
            'Village ' || i, 
            'District ' || (floor(random() * 10) + 1), 
            'Tamil Nadu', 
            10.0 + (random() * 3), 
            77.0 + (random() * 3),
            random() * 100, 
            floor(random() * 25), 
            floor(random() * 8000 + 1000), 
            CASE WHEN random() > 0.4 THEN 'SAFE' ELSE 'CONTAMINATED' END,
            'Borewell, Lake'
        );
    END LOOP;

    -- Store village IDs
    v_ids := ARRAY(SELECT id FROM villages);

    -- 2. Create 500 Citizens
    FOR i IN 1..500 LOOP
        v_id := v_ids[floor(random() * array_length(v_ids, 1) + 1)];
        INSERT INTO users (email, name, password, role, phone, suspended, village_id, created_at)
        VALUES (
            'citizen' || i || '@demo.com', 
            'Citizen ' || i, 
            '$2a$10$lHez99mIKcPQkTiOA7tAMOWIDe3AgDhC2sm36QkGoVn1oQijHwqpi', -- 'password123'
            'CITIZEN', 
            '+91-0000000' || i, 
            false, 
            v_id, 
            NOW()
        );
    END LOOP;

    -- 3. Create 50 Workers
    FOR i IN 1..50 LOOP
        v_id := v_ids[floor(random() * array_length(v_ids, 1) + 1)];
        INSERT INTO users (email, name, password, role, phone, suspended, village_id, created_at)
        VALUES (
            'worker' || i || '@demo.com', 
            'Field Worker ' || i, 
            '$2a$10$lHez99mIKcPQkTiOA7tAMOWIDe3AgDhC2sm36QkGoVn1oQijHwqpi', 
            'HEALTH_WORKER', 
            '+91-1110000' || i, 
            false, 
            v_id, 
            NOW()
        );
    END LOOP;

    -- Store user arrays
    u_ids := ARRAY(SELECT id FROM users WHERE role = 'CITIZEN');
    w_ids := ARRAY(SELECT id FROM users WHERE role = 'HEALTH_WORKER');

    -- 4. Create 2000 Symptom Reports
    FOR i IN 1..2000 LOOP
        u_id := u_ids[floor(random() * array_length(u_ids, 1) + 1)];
        v_id := (SELECT village_id FROM users WHERE id = u_id);
        IF v_id IS NULL THEN
            v_id := v_ids[1];
        END IF;
        
        w_id := NULL;
        IF random() > 0.3 THEN
            w_id := w_ids[floor(random() * array_length(w_ids, 1) + 1)];
        END IF;

        INSERT INTO symptom_reports (age, duration, gender, latitude, longitude, report_date, severity, status, symptoms, verified_at, user_id, verified_by_id, village_id)
        VALUES (
            floor(random() * 60 + 5), 
            floor(random() * 5 + 1) || ' days', 
            genders[floor(random() * array_length(genders, 1) + 1)], 
            10.0 + (random() * 3), 77.0 + (random() * 3), 
            NOW() - (random() * interval '30 days'), 
            severities[floor(random() * array_length(severities, 1) + 1)], 
            CASE WHEN w_id IS NOT NULL THEN statuses[floor(random() * 2 + 2)] ELSE 'PENDING' END, -- VERIFIED or REJECTED
            symptoms_list[floor(random() * array_length(symptoms_list, 1) + 1)], 
            CASE WHEN w_id IS NOT NULL THEN NOW() - (random() * interval '10 days') ELSE NULL END,
            u_id, 
            w_id, 
            v_id
        );
    END LOOP;

    -- 5. Create 500 Water Quality Reports
    FOR i IN 1..500 LOOP
        w_id := w_ids[floor(random() * array_length(w_ids, 1) + 1)];
        v_id := (SELECT village_id FROM users WHERE id = w_id);
        IF v_id IS NULL THEN
            v_id := v_ids[1];
        END IF;

        INSERT INTO water_quality_reports (contamination_level, ph_level, safe_to_drink, report_date, turbidity, health_worker_id, village_id)
        VALUES (
            random() * 100, 
            5.0 + (random() * 4), 
            CASE WHEN random() > 0.4 THEN true ELSE false END, 
            NOW() - (random() * interval '30 days'), 
            random() * 20, 
            w_id, 
            v_id
        );
    END LOOP;

    -- 6. Create 300 Alerts
    FOR i IN 1..300 LOOP
        v_id := v_ids[floor(random() * array_length(v_ids, 1) + 1)];
        
        INSERT INTO alerts (alert_level, alert_type, created_at, message, status, village_id)
        VALUES (
            alert_levels[floor(random() * array_length(alert_levels, 1) + 1)], 
            alert_types[floor(random() * array_length(alert_types, 1) + 1)], 
            NOW() - (random() * interval '30 days'), 
            'System generated alert for village ' || v_id, 
            CASE WHEN random() > 0.5 THEN 'ACTIVE' ELSE 'RESOLVED' END, 
            v_id
        );
    END LOOP;

END $$;
