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
    console.log("Creating Evolution instance...");

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
      console.error("Evolution API not configured");
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
      console.error("Error getting user:", userError);
      return new Response(
        JSON.stringify({ success: false, error: 'Usuário não encontrado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const { instance_name, display_name } = body;

    if (!instance_name) {
      return new Response(
        JSON.stringify({ success: false, error: 'Nome da instância é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Sanitize instance name (only lowercase letters, numbers, hyphens)
    const sanitizedName = instance_name.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    const uniqueInstanceName = `${sanitizedName}-${user.id.slice(0, 8)}`;

    console.log("Creating instance in Evolution API:", uniqueInstanceName);

    // Create instance in Evolution API
    const evolutionResponse = await fetch(`${evolutionUrl}/instance/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': evolutionApiKey,
      },
      body: JSON.stringify({
        instanceName: uniqueInstanceName,
        qrcode: true,
        integration: "WHATSAPP-BAILEYS"
      }),
    });

    const evolutionData = await evolutionResponse.json();
    console.log("Evolution API response:", JSON.stringify(evolutionData));

    if (!evolutionResponse.ok) {
      const errorMsg = evolutionData.message || evolutionData.error || 'Erro ao criar instância';
      console.error("Evolution API error:", errorMsg);
      return new Response(
        JSON.stringify({ success: false, error: errorMsg }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Save instance to database
    const { data: instance, error: insertError } = await supabase
      .from('evolution_instances')
      .insert({
        user_id: user.id,
        instance_name: uniqueInstanceName,
        display_name: display_name || instance_name,
        status: 'disconnected',
        qr_code: evolutionData.qrcode?.base64 || null,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error saving instance:", insertError);
      // Try to delete the instance from Evolution if DB save fails
      await fetch(`${evolutionUrl}/instance/delete/${uniqueInstanceName}`, {
        method: 'DELETE',
        headers: { 'apikey': evolutionApiKey },
      });
      return new Response(
        JSON.stringify({ success: false, error: 'Erro ao salvar instância' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("Instance created successfully:", instance.id);
    return new Response(
      JSON.stringify({ 
        success: true, 
        instance,
        qrcode: evolutionData.qrcode?.base64 || null
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
