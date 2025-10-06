import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://txgznyjujfhavusapeaw.supabase.co';

// IMPORTANT: The anon key from the provided image was partially obscured.
// Please replace the placeholder below with your actual Supabase 'anon public' key
// for the application to connect to your database correctly.
// You can find it in your Supabase project's API settings.
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4Z3pueWp1amZoYXZ1c2FwZWF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2Njc4MzQsImV4cCI6MjA3NTI0MzgzNH0._DGXpSLm_Edzj4Iz8R7dUCaRcmjZfPxKmITZ7tk1Mvc';

export const supabase = createClient(supabaseUrl, supabaseKey);