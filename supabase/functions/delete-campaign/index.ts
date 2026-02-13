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
    const body = await req.json().catch(() => ({}));
    
    // Support both single campaign_id and batch campaign_ids
    let ids: string[] = [];
    if (Array.isArray(body.campaign_ids) && body.campaign_ids.length > 0) {
      ids = body.campaign_ids.filter((id: any) => typeof id === 'string');
    } else if (typeof body.campaign_id === 'string') {
      ids = [body.campaign_id];
    }

    if (ids.length === 0) {
      return new Response(JSON.stringify({ success: false, error: "campaign_id ou campaign_ids é obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Confirma ownership de todas
    const { data: ownedCampaigns, error: campaignFetchErr } = await supabase
      .from("whatsapp_campaigns")
      .select("id")
      .in("id", ids)
      .eq("user_id", user.id);

    if (campaignFetchErr) throw campaignFetchErr;
    const ownedIds = (ownedCampaigns || []).map((c: any) => c.id);
    if (ownedIds.length === 0) {
      return new Response(JSON.stringify({ success: false, error: "Nenhuma campanha encontrada" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Apaga resultados vinculados
    const { error: resultsErr } = await supabase
      .from("campaign_results")
      .delete()
      .eq("user_id", user.id)
      .in("campaign_id", ownedIds);

    if (resultsErr) throw resultsErr;

    // Apaga as campanhas
    const { error: deleteCampaignErr } = await supabase
      .from("whatsapp_campaigns")
      .delete()
      .eq("user_id", user.id)
      .in("id", ownedIds);

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
