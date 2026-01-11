import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Call the database function to check and create notifications
    const { data, error } = await supabase.rpc("check_document_expiry_and_notify");

    if (error) {
      console.error("Error checking document expiry:", error);
      throw error;
    }

    console.log(`Created ${data} expiry notifications`);

    // Get list of drivers with expired documents to potentially disable
    const { data: expiredDocs, error: expiredError } = await supabase
      .from("document_expiry_tracking")
      .select(`
        driver_id,
        document_type,
        expiry_date,
        drivers!inner(id, name, status, is_available)
      `)
      .lt("expiry_date", new Date().toISOString().split("T")[0]);

    if (expiredError) {
      console.error("Error fetching expired documents:", error);
    } else if (expiredDocs && expiredDocs.length > 0) {
      // Disable drivers with expired critical documents (license, insurance)
      const driversToDisable = [...new Set(
        expiredDocs
          .filter(doc => doc.document_type === "license" || doc.document_type === "insurance")
          .map(doc => doc.driver_id)
      )];

      if (driversToDisable.length > 0) {
        const { error: updateError } = await supabase
          .from("drivers")
          .update({ 
            is_available: false,
            status: "inactive"
          })
          .in("id", driversToDisable);

        if (updateError) {
          console.error("Error disabling drivers with expired documents:", updateError);
        } else {
          console.log(`Disabled ${driversToDisable.length} drivers with expired documents`);
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        notificationsCreated: data,
        message: `Checked document expiry and created ${data} notifications`
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );
  } catch (error) {
    console.error("Error in check-document-expiry function:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
});