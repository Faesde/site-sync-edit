import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Generate phone number variations for matching (handles Brazilian 9th digit)
function getPhoneVariations(phone: string): string[] {
  const cleaned = phone.replace(/\D/g, '');
  const variations = new Set<string>();
  
  variations.add(cleaned);
  
  if (!cleaned.startsWith('55')) {
    variations.add('55' + cleaned);
  }
  if (cleaned.startsWith('55')) {
    variations.add(cleaned.slice(2));
  }
  
  const withCountry = cleaned.startsWith('55') ? cleaned : '55' + cleaned;
  
  if (withCountry.length === 13) {
    const ddd = withCountry.slice(2, 4);
    const rest = withCountry.slice(5);
    variations.add('55' + ddd + rest);
    variations.add(ddd + rest);
  } else if (withCountry.length === 12) {
    const ddd = withCountry.slice(2, 4);
    const rest = withCountry.slice(4);
    variations.add('55' + ddd + '9' + rest);
    variations.add(ddd + '9' + rest);
  }
  
  return Array.from(variations);
}

serve(async (req) => {
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
      
      if (key?.fromMe === true) {
        console.log('Ignoring outgoing message');
        return new Response(
          JSON.stringify({ success: true, message: 'Outgoing message ignored' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const remoteJid = key?.remoteJid || '';

      if (remoteJid.endsWith('@g.us')) {
        console.log('Ignoring group message:', remoteJid);
        return new Response(
          JSON.stringify({ success: true, message: 'Group message ignored' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const contactPhone = remoteJid.replace('@s.whatsapp.net', '').replace('@c.us', '');
      const contactPhoneCandidates = getPhoneVariations(contactPhone);

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

      console.log(`Incoming message from ${contactPhone} (variations: ${contactPhoneCandidates.join(', ')}): ${messageContent}`);

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

      // Find the most recent SENT campaign message to this contact
      const { data: recentCampaign } = await supabase
        .from('campaign_results')
        .select('id, campaign_id, campaign_name')
        .eq('user_id', userId)
        .in('contact_phone', contactPhoneCandidates)
        .eq('channel_type', 'whatsapp')
        .eq('status', 'sent') // Only match sent messages, not received ones
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!recentCampaign?.campaign_id) {
        console.log('No recent campaign found for contact; skipping campaign_results insert.');

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
            campaign_id: null,
          });

        return new Response(
          JSON.stringify({ success: true, message: 'Saved to conversations only' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`Linked to campaign: ${recentCampaign.campaign_name} (ID: ${recentCampaign.campaign_id})`);

      // Check if we already have a 'received' response for this contact/campaign combination
      const { data: existingResponse } = await supabase
        .from('campaign_results')
        .select('id')
        .eq('user_id', userId)
        .eq('campaign_id', recentCampaign.campaign_id)
        .in('contact_phone', contactPhoneCandidates)
        .eq('status', 'received')
        .limit(1)
        .maybeSingle();

      if (existingResponse) {
        console.log('Response already exists for this contact/campaign, skipping duplicate insert.');
        
        // Still save to conversations for chat history
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
            campaign_id: recentCampaign.campaign_id,
          });

        return new Response(
          JSON.stringify({ success: true, message: 'Duplicate response skipped, saved to conversations' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Insert the FIRST response into campaign_results (using raw_payload instead of external_id)
      const { error: insertError } = await supabase
        .from('campaign_results')
        .insert({
          user_id: userId,
          campaign_id: recentCampaign.campaign_id,
          campaign_name: recentCampaign.campaign_name,
          channel_type: 'whatsapp',
          contact_phone: contactPhone,
          contact_name: pushName,
          message_content: messageContent,
          status: 'received',
          raw_payload: {
            provider: 'evolution',
            message_id: messageId,
            message_type: messageType,
            instance: instance,
          },
          created_at: new Date().toISOString(),
        });

      if (insertError) {
        console.error('Error inserting response:', insertError);
      } else {
        console.log('First response saved successfully');
      }

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
          campaign_id: recentCampaign.campaign_id,
        });
    }

    // Handle message status updates (using raw_payload->>message_id instead of external_id)
    if (event === 'messages.update') {
      const updates = Array.isArray(data) ? data : [data];
      
      for (const update of updates) {
        const messageId = update.key?.id || update.keyId;
        const status = update.status || update.update?.status;
        
        if (!messageId || !status) continue;

        let mappedStatus = 'sent';
        if (status === 2 || status === 'DELIVERY_ACK') mappedStatus = 'delivered';
        if (status === 3 || status === 'READ') mappedStatus = 'read';
        if (status === 4 || status === 'PLAYED') mappedStatus = 'read';

        console.log(`Status update for ${messageId}: ${mappedStatus}`);

        // Update using raw_payload->>message_id
        const { error: updateError } = await supabase
          .from('campaign_results')
          .update({ 
            status: mappedStatus,
            updated_at: new Date().toISOString()
          })
          .filter('raw_payload->>message_id', 'eq', messageId);

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
