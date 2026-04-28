const SUPABASE_URL = "https://zxbmtdjoqxhmououhhyl.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_52fPPkhRzl75d1wXZ1x3PA_dcLbOQuC";

const fixflowSupabase =
  window.supabase && window.supabase.createClient
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)
    : null;
