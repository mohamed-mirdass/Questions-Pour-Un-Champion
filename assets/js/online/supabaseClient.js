// assets/js/online/supabaseClient.js
// Client ديال Supabase — يتشارجا عبر <script type="module">
// ملاحظة: هاد الـ key هو "publishable key"، مصمم باش يكون بان فالفرونت (زي Firebase config).
// السيكيوريتي الحقيقي كيتدار بـ RLS policies فالـ Supabase dashboard.

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://rgyxqjuhqccgulnvatif.supabase.co';
const SUPABASE_KEY = 'sb_publishable_PSltHWHUi9--DGekdCA1cw_7aBdysZv';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
