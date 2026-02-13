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

/** Fire-and-forget self-invoke with retry */
function selfInvoke(supabaseUrl: string, serviceKey: string, jobId: string, delayMs = 0) {
  const fnUrl = `${supabaseUrl}/functions/v1/evolution-send-campaign`;
  const doInvoke = () => {
    fetch(fnUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${serviceKey}` },
      body: JSON.stringify({ action: "process", job_id: jobId }),
    }).catch((e) => {
      console.error("Self-invoke failed, retrying in 5s:", e);
      setTimeout(() => {
        fetch(fnUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${serviceKey}` },
          body: JSON.stringify({ action: "process", job_id: jobId }),
        }).catch((e2) => console.error("Self-invoke retry also failed:", e2));
      }, 5000);
    });
  };

  if (delayMs > 0) setTimeout(doInvoke, delayMs);
  else doInvoke();
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

      selfInvoke(supabaseUrl, serviceKey, job.id);

      return new Response(JSON.stringify({ success: true, job_id: job.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── PROCESS ───
    if (action === "process") {
      const { job_id } = body;
      const startTime = Date.now();
      const MAX_RUNTIME_MS = 45000; // 45s safe budget

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

      // ── Night pause: don't block, just mark paused and schedule re-invoke ──
      if (config.night_pause_enabled && isNightTime(config.night_pause_start, config.night_pause_end)) {
        await supabase.from("campaign_jobs").update({
          status: "paused",
          current_contact: `⏸ Pausa noturna (${config.night_pause_start}h-${config.night_pause_end}h)`,
          updated_at: new Date().toISOString(),
        }).eq("id", job_id);

        // Re-invoke in 5 minutes to check again (non-blocking)
        selfInvoke(supabaseUrl, serviceKey, job_id, 300_000);
        return new Response(JSON.stringify({ success: true, status: "paused_night" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // If was paused, resume
      if (job.status === "paused") {
        await supabase.from("campaign_jobs").update({ status: "running", updated_at: new Date().toISOString() }).eq("id", job_id);
      }

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

      // Batch results for bulk insert
      const resultsBatch: any[] = [];

      for (let i = offset; i < contacts.length; i++) {
        // ── Time budget check ──
        if (Date.now() - startTime > MAX_RUNTIME_MS) {
          // Flush pending results
          if (resultsBatch.length > 0) {
            await supabase.from("campaign_results").insert(resultsBatch);
            resultsBatch.length = 0;
          }

          await supabase.from("campaign_jobs").update({
            processed_offset: i,
            sent_count: sentCount,
            failed_count: failedCount,
            current_contact: "",
            updated_at: new Date().toISOString(),
          }).eq("id", job_id);

          selfInvoke(supabaseUrl, serviceKey, job_id);
          return new Response(JSON.stringify({ success: true, continuing: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        // ── Every 10 messages: check cancellation + connection ──
        if (i > offset && i % 10 === 0) {
          // Flush batch every 10 messages
          if (resultsBatch.length > 0) {
            await supabase.from("campaign_results").insert(resultsBatch);
            resultsBatch.length = 0;
          }

          const { data: checkJob } = await supabase.from("campaign_jobs").select("status").eq("id", job_id).single();
          if (checkJob?.status === "cancelled") {
            await supabase.from("campaign_jobs").update({
              processed_offset: i, sent_count: sentCount, failed_count: failedCount,
              current_contact: "", updated_at: new Date().toISOString(),
            }).eq("id", job_id);
            await supabase.from("whatsapp_campaigns").update({ sent_count: sentCount, failed_count: failedCount }).eq("id", job.campaign_id);
            return new Response(JSON.stringify({ success: true, status: "cancelled" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
          }

          // ── Connection check: don't block with retries, just pause and re-invoke later ──
          try {
            const statusResp = await fetch(
              `${Deno.env.get("EVOLUTION_API_URL")}/instance/connectionState/${instance.instance_name}`,
              { headers: { apikey: Deno.env.get("EVOLUTION_API_KEY")! } }
            );
            const statusData = await statusResp.json();
            if (statusData?.instance?.state !== "open") {
              await supabase.from("campaign_jobs").update({
                status: "paused",
                current_contact: "⚠️ Aguardando reconexão...",
                processed_offset: i,
                sent_count: sentCount,
                failed_count: failedCount,
                updated_at: new Date().toISOString(),
              }).eq("id", job_id);

              // Re-invoke in 30s to check if reconnected
              selfInvoke(supabaseUrl, serviceKey, job_id, 30_000);
              return new Response(JSON.stringify({ success: true, status: "paused_disconnected" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
            }
          } catch {}

          // ── Night pause mid-loop check ──
          if (config.night_pause_enabled && isNightTime(config.night_pause_start, config.night_pause_end)) {
            await supabase.from("campaign_jobs").update({
              status: "paused",
              current_contact: `⏸ Pausa noturna (${config.night_pause_start}h-${config.night_pause_end}h)`,
              processed_offset: i,
              sent_count: sentCount,
              failed_count: failedCount,
              updated_at: new Date().toISOString(),
            }).eq("id", job_id);
            selfInvoke(supabaseUrl, serviceKey, job_id, 300_000);
            return new Response(JSON.stringify({ success: true, status: "paused_night" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
          }
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

        // Update progress (combined: current_contact + counts, every message)
        await supabase.from("campaign_jobs").update({
          current_contact: contact.name || contact.phone,
          processed_offset: i,
          sent_count: sentCount,
          failed_count: failedCount,
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

          // Queue result for batch insert
          resultsBatch.push({
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

        // Delay before next message
        if (i < contacts.length - 1) {
          const delay = getRandomDelay(
            i, config.delay_min_ms, config.delay_max_ms,
            config.warmup_enabled, config.warmup_messages, config.warmup_max_delay_ms
          );
          await new Promise((r) => setTimeout(r, delay));
        }
      }

      // Flush remaining results
      if (resultsBatch.length > 0) {
        await supabase.from("campaign_results").insert(resultsBatch);
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
