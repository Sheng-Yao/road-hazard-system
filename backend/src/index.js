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

      // 🔹 GET LIST OF HAZARDS
      if (path.startsWith("/stats")) {
        const { data, error } = await supabase
          .from("road_hazard_final_db")
          .select(
            "id, reported_at, image_url, latitude, longitude, hazard_type, state, risk_level"
          )
          .order("risk_level", { ascending: false })
          .limit(50);

        if (error) throw error;

        return json(data);
      }

      // 🔹 NEW: GET HAZARDS FOR MAP PLOTTING
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

      // 🔹 GET SINGLE HAZARD BY ID
      if (path.startsWith("/hazard/")) {
        const id = path.split("/").pop();

        const { data, error } = await supabase
          .from("road_hazard_final_db")
          .select("*")
          .eq("id", id)
          .single();

        if (error) throw error;

        return json(data);
      }

      /* =========================================================
         🔥 NEW: WORKER FETCH
      ========================================================= */

      if (path.startsWith("/workers")) {
        const { data, error } = await supabase
          .from("workers_db")
          .select("id, name");

        if (error) throw error;

        return json(data);
      }

      /* =========================================================
         🔥 NEW: GET REPAIR TRACKER FOR A SPECIFIC HAZARD
      ========================================================= */

      if (path.startsWith("/repair/") && request.method === "GET") {
        const id = path.split("/").pop();

        const { data, error } = await supabase
          .from("repair_tracker_db")
          .select("*")
          .eq("id", id)
          .single();

        if (error) throw error;

        return json(data);
      }

      /* =========================================================
         🔥 NEW: UPDATE REPAIR STATUS (FORWARD-ONLY)
      ========================================================= */

      // 🔹 UPDATE REPAIR STATUS
      if (path.startsWith("/update-repair/") && request.method === "POST") {
        const id = path.split("/").pop();
        const body = await request.json();

        const { status, worker, photo_url } = body;

        // ============================================================
        // 1️⃣ Fetch existing row first (needed for forward-only checks)
        // ============================================================
        const { data: current, error: fetchErr } = await supabase
          .from("repair_tracker_db")
          .select("*")
          .eq("id", id)
          .single();

        if (fetchErr) throw fetchErr;

        // ============================================================
        // 2️⃣ Prevent backward or duplicate updates
        // ============================================================
        if (status === "assigned" && current.team_assigned_at)
          return json({ error: "Already assigned" }, 400);

        if (status === "on_the_way" && current.on_the_way_at)
          return json({ error: "Already on the way" }, 400);

        if (status === "in_progress" && current.in_progress_at)
          return json({ error: "Already in progress" }, 400);

        if (status === "completed" && current.completed_at)
          return json({ error: "Already completed" }, 400);

        // ============================================================
        // 3️⃣ Build update object (forward-only)
        // ============================================================
        const updateData = {};

        if (status === "assigned")
          updateData.team_assigned_at = new Date().toISOString();

        if (status === "on_the_way")
          updateData.on_the_way_at = new Date().toISOString();

        if (status === "in_progress")
          updateData.in_progress_at = new Date().toISOString();

        if (status === "completed")
          updateData.completed_at = new Date().toISOString();

        if (worker) updateData.worker = worker;
        if (photo_url) updateData.photo_url = photo_url;

        // ============================================================
        // 4️⃣ Execute update
        // ============================================================
        const { data, error } = await supabase
          .from("repair_tracker_db")
          .update(updateData)
          .eq("id", id)
          .select()
          .single();

        if (error) throw error;

        return json({ success: true, data });
      }

      /* ========================================================= */
      return new Response("Not Found", { status: 404 });
    } catch (err) {
      return json({ error: err.message }, 500);
    }
  },
};

// 🌍 Reusable Response helpers:.
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
