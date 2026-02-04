import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Contact {
  name: string;
  phone: string;
  email?: string;
}

// Format phone number for WhatsApp (remove non-digits, add country code if needed)
function formatPhoneNumber(phone: string): string {
  let cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }
  
  if (!cleaned.startsWith('55') && cleaned.length <= 11) {
    cleaned = '55' + cleaned;
  }
  
  return cleaned;
}

// Replace variables in message template
function replaceVariables(
  message: string,
  contact: { name: string; phone: string; email: string }
): string {
  return message
    .replace(/\{\{1\}\}/g, contact.name || '')
    .replace(/\{\{\s*1\s*\}\}/g, contact.name || '')
    .replace(/\{\{2\}\}/g, contact.phone || '')
    .replace(/\{\{\s*2\s*\}\}/g, contact.phone || '')
    .replace(/\{\{3\}\}/g, contact.email || '')
    .replace(/\{\{\s*3\s*\}\}/g, contact.email || '');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Evolution send message function started...");

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
    const { 
      instance_id,
      campaign_id,
      campaign_name,
      contacts,
      message_body,
      template_id
    } = body;

    console.log('Processing Evolution campaign:', campaign_id);
    console.log('Instance ID:', instance_id);
    console.log('Contacts to process:', contacts?.length || 0);

    if (!instance_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'ID da instância é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!contacts || contacts.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Nenhum contato fornecido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!message_body) {
      return new Response(
        JSON.stringify({ success: false, error: 'Mensagem é obrigatória' }),
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

    if (instance.status !== 'connected') {
      return new Response(
        JSON.stringify({ success: false, error: 'Instância não está conectada' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("Sending messages via instance:", instance.instance_name);

    const results: { sent: number; failed: number; errors: string[] } = {
      sent: 0,
      failed: 0,
      errors: [],
    };

    // Process each contact
    for (const contact of contacts as Contact[]) {
      try {
        const formattedPhone = formatPhoneNumber(contact.phone);
        
        // Replace variables in message
        const personalizedMessage = replaceVariables(message_body, {
          name: contact.name,
          phone: contact.phone,
          email: contact.email || '',
        });

        console.log(`Sending to ${formattedPhone}:`, personalizedMessage.substring(0, 50) + '...');

        // Send message via Evolution API
        const evolutionResponse = await fetch(
          `${evolutionUrl}/message/sendText/${instance.instance_name}`,
          {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'apikey': evolutionApiKey 
            },
            body: JSON.stringify({
              number: formattedPhone,
              text: personalizedMessage,
            }),
          }
        );

        const evolutionResult = await evolutionResponse.json();

        if (!evolutionResponse.ok) {
          console.error('Evolution API error for', formattedPhone, ':', evolutionResult);
          results.failed++;
          results.errors.push(`${contact.name}: ${evolutionResult.message || 'Erro desconhecido'}`);
          
          // Insert failed record into campaign_results
          if (campaign_id) {
            await supabase
              .from('campaign_results')
              .insert({
                user_id: user.id,
                campaign_id: campaign_id,
                campaign_name: campaign_name || null,
                channel_type: 'whatsapp',
                contact_phone: formattedPhone,
                contact_name: contact.name || null,
                message_content: personalizedMessage,
                status: 'failed',
                created_at: new Date().toISOString(),
              });
          }
        } else {
          const messageId = evolutionResult.key?.id;
          console.log('Message sent to', formattedPhone, 'ID:', messageId);
          results.sent++;
          
          // Insert sent record into campaign_results for tracking responses
          if (campaign_id) {
            const { error: insertError } = await supabase
              .from('campaign_results')
              .insert({
                user_id: user.id,
                campaign_id: campaign_id,
                campaign_name: campaign_name || null,
                channel_type: 'whatsapp',
                contact_phone: formattedPhone,
                contact_name: contact.name || null,
                message_content: personalizedMessage,
                status: 'sent',
                external_id: messageId || null,
                created_at: new Date().toISOString(),
              });
            
            if (insertError) {
              console.error('Error inserting campaign_result:', insertError);
            } else {
              console.log('Campaign result saved for:', formattedPhone);
            }
          }
        }

        // Small delay between messages to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error: unknown) {
        console.error('Error sending to', contact.name, ':', error);
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        results.failed++;
        results.errors.push(`${contact.name}: ${errorMessage}`);
      }
    }

    console.log('Campaign complete:', results);

    // Update campaign stats if campaign_id provided
    if (campaign_id) {
      await supabase
        .from('whatsapp_campaigns')
        .update({
          sent_count: results.sent,
          failed_count: results.failed,
        })
        .eq('id', campaign_id)
        .eq('user_id', user.id);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        campaign_id,
        total: contacts.length,
        sent: results.sent,
        failed: results.failed,
        errors: results.errors.slice(0, 10),
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
