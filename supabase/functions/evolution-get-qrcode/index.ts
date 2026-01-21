import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Getting QR Code...");

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const evolutionUrl = Deno.env.get('EVOLUTION_API_URL')!;
    const evolutionApiKey = Deno.env.get('EVOLUTION_API_KEY')!;

    if (!evolutionUrl || !evolutionApiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Evolution API não configurada' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      db: { schema: 'wiki' }
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Usuário não encontrado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const { instance_id } = body;

    if (!instance_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'ID da instância é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get instance from database
    const { data: instance, error: fetchError } = await supabase
      .from('evolution_instances')
      .select('*')
      .eq('id', instance_id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !instance) {
      return new Response(
        JSON.stringify({ success: false, error: 'Instância não encontrada' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("Getting QR Code for instance:", instance.instance_name);

    // Get QR Code from Evolution API
    const evolutionResponse = await fetch(
      `${evolutionUrl}/instance/connect/${instance.instance_name}`,
      {
        method: 'GET',
        headers: { 'apikey': evolutionApiKey },
      }
    );

    const evolutionData = await evolutionResponse.json();
    console.log("Evolution QR response:", JSON.stringify(evolutionData));

    if (!evolutionResponse.ok) {
      // Instance might already be connected
      if (evolutionData.error?.includes('connected') || evolutionData.message?.includes('connected')) {
        // Update status to connected
        await supabase
          .from('evolution_instances')
          .update({ status: 'connected', qr_code: null })
          .eq('id', instance_id);

        return new Response(
          JSON.stringify({ success: true, status: 'connected', qrcode: null }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: false, error: evolutionData.message || 'Erro ao obter QR Code' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update QR code in database
    const qrCodeBase64 = evolutionData.base64 || evolutionData.qrcode?.base64 || null;
    
    await supabase
      .from('evolution_instances')
      .update({ 
        qr_code: qrCodeBase64,
        status: 'disconnected'
      })
      .eq('id', instance_id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        qrcode: qrCodeBase64,
        status: 'disconnected'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ success: false, error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
