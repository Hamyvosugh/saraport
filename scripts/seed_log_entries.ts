/**
 * Seed script: populate 30 days of log_entries for hamy.vosugh@gmail.com
 *
 * Run with: npx ts-node --esm scripts/seed_log_entries.ts
 * OR: npx tsx scripts/seed_log_entries.ts
 *
 * Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in saraport_graph/.env.local
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

// Load env from saraport_graph directory
dotenv.config({ path: path.resolve(__dirname, "../saraport_graph/.env.local") });

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("❌ SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
  console.error("   Ensure saraport_graph/.env.local is properly configured.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const TARGET_EMAIL = "hamy.vosugh@gmail.com";

// ---- Helpers ----
function randomBetween(min: number, max: number, decimals = 0): number {
  const val = min + Math.random() * (max - min);
  return Number(val.toFixed(decimals));
}

function randomInt(min: number, max: number): number {
  return Math.floor(randomBetween(min, max));
}

function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Generate a date string YYYY-MM-DD for N days ago
function daysAgo(days: number, referenceDate?: Date): string {
  const d = referenceDate ? new Date(referenceDate) : new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split("T")[0];
}

// Random time in HH:MM:SS for a given date
function randomTimeOnDate(dateStr: string, hourFrom = 6, hourTo = 22): string {
  const hour = randomInt(hourFrom, hourTo);
  const minute = randomInt(0, 59);
  const second = randomInt(0, 59);
  return `${dateStr}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:${String(second).padStart(2, "0")}+02:00`;
}

interface LogEntry {
  user_id: string;
  category: "measurement" | "activity";
  entry_type: string;
  value: number;
  unit: string;
  log_date: string;
  recorded_at: string;
}

async function main() {
  console.log(`🔍 Finding user: ${TARGET_EMAIL}...`);

  // Get user by email via admin API
  const { data: { users }, error: userErr } = await supabase.auth.admin.listUsers();
  
  if (userErr) {
    console.error("❌ Failed to list users:", userErr.message);
    process.exit(1);
  }

  const user = users?.find((u) => u.email === TARGET_EMAIL);
  if (!user) {
    console.error(`❌ User not found: ${TARGET_EMAIL}`);
    console.error("   Make sure the user has signed up in Supabase Auth.");
    process.exit(1);
  }

  const userId = user.id;
  console.log(`✅ Found user: ${userId}`);

  // Delete existing entries for this user (clean slate for 30-day period)
  const thirtyDaysAgo = daysAgo(30);
  const { error: delErr } = await supabase
    .from("log_entries")
    .delete()
    .eq("user_id", userId)
    .gte("log_date", thirtyDaysAgo);

  if (delErr) {
    console.warn("⚠️  Could not delete old entries (maybe table doesn't exist yet):", delErr.message);
  } else {
    console.log("🧹 Cleared existing entries for the last 30 days.");
  }

  const entries: LogEntry[] = [];
  
  // Base values that trend over 30 days
  const baseMorningWeight = 85.0;
  const baseEveningWeight = 85.8;
  const baseMorningWaist = 98.0;
  const baseEveningWaist = 99.5;

  // Generate data for each of the last 30 days
  for (let day = 29; day >= 0; day--) {
    const dateStr = daysAgo(day);
    const progressRatio = (29 - day) / 29; // 0 to 1 over 30 days
    
    // ---- MEASUREMENTS (once per day each) ----
    
    // Morning weight: trend down from 85 to 83.2
    const morningWeight = +(baseMorningWeight - progressRatio * 1.8 + randomBetween(-0.3, 0.3, 1)).toFixed(1);
    // Evening weight: ~0.6-1.0 kg heavier than morning
    const eveningWeight = +(morningWeight + randomBetween(0.5, 1.0, 1)).toFixed(1);
    // Morning waist: trend down from 98 to 95.5
    const morningWaist = +(baseMorningWaist - progressRatio * 2.5 + randomBetween(-0.5, 0.5, 1)).toFixed(1);
    // Evening waist: slightly more than morning
    const eveningWaist = +(morningWaist + randomBetween(0.3, 0.8, 1)).toFixed(1);

    entries.push({
      user_id: userId,
      category: "measurement",
      entry_type: "morning_weight",
      value: morningWeight,
      unit: "kg",
      log_date: dateStr,
      recorded_at: randomTimeOnDate(dateStr, 6, 9),
    });
    entries.push({
      user_id: userId,
      category: "measurement",
      entry_type: "evening_weight",
      value: eveningWeight,
      unit: "kg",
      log_date: dateStr,
      recorded_at: randomTimeOnDate(dateStr, 19, 23),
    });
    entries.push({
      user_id: userId,
      category: "measurement",
      entry_type: "morning_waist",
      value: morningWaist,
      unit: "cm",
      log_date: dateStr,
      recorded_at: randomTimeOnDate(dateStr, 6, 9),
    });
    entries.push({
      user_id: userId,
      category: "measurement",
      entry_type: "evening_waist",
      value: eveningWaist,
      unit: "cm",
      log_date: dateStr,
      recorded_at: randomTimeOnDate(dateStr, 19, 23),
    });

    // ---- ACTIVITIES (multiple per day) ----
    
    // Exercise: 3-5 times per week
    const dayOfWeek = new Date(dateStr).getDay(); // 0=Sun
    const exerciseDays = [0, 2, 4, 5]; // Sun, Tue, Thu, Fri
    if (exerciseDays.includes(dayOfWeek)) {
      const duration = randomInt(20, 60);
      entries.push({
        user_id: userId,
        category: "activity",
        entry_type: "exercise",
        value: duration,
        unit: "دقیقه",
        log_date: dateStr,
        recorded_at: randomTimeOnDate(dateStr, 14, 20),
      });
      // Sometimes twice a day on exercise days
      if (Math.random() > 0.7) {
        entries.push({
          user_id: userId,
          category: "activity",
          entry_type: "exercise",
          value: randomInt(15, 30),
          unit: "دقیقه",
          log_date: dateStr,
          recorded_at: randomTimeOnDate(dateStr, 6, 9),
        });
      }
    }

    // Steps: 1-3 entries per day (morning walk, afternoon, evening)
    const stepSessions = randomInt(1, 3);
    let dayTotalSteps = 0;
    for (let s = 0; s < stepSessions; s++) {
      const steps = randomInt(1500, 6000);
      dayTotalSteps += steps;
      entries.push({
        user_id: userId,
        category: "activity",
        entry_type: "steps",
        value: steps,
        unit: "قدم",
        log_date: dateStr,
        recorded_at: randomTimeOnDate(dateStr, 7, 22),
      });
    }
    // Ensure at least 4000 and at most 15000 steps per day
    if (dayTotalSteps < 4000) {
      entries.push({
        user_id: userId,
        category: "activity",
        entry_type: "steps",
        value: randomInt(2000, 5000),
        unit: "قدم",
        log_date: dateStr,
        recorded_at: randomTimeOnDate(dateStr, 18, 22),
      });
    }

    // Elevation: 0-3 entries per week (hiking/stair climbing)
    if (Math.random() > 0.6) {
      entries.push({
        user_id: userId,
        category: "activity",
        entry_type: "elevation",
        value: randomInt(50, 400),
        unit: "متر",
        log_date: dateStr,
        recorded_at: randomTimeOnDate(dateStr, 8, 18),
      });
    }
  }

  console.log(`📊 Generated ${entries.length} log entries for 30 days.`);

  // Insert in batches of 50
  const batchSize = 50;
  let inserted = 0;
  for (let i = 0; i < entries.length; i += batchSize) {
    const batch = entries.slice(i, i + batchSize);
    const { error: insErr } = await supabase.from("log_entries").insert(batch);
    if (insErr) {
      console.error(`❌ Batch insert failed at index ${i}:`, insErr.message);
      console.error("   First item in batch:", JSON.stringify(batch[0]));
      process.exit(1);
    }
    inserted += batch.length;
    console.log(`   Inserted ${inserted}/${entries.length} entries...`);
  }

  console.log(`\n✅ Successfully seeded ${inserted} log_entries for ${TARGET_EMAIL}`);
  console.log(`   Date range: ${daysAgo(29)} to ${daysAgo(0)}`);
  console.log("\n📋 Summary:");
  console.log(`   • Morning weight entries: ${entries.filter(e => e.entry_type === 'morning_weight').length}`);
  console.log(`   • Evening weight entries: ${entries.filter(e => e.entry_type === 'evening_weight').length}`);
  console.log(`   • Morning waist entries: ${entries.filter(e => e.entry_type === 'morning_waist').length}`);
  console.log(`   • Evening waist entries: ${entries.filter(e => e.entry_type === 'evening_waist').length}`);
  console.log(`   • Steps entries: ${entries.filter(e => e.entry_type === 'steps').length}`);
  console.log(`   • Exercise entries: ${entries.filter(e => e.entry_type === 'exercise').length}`);
  console.log(`   • Elevation entries: ${entries.filter(e => e.entry_type === 'elevation').length}`);
}

main().catch(console.error);