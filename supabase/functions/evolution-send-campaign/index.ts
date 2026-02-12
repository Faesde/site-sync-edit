import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function formatPhoneNumber(phone: string): string {
  let cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("0")) cleaned = cleaned.substring(1);
  if (!cleaned.startsWith("55") && cleaned.length <= 11) cleaned = "55" + cleaned;
  return cleaned;
}

function getBrasiliaHour(): number {
  const now = new Date();
  const fmt = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "numeric",
    hour12: false,
  }).format(now);
  return parseInt(fmt, 10);
}

function isNightTime(start: number, end: number): boolean {
  const hour = getBrasiliaHour();
  if (start < end) return hour >= start && hour < end;
  return hour >= start || hour < end;
}

function getRandomDelay(
  index: number,
  intervalMinMs: number,
  intervalMaxMs: number,
  warmupEnabled: boolean,
  warmupMessages: number,
  warmupMaxDelayMs: number
): number {
  let effectiveMaxMs = intervalMaxMs;
  if (warmupEnabled && index < warmupMessages) {
    effectiveMaxMs = Math.max(intervalMaxMs, warmupMaxDelayMs);
  }
  return Math.floor(Math.random() * (effectiveMaxMs - intervalMinMs + 1)) + intervalMinMs;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey, { db: { schema: "wiki" } });

    const body = await req.json();
    const { action } = body;

    // ─── CANCEL ───
    if (action === "cancel") {
      const { job_id } = body;
      await supabase.from("campaign_jobs").update({ status: "cancelled", updated_at: new Date().toISOString() }).eq("id", job_id);
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ─── START ───
    if (action === "start") {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader?.startsWith("Bearer ")) {
        return new Response(JSON.stringify({ error: "Não autorizado" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const token = authHeader.replace("Bearer ", "");
      const { data: userRes, error: userErr } = await supabase.auth.getUser(token);
      if (userErr || !userRes?.user) {
        return new Response(JSON.stringify({ error: "Sessão inválida" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const {
        campaign_id, campaign_name, instance_id, contacts, message_body,
        template_id, variable_mappings,
        delay_min_ms, delay_max_ms,
        warmup_enabled, warmup_messages, warmup_max_delay_ms,
        night_pause_enabled, night_pause_start, night_pause_end,
      } = body;

      // Create job row
      const { data: job, error: jobErr } = await supabase.from("campaign_jobs").insert({
        user_id: userRes.user.id,
        campaign_id,
        campaign_name,
        status: "running",
        total_contacts: contacts.length,
        processed_offset: 0,
        sent_count: 0,
        failed_count: 0,
        config: {
          instance_id,
          message_body,
          template_id: template_id || null,
          variable_mappings: variable_mappings || [],
          delay_min_ms: delay_min_ms || 25000,
          delay_max_ms: delay_max_ms || 60000,
          warmup_enabled: warmup_enabled ?? true,
          warmup_messages: warmup_messages || 200,
          warmup_max_delay_ms: warmup_max_delay_ms || 120000,
          night_pause_enabled: night_pause_enabled ?? true,
          night_pause_start: night_pause_start ?? 21,
          night_pause_end: night_pause_end ?? 7,
          contacts,
        },
      }).select("id").single();

      if (jobErr) throw jobErr;

      // Self-invoke to start processing (non-blocking)
      const fnUrl = `${supabaseUrl}/functions/v1/evolution-send-campaign`;
      fetch(fnUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${serviceKey}` },
        body: JSON.stringify({ action: "process", job_id: job.id }),
      }).catch((e) => console.error("Self-invoke error:", e));

      return new Response(JSON.stringify({ success: true, job_id: job.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── PROCESS (internal, called by self-invoke) ───
    if (action === "process") {
      const { job_id } = body;
      const startTime = Date.now();
      const MAX_RUNTIME_MS = 50000; // 50s budget to stay under 60s timeout

      // Fetch job
      const { data: job, error: fetchErr } = await supabase.from("campaign_jobs").select("*").eq("id", job_id).single();
      if (fetchErr || !job) {
        console.error("Job not found:", job_id);
        return new Response(JSON.stringify({ error: "Job not found" }), { status: 404, headers: corsHeaders });
      }

      if (job.status === "cancelled" || job.status === "completed") {
        return new Response(JSON.stringify({ success: true, status: job.status }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const config = job.config;
      const contacts = config.contacts;
      const instanceId = config.instance_id;

      // Fetch instance
      const { data: instance } = await supabase.from("evolution_instances").select("*").eq("id", instanceId).single();
      if (!instance || instance.status !== "connected") {
        await supabase.from("campaign_jobs").update({
          status: "failed",
          current_contact: "Instância desconectada",
          updated_at: new Date().toISOString(),
        }).eq("id", job_id);
        return new Response(JSON.stringify({ error: "Instance disconnected" }), { status: 400, headers: corsHeaders });
      }

      let offset = job.processed_offset;
      let sentCount = job.sent_count;
      let failedCount = job.failed_count;

      for (let i = offset; i < contacts.length; i++) {
        // Check time budget
        if (Date.now() - startTime > MAX_RUNTIME_MS) {
          // Save progress and self-invoke to continue
          await supabase.from("campaign_jobs").update({
            processed_offset: i,
            sent_count: sentCount,
            failed_count: failedCount,
            current_contact: "",
            updated_at: new Date().toISOString(),
          }).eq("id", job_id);

          const fnUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/evolution-send-campaign`;
          fetch(fnUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}` },
            body: JSON.stringify({ action: "process", job_id }),
          }).catch((e) => console.error("Self-invoke error:", e));

          return new Response(JSON.stringify({ success: true, continuing: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        // Re-check job status for cancellation (every 10 messages)
        if (i > offset && i % 10 === 0) {
          const { data: checkJob } = await supabase.from("campaign_jobs").select("status").eq("id", job_id).single();
          if (checkJob?.status === "cancelled") {
            await supabase.from("campaign_jobs").update({
              processed_offset: i,
              sent_count: sentCount,
              failed_count: failedCount,
              current_contact: "",
              updated_at: new Date().toISOString(),
            }).eq("id", job_id);

            // Update campaign stats
            await supabase.from("whatsapp_campaigns").update({
              sent_count: sentCount,
              failed_count: failedCount,
            }).eq("id", job.campaign_id);

            return new Response(JSON.stringify({ success: true, status: "cancelled" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
          }

          // Check connection
          try {
            const statusResp = await fetch(
              `${Deno.env.get("EVOLUTION_API_URL")}/instance/connectionState/${instance.instance_name}`,
              { headers: { apikey: Deno.env.get("EVOLUTION_API_KEY")! } }
            );
            const statusData = await statusResp.json();
            if (statusData?.instance?.state !== "open") {
              // Pause and wait for reconnection
              await supabase.from("campaign_jobs").update({
                status: "paused",
                current_contact: "⚠️ Aguardando reconexão...",
                updated_at: new Date().toISOString(),
              }).eq("id", job_id);

              let reconnected = false;
              for (let retry = 0; retry < 30; retry++) {
                await new Promise((r) => setTimeout(r, 10000));
                try {
                  const retryResp = await fetch(
                    `${Deno.env.get("EVOLUTION_API_URL")}/instance/connectionState/${instance.instance_name}`,
                    { headers: { apikey: Deno.env.get("EVOLUTION_API_KEY")! } }
                  );
                  const retryData = await retryResp.json();
                  if (retryData?.instance?.state === "open") {
                    reconnected = true;
                    break;
                  }
                } catch {}
              }

              if (!reconnected) {
                await supabase.from("campaign_jobs").update({
                  status: "failed",
                  current_contact: "Conexão perdida",
                  processed_offset: i,
                  sent_count: sentCount,
                  failed_count: failedCount,
                  updated_at: new Date().toISOString(),
                }).eq("id", job_id);
                await supabase.from("whatsapp_campaigns").update({ sent_count: sentCount, failed_count: failedCount }).eq("id", job.campaign_id);
                return new Response(JSON.stringify({ error: "Connection lost" }), { status: 500, headers: corsHeaders });
              }

              await supabase.from("campaign_jobs").update({ status: "running", updated_at: new Date().toISOString() }).eq("id", job_id);
            }
          } catch {}
        }

        // Night pause check
        if (config.night_pause_enabled && isNightTime(config.night_pause_start, config.night_pause_end)) {
          await supabase.from("campaign_jobs").update({
            status: "paused",
            current_contact: `Pausa noturna (${config.night_pause_start}h-${config.night_pause_end}h)`,
            processed_offset: i,
            sent_count: sentCount,
            failed_count: failedCount,
            updated_at: new Date().toISOString(),
          }).eq("id", job_id);

          // Wait until night ends (check every 60s)
          while (isNightTime(config.night_pause_start, config.night_pause_end)) {
            await new Promise((r) => setTimeout(r, 60000));
          }

          await supabase.from("campaign_jobs").update({ status: "running", updated_at: new Date().toISOString() }).eq("id", job_id);
        }

        const contact = contacts[i];
        const formattedPhone = formatPhoneNumber(contact.phone);

        // Apply variable mappings
        let resolvedMessage = config.message_body;
        for (const mapping of config.variable_mappings || []) {
          let value = "";
          switch (mapping.source) {
            case "name": value = contact.name || ""; break;
            case "phone": value = contact.phone || ""; break;
            case "email": value = contact.email || ""; break;
            case "custom": value = mapping.customValue || ""; break;
          }
          resolvedMessage = resolvedMessage.split(mapping.variable).join(value);
        }

        // Update current contact
        await supabase.from("campaign_jobs").update({
          current_contact: contact.name || contact.phone,
          updated_at: new Date().toISOString(),
        }).eq("id", job_id);

        // Send message
        try {
          const res = await fetch(
            `${Deno.env.get("EVOLUTION_API_URL")}/message/sendText/${instance.instance_name}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json", apikey: Deno.env.get("EVOLUTION_API_KEY")! },
              body: JSON.stringify({ number: formattedPhone, text: resolvedMessage }),
            }
          );
          const data = await res.json();
          const status = res.ok ? "sent" : "failed";

          if (res.ok) sentCount++;
          else failedCount++;

          // Record result
          await supabase.from("campaign_results").insert({
            user_id: job.user_id,
            campaign_id: job.campaign_id,
            campaign_name: job.campaign_name || null,
            channel_type: "whatsapp",
            contact_phone: formattedPhone,
            contact_name: contact.name,
            message_content: resolvedMessage,
            status,
            raw_payload: {
              provider: "evolution",
              instance: instance.instance_name,
              message_id: data.key?.id || null,
              error: !res.ok ? data : null,
            },
            created_at: new Date().toISOString(),
          });
        } catch (err) {
          console.error("Send error:", err);
          failedCount++;
        }

        // Update progress
        await supabase.from("campaign_jobs").update({
          processed_offset: i + 1,
          sent_count: sentCount,
          failed_count: failedCount,
          updated_at: new Date().toISOString(),
        }).eq("id", job_id);

        // Delay before next message
        if (i < contacts.length - 1) {
          const delay = getRandomDelay(
            i,
            config.delay_min_ms,
            config.delay_max_ms,
            config.warmup_enabled,
            config.warmup_messages,
            config.warmup_max_delay_ms
          );
          await new Promise((r) => setTimeout(r, delay));
        }
      }

      // Mark complete
      await supabase.from("campaign_jobs").update({
        status: "completed",
        processed_offset: contacts.length,
        sent_count: sentCount,
        failed_count: failedCount,
        current_contact: "",
        updated_at: new Date().toISOString(),
      }).eq("id", job_id);

      // Update campaign stats
      await supabase.from("whatsapp_campaigns").update({
        sent_count: sentCount,
        failed_count: failedCount,
      }).eq("id", job.campaign_id);

      return new Response(JSON.stringify({ success: true, status: "completed", sentCount, failedCount }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), { status: 400, headers: corsHeaders });
  } catch (error) {
    console.error("evolution-send-campaign error:", error);
    return new Response(JSON.stringify({ error: "Internal error" }), { status: 500, headers: corsHeaders });
  }
});
