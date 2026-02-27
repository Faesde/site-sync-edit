import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Nao autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Nao autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const DADOS4U_API_KEY = Deno.env.get("DADOS4U_API_KEY");
    if (!DADOS4U_API_KEY) {
      return new Response(JSON.stringify({ error: "DADOS4U_API_KEY nao configurada" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { tipo, valor } = body;

    if (!tipo || !valor) {
      return new Response(JSON.stringify({ error: "Campos 'tipo' e 'valor' sao obrigatorios" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const tiposPermitidos = ["cpf_cnpj", "nome_completo", "numero_telefone", "email"];
    if (!tiposPermitidos.includes(tipo)) {
      return new Response(JSON.stringify({ error: "Tipo invalido. Use: " + tiposPermitidos.join(", ") }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Determine endpoint based on type
    const isCnpj = tipo === "cpf_cnpj" && valor.replace(/\D/g, "").length > 11;
    const endpoint = isCnpj
      ? "https://dados4u.com.br/api/v1/consultar-cnpj"
      : "https://dados4u.com.br/api/v1/consultar";

    const requestBody = isCnpj
      ? { valor: valor.replace(/\D/g, "") }
      : { tipo, valor: valor.replace(/\D/g, "") };

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": DADOS4U_API_KEY,
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    if (!response.ok) {
      return new Response(JSON.stringify({ error: data?.message || "Erro na consulta Dados4U", details: data }), {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Erro na funcao dados4u-consultar:", error);
    return new Response(JSON.stringify({ error: "Erro interno do servidor" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
