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

      return new Response("Not Found", { status: 404 });
    } catch (err) {
      return json({ error: err.message }, 500);
    }
  },
};

// 🌍 Reusable Response helpers:
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
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
