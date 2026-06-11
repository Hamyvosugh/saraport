-- ============================================================================
-- Seed 30 days of log_entries for hamy.vosugh@gmail.com
-- Run this directly in Supabase SQL Editor (with service_role or as admin)
-- ============================================================================

DO $$
DECLARE
    target_user_id UUID;
    day_offset INT;
    cur_date DATE;
    progress_ratio NUMERIC;
    morning_weight NUMERIC;
    evening_weight NUMERIC;
    morning_waist NUMERIC;
    evening_waist NUMERIC;
    step_sessions INT;
    s INT;
    steps_val INT;
    day_steps_total INT;
    exercise_dur INT;
    elevation_val INT;
    dow INT;
    rec_time TIMESTAMPTZ;
    base_morning_weight NUMERIC := 85.0;
    base_morning_waist NUMERIC := 98.0;
BEGIN
    -- Find user by email
    SELECT id INTO target_user_id
    FROM auth.users
    WHERE email = 'hamy.vosugh@gmail.com';

    IF target_user_id IS NULL THEN
        RAISE EXCEPTION '❌ User with email hamy.vosugh@gmail.com not found in auth.users';
    END IF;

    RAISE NOTICE 'Found user: %', target_user_id;

    -- Delete existing entries for the last 30 days (clean slate)
    DELETE FROM log_entries
    WHERE user_id = target_user_id
      AND log_date >= CURRENT_DATE - INTERVAL '30 days';

    RAISE NOTICE 'Cleared existing entries.';

    -- Generate data for each of the last 30 days
    FOR day_offset IN 0..29 LOOP
        cur_date := CURRENT_DATE - (29 - day_offset);
        progress_ratio := day_offset::NUMERIC / 29.0; -- 0 to 1 over 30 days
        dow := EXTRACT(DOW FROM cur_date); -- 0=Sun

        -- ================================================================
        -- MEASUREMENTS (one per type per day)
        -- ================================================================

        -- Morning weight: trend down from 85 to 83.2 with ±0.3 noise
        morning_weight := ROUND(
            (base_morning_weight - progress_ratio * 1.8 + (RANDOM() * 0.6 - 0.3))::NUMERIC,
            1
        );
        rec_time := cur_date + TIME '06:30' + (RANDOM() * INTERVAL '2 hours');
        INSERT INTO log_entries (user_id, category, entry_type, value, unit, log_date, recorded_at)
        VALUES (target_user_id, 'measurement', 'morning_weight', morning_weight, 'kg', cur_date, rec_time);

        -- Evening weight: 0.5-1.0 kg heavier than morning
        evening_weight := ROUND((morning_weight + 0.5 + RANDOM() * 0.5)::NUMERIC, 1);
        rec_time := cur_date + TIME '20:00' + (RANDOM() * INTERVAL '3 hours');
        INSERT INTO log_entries (user_id, category, entry_type, value, unit, log_date, recorded_at)
        VALUES (target_user_id, 'measurement', 'evening_weight', evening_weight, 'kg', cur_date, rec_time);

        -- Morning waist: trend down from 98 to 95.5
        morning_waist := ROUND(
            (base_morning_waist - progress_ratio * 2.5 + (RANDOM() * 1.0 - 0.5))::NUMERIC,
            1
        );
        rec_time := cur_date + TIME '06:30' + (RANDOM() * INTERVAL '2 hours');
        INSERT INTO log_entries (user_id, category, entry_type, value, unit, log_date, recorded_at)
        VALUES (target_user_id, 'measurement', 'morning_waist', morning_waist, 'cm', cur_date, rec_time);

        -- Evening waist: 0.3-0.8 cm more than morning
        evening_waist := ROUND((morning_waist + 0.3 + RANDOM() * 0.5)::NUMERIC, 1);
        rec_time := cur_date + TIME '20:00' + (RANDOM() * INTERVAL '3 hours');
        INSERT INTO log_entries (user_id, category, entry_type, value, unit, log_date, recorded_at)
        VALUES (target_user_id, 'measurement', 'evening_waist', evening_waist, 'cm', cur_date, rec_time);

        -- ================================================================
        -- ACTIVITIES (multiple per day)
        -- ================================================================

        -- Exercise: Sun(0), Tue(2), Thu(4), Fri(5)
        IF dow IN (0, 2, 4, 5) THEN
            exercise_dur := FLOOR(RANDOM() * 41)::INT + 20; -- 20-60 min
            rec_time := cur_date + TIME '15:00' + (RANDOM() * INTERVAL '6 hours');
            INSERT INTO log_entries (user_id, category, entry_type, value, unit, log_date, recorded_at)
            VALUES (target_user_id, 'activity', 'exercise', exercise_dur, 'دقیقه', cur_date, rec_time);

            -- Sometimes twice a day
            IF RANDOM() > 0.7 THEN
                exercise_dur := FLOOR(RANDOM() * 16)::INT + 15; -- 15-30 min
                rec_time := cur_date + TIME '07:00' + (RANDOM() * INTERVAL '2 hours');
                INSERT INTO log_entries (user_id, category, entry_type, value, unit, log_date, recorded_at)
                VALUES (target_user_id, 'activity', 'exercise', exercise_dur, 'دقیقه', cur_date, rec_time);
            END IF;
        END IF;

        -- Steps: 1-3 sessions per day
        step_sessions := FLOOR(RANDOM() * 3)::INT + 1;
        day_steps_total := 0;

        FOR s IN 1..step_sessions LOOP
            steps_val := FLOOR(RANDOM() * 4501)::INT + 1500; -- 1500-6000
            day_steps_total := day_steps_total + steps_val;
            rec_time := cur_date + TIME '08:00' + (RANDOM() * INTERVAL '14 hours');
            INSERT INTO log_entries (user_id, category, entry_type, value, unit, log_date, recorded_at)
            VALUES (target_user_id, 'activity', 'steps', steps_val, 'قدم', cur_date, rec_time);
        END LOOP;

        -- Ensure at least 4000 steps per day
        IF day_steps_total < 4000 THEN
            steps_val := FLOOR(RANDOM() * 3001)::INT + 2000; -- 2000-5000
            rec_time := cur_date + TIME '19:00' + (RANDOM() * INTERVAL '3 hours');
            INSERT INTO log_entries (user_id, category, entry_type, value, unit, log_date, recorded_at)
            VALUES (target_user_id, 'activity', 'steps', steps_val, 'قدم', cur_date, rec_time);
        END IF;

        -- Elevation: random days (some hiking/stair climbing)
        IF RANDOM() > 0.6 THEN
            elevation_val := FLOOR(RANDOM() * 351)::INT + 50; -- 50-400 meters
            rec_time := cur_date + TIME '09:00' + (RANDOM() * INTERVAL '9 hours');
            INSERT INTO log_entries (user_id, category, entry_type, value, unit, log_date, recorded_at)
            VALUES (target_user_id, 'activity', 'elevation', elevation_val, 'متر', cur_date, rec_time);
        END IF;

    END LOOP;

    -- Print summary
    RAISE NOTICE '✅ Successfully seeded log_entries for hamy.vosugh@gmail.com';
    RAISE NOTICE '   Date range: % to %', CURRENT_DATE - 29, CURRENT_DATE;
    RAISE NOTICE '   Total entries inserted. Check with:';
    RAISE NOTICE '   SELECT category, entry_type, COUNT(*) FROM log_entries WHERE user_id = ''%'' GROUP BY category, entry_type ORDER BY category, entry_type;', target_user_id;
END;
$$;