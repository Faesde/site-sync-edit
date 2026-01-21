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
    console.log("Deleting Evolution instance...");

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

    console.log("Deleting instance:", instance.instance_name);

    // Delete from Evolution API (if configured)
    if (evolutionUrl && evolutionApiKey) {
      try {
        const evolutionResponse = await fetch(
          `${evolutionUrl}/instance/delete/${instance.instance_name}`,
          {
            method: 'DELETE',
            headers: { 'apikey': evolutionApiKey },
          }
        );
        
        const evolutionData = await evolutionResponse.json();
        console.log("Evolution delete response:", JSON.stringify(evolutionData));
      } catch (e) {
        console.log("Error deleting from Evolution (continuing anyway):", e);
      }
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from('evolution_instances')
      .delete()
      .eq('id', instance_id)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error("Error deleting instance:", deleteError);
      return new Response(
        JSON.stringify({ success: false, error: 'Erro ao excluir instância' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("Instance deleted successfully");
    return new Response(
      JSON.stringify({ success: true }),
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
