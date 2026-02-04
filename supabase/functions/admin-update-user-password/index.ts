import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    // Create a Supabase client with the user's token
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // First, verify the caller is authenticated and is an admin
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    const { data: { user: callerUser }, error: userError } = await userClient.auth.getUser();
    
    if (userError || !callerUser) {
      console.error("Auth error:", userError);
      throw new Error("Unauthorized");
    }

    // Check if the caller is an admin using the wiki schema
    const { data: roleData, error: roleError } = await userClient
      .schema('wiki')
      .from("user_roles")
      .select("role")
      .eq("user_id", callerUser.id)
      .single();

    if (roleError || roleData?.role !== "admin") {
      console.error("Role check error:", roleError, "Role:", roleData?.role);
      throw new Error("Forbidden: Admin access required");
    }

    // Parse request body
    const { user_id, new_password } = await req.json();

    if (!user_id || !new_password) {
      throw new Error("Missing user_id or new_password");
    }

    if (new_password.length < 6) {
      throw new Error("Password must be at least 6 characters");
    }

    // Use service role client to update the user's password
    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { error: updateError } = await adminClient.auth.admin.updateUserById(
      user_id,
      { password: new_password }
    );

    if (updateError) {
      console.error("Update password error:", updateError);
      throw new Error(`Failed to update password: ${updateError.message}`);
    }

    console.log(`Password updated for user ${user_id} by admin ${callerUser.id}`);

    return new Response(
      JSON.stringify({ success: true, message: "Password updated successfully" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error in admin-update-user-password:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: error.message === "Unauthorized" ? 401 : error.message.includes("Forbidden") ? 403 : 400,
      }
    );
  }
});
