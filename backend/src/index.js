import { createClient } from "@supabase/supabase-js";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS: Preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    try {
      const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_KEY);

      /* ----------------------------------------------------------
         1️⃣ GET LIST OF HAZARDS + REPAIR PROGRESS (MERGED)
      ---------------------------------------------------------- */
      if (path.startsWith("/stats")) {
        // Fetch hazards
        const { data: hazards, error: hazardsErr } = await supabase
          .from("road_hazard_final_db")
          .select(
            "id, reported_at, image_url, latitude, longitude, hazard_type, state, risk_level"
          )
          .order("risk_level", { ascending: false })
          .limit(200);

        if (hazardsErr) throw hazardsErr;
        if (!hazards) return json([]);

        // Get all ids
        const ids = hazards.map((h) => h.id);

        // Fetch all repair rows for these hazards
        const { data: repairs, error: repairErr } = await supabase
          .from("repair_tracker_db")
          .select(
            "id, worker_id, reported_at, team_assigned_at, in_progress_at, completed_at, photo_url"
          )
          .in("id", ids);

        if (repairErr) throw repairErr;

        // Build map
        const repairMap = {};
        (repairs || []).forEach((r) => {
          repairMap[r.id] = r;
        });

        // Merge objects
        const merged = hazards.map((h) => ({
          ...h,
          progress: repairMap[h.id] || null,
        }));

        return json(merged);
      }

      // 🔹 GET HAZARDS FOR MAP PLOTTING
      if (path.startsWith("/hazard-map")) {
        const { data, error } = await supabase
          .from("road_hazard_final_db")
          .select(
            "id, reported_at, image_url, latitude, longitude, hazard_type, risk_level, repair_material, volume_material_required, manpower_required"
          )
          .order("reported_at", { ascending: false })
          .limit(50);

        if (error) throw error;
        return json(data);
      }

      // 🔹 GET SINGLE HAZARD
      if (path.startsWith("/hazard/")) {
        const id = path.split("/").pop();

        const { data, error } = await supabase
          .from("road_hazard_final_db")
          .select("*")
          .eq("id", id)
          .maybeSingle();

        if (error) throw error;
        return json(data);
      }

      // 🔹 GET WORKERS
      if (path.startsWith("/workers")) {
        const { data, error } = await supabase
          .from("workers_db")
          .select("id, name");

        if (error) throw error;
        return json(data);
      }

      // 🔹 GET REPAIR TRACKER FOR HAZARD
      if (path.startsWith("/repair/") && request.method === "GET") {
        const id = path.split("/").pop();

        const { data, error } = await supabase
          .from("repair_tracker_db")
          .select(
            "id, reported_at, team_assigned_at, in_progress_at, completed_at, worker_id"
          )
          .eq("id", id)
          .maybeSingle();

        if (error) throw error;
        return json(data || {}); // safe
      }

      // 🔹 UPDATE REPAIR STATUS
      if (path.startsWith("/update-repair/") && request.method === "POST") {
        const id = path.split("/").pop();
        const body = await request.json();
        const { status, worker_id, photo_url } = body;

        // 1️⃣ Get current row
        const { data: current, error: fetchErr } = await supabase
          .from("repair_tracker_db")
          .select("*")
          .eq("id", id)
          .maybeSingle();

        if (fetchErr) throw fetchErr;

        if (!current) {
          return json({ error: "No repair entry found for this hazard" }, 404);
        }

        // 2️⃣ Prevent duplicate/backwards updates
        if (status === "assigned" && current.team_assigned_at)
          return json({ error: "Already assigned" }, 400);

        if (status === "in_progress" && current.in_progress_at)
          return json({ error: "Already in progress" }, 400);

        if (status === "completed" && current.completed_at)
          return json({ error: "Already completed" }, 400);

        // 3️⃣ Prepare update data
        const updateData = {};

        if (status === "assigned")
          updateData.team_assigned_at = new Date().toISOString();

        if (status === "in_progress")
          updateData.in_progress_at = new Date().toISOString();

        if (status === "completed")
          updateData.completed_at = new Date().toISOString();

        if (worker_id) updateData.worker_id = worker_id;
        if (photo_url) updateData.photo_url = photo_url;

        // 4️⃣ Execute update
        const { data, error } = await supabase
          .from("repair_tracker_db")
          .update(updateData)
          .eq("id", id)
          .select()
          .maybeSingle();

        if (error) throw error;

        // 5️⃣ Safety check — if update did nothing
        if (!data) {
          return json(
            { error: "No update performed — tracker row missing" },
            400
          );
        }

        return json({ success: true, data });
      }

      return new Response("Not Found", { status: 404, headers: corsHeaders });
    } catch (err) {
      return json({ error: err.message }, 500);
    }
  },
};

// 🌍 Helpers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
    },
  });
}
