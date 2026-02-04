import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      db: { schema: 'wiki' }
    });

    const payload = await req.json();
    
    console.log('Evolution webhook received:', JSON.stringify(payload, null, 2));

    const event = payload.event;
    const instance = payload.instance;
    const data = payload.data;

    if (!event || !data) {
      console.log('Missing event or data in payload');
      return new Response(
        JSON.stringify({ success: true, message: 'No action needed' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle incoming messages (responses to campaigns)
    if (event === 'messages.upsert') {
      const message = data.message;
      const key = data.key;
      
      // Only process incoming messages (not sent by us)
      if (key?.fromMe === true) {
        console.log('Ignoring outgoing message');
        return new Response(
          JSON.stringify({ success: true, message: 'Outgoing message ignored' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const remoteJid = key?.remoteJid || '';
      // Extract phone number (remove @s.whatsapp.net suffix)
      const contactPhone = remoteJid.replace('@s.whatsapp.net', '').replace('@c.us', '');
      const messageContent = message?.conversation || 
                            message?.extendedTextMessage?.text || 
                            message?.imageMessage?.caption ||
                            message?.videoMessage?.caption ||
                            '[Mídia recebida]';
      const messageType = message?.conversation ? 'text' : 
                         message?.imageMessage ? 'image' :
                         message?.videoMessage ? 'video' :
                         message?.audioMessage ? 'audio' :
                         message?.documentMessage ? 'document' : 'text';
      const pushName = data.pushName || 'Desconhecido';
      const messageId = key?.id;

      console.log(`Incoming message from ${contactPhone}: ${messageContent}`);

      // Find the Evolution instance to get user_id
      const { data: instanceData } = await supabase
        .from('evolution_instances')
        .select('user_id')
        .eq('instance_name', instance)
        .maybeSingle();

      if (!instanceData) {
        console.log('Instance not found:', instance);
        return new Response(
          JSON.stringify({ success: true, message: 'Instance not found' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const userId = instanceData.user_id;

      // Try to find a recent campaign sent to this contact
      const { data: recentCampaign } = await supabase
        .from('campaign_results')
        .select('id, campaign_id, campaign_name')
        .eq('user_id', userId)
        .eq('contact_phone', contactPhone)
        .eq('channel_type', 'whatsapp')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      // Insert the response into campaign_results
      // NOTE: Use channel_type (not channel) and message_content (not response_content)
      const resultData: Record<string, unknown> = {
        user_id: userId,
        contact_phone: contactPhone,
        contact_name: pushName,
        channel_type: 'whatsapp',
        status: 'received',
        message_content: messageContent,
        external_id: messageId,
        created_at: new Date().toISOString(),
      };

      // Link to campaign if found
      if (recentCampaign) {
        resultData.campaign_id = recentCampaign.campaign_id;
        resultData.campaign_name = recentCampaign.campaign_name;
        console.log(`Linked to campaign: ${recentCampaign.campaign_name}`);
      }

      const { error: insertError } = await supabase
        .from('campaign_results')
        .insert(resultData);

      if (insertError) {
        console.error('Error inserting response:', insertError);
      } else {
        console.log('Response saved successfully');
      }

      // Also save to conversations for chat history
      await supabase
        .from('whatsapp_conversations')
        .insert({
          user_id: userId,
          contact_phone: contactPhone,
          contact_name: pushName,
          message_id: messageId,
          direction: 'inbound',
          message_type: messageType,
          message_content: messageContent,
          status: 'received',
          campaign_id: recentCampaign?.campaign_id || null,
        });
    }

    // Handle message status updates (delivered, read)
    if (event === 'messages.update') {
      const updates = Array.isArray(data) ? data : [data];
      
      for (const update of updates) {
        const messageId = update.key?.id;
        const status = update.update?.status;
        
        if (!messageId || !status) continue;

        // Map Evolution status codes to readable status
        let mappedStatus = 'sent';
        if (status === 2 || status === 'DELIVERY_ACK') mappedStatus = 'delivered';
        if (status === 3 || status === 'READ') mappedStatus = 'read';
        if (status === 4 || status === 'PLAYED') mappedStatus = 'read';

        console.log(`Status update for ${messageId}: ${mappedStatus}`);

        // Update campaign_results with new status
        const { error: updateError } = await supabase
          .from('campaign_results')
          .update({ 
            status: mappedStatus,
            updated_at: new Date().toISOString()
          })
          .eq('external_id', messageId);

        if (updateError) {
          console.error('Error updating status:', updateError);
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
