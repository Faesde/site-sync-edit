import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const contentType = req.headers.get('content-type') || ''
    let body: Record<string, string> = {}

    // Twilio sends form-urlencoded data
    if (contentType.includes('application/x-www-form-urlencoded')) {
      const text = await req.text()
      const params = new URLSearchParams(text)
      params.forEach((value, key) => {
        body[key] = value
      })
    } else {
      // Fallback to JSON
      body = await req.json()
    }

    console.log('Twilio webhook received:', JSON.stringify(body, null, 2))

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      db: { schema: 'wiki' }
    })

    // Extract Twilio call data
    const callSid = body.CallSid
    const from = body.From?.replace(/\D/g, '') || body.Caller?.replace(/\D/g, '')
    const to = body.To?.replace(/\D/g, '') || body.Called?.replace(/\D/g, '')
    const callStatus = body.CallStatus
    const callDuration = parseInt(body.CallDuration || '0', 10)
    const digits = body.Digits // DTMF response
    const campaignId = body.campaign_id // Custom param we send

    console.log('Processing call:', { callSid, from, to, callStatus, digits, campaignId })

    if (!from) {
      return new Response(JSON.stringify({ error: 'Missing caller phone' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Find user by the "to" phone number (the number that made the call)
    const { data: configData } = await supabase
      .from('whatsapp_config')
      .select('user_id')
      .or(`cloudapi_phone_number_id.eq.${to},evolution_instance_name.eq.${to}`)
      .maybeSingle()

    let userId = configData?.user_id

    // If no config found by phone, try to find by campaign_id
    if (!userId && campaignId) {
      const { data: campaignData } = await supabase
        .from('whatsapp_campaigns')
        .select('user_id')
        .eq('id', campaignId)
        .maybeSingle()
      
      userId = campaignData?.user_id
    }

    if (!userId) {
      console.log('No user found for call')
      return new Response(JSON.stringify({ 
        error: 'User not found',
        hint: 'Make sure campaign_id is sent with the call'
      }), {
        status: 200, // Return 200 so Twilio doesn't retry
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Build DTMF path from IVR config if available
    let dtmfPath: Array<{ key: string; label: string }> | null = null

    if (digits && campaignId) {
      const { data: ivrConfig } = await supabase
        .from('call_ivr_config')
        .select('menu_structure')
        .eq('campaign_id', campaignId)
        .maybeSingle()

      if (ivrConfig?.menu_structure) {
        const menuStructure = ivrConfig.menu_structure as Array<{
          key: string
          label: string
          submenus?: Array<{ key: string; label: string }>
        }>

        // Parse digits and build path
        dtmfPath = []
        let currentMenu = menuStructure
        
        for (const digit of digits.split('')) {
          const found = currentMenu.find(m => m.key === digit)
          if (found) {
            dtmfPath.push({ key: found.key, label: found.label })
            currentMenu = found.submenus || []
          }
        }
      }
    }

    // Get campaign name
    let campaignName: string | null = null
    if (campaignId) {
      const { data: campaign } = await supabase
        .from('whatsapp_campaigns')
        .select('name')
        .eq('id', campaignId)
        .maybeSingle()
      
      campaignName = campaign?.name || null
    }

    // Insert result into campaign_results
    // Note: campaign_id is stored as text, not UUID
    const { error: insertError } = await supabase
      .from('campaign_results')
      .insert({
        user_id: userId,
        campaign_id: campaignId || null,
        campaign_name: campaignName,
        channel_type: 'call',
        contact_phone: from,
        dtmf_response: digits || null,
        dtmf_path: dtmfPath,
        call_duration: callDuration,
        call_status: callStatus,
        status: callStatus === 'completed' ? 'received' : callStatus,
        raw_payload: body
      })

    if (insertError) {
      console.error('Error inserting call result:', insertError)
      return new Response(JSON.stringify({ error: insertError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log('Call result saved successfully')

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Call result recorded'
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Twilio webhook error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
