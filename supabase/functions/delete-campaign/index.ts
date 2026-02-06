import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, serviceKey, { db: { schema: "wiki" } });

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ success: false, error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userRes, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userRes?.user) {
      return new Response(JSON.stringify({ success: false, error: "Sessão inválida" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const user = userRes.user;
    const { campaign_id } = await req.json().catch(() => ({}));

    if (!campaign_id || typeof campaign_id !== "string") {
      return new Response(JSON.stringify({ success: false, error: "campaign_id é obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Confirma ownership
    const { data: campaign, error: campaignFetchErr } = await supabase
      .from("whatsapp_campaigns")
      .select("id")
      .eq("id", campaign_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (campaignFetchErr) throw campaignFetchErr;
    if (!campaign) {
      return new Response(JSON.stringify({ success: false, error: "Campanha não encontrada" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Apaga resultados vinculados
    const { error: resultsErr } = await supabase
      .from("campaign_results")
      .delete()
      .eq("user_id", user.id)
      .eq("campaign_id", campaign_id);

    if (resultsErr) throw resultsErr;

    // Apaga a campanha
    const { error: deleteCampaignErr } = await supabase
      .from("whatsapp_campaigns")
      .delete()
      .eq("user_id", user.id)
      .eq("id", campaign_id);

    if (deleteCampaignErr) throw deleteCampaignErr;

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("delete-campaign error:", error);
    return new Response(JSON.stringify({ success: false, error: "Erro interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
