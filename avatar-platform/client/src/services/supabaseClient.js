import { createClient } from "@supabase/supabase-js";



// Get Supabase URL and anon key from environment variables
const supabaseUrl = `https://ounrkstfnbgtpydwlpww.supabase.co`; //process.env.SUPABASE_URL;
const supabaseAnonKey = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im91bnJrc3RmbmJndHB5ZHdscHd3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQzNTU4NTMsImV4cCI6MjA1OTkzMTg1M30.omioO3UEQXS_hb4Lnl8bw931qrCl2hA3aA1a_MO3x7E`//process.env.SUPABASE_ANON_KEY;

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Export types
export const TABLES = {
  USERS: "users",
  PROFILES: "profiles",
  CONTRACTS: "contracts",
  DELIVERABLES: "deliverables",
  MATCHES: "matches",
  CHAT_MESSAGES: "chat_messages",
  PRESENTATIONS: "presentations",
};

// Table schemas for reference
/*
USERS (managed by Supabase Auth)
- id (UUID)
- email (string)
- created_at (timestamp)
- user_type (string) 'investor' or 'freelancer'

PROFILES
- id (UUID, references users.id)
- name (string)
- bio (text)
- profile_image (string, URL)
- wallet_address (string)
- skills (array) [for freelancers]
- industries (array) [for investors]
- experience (json)
- education (json)
- portfolio (json)
- created_at (timestamp)
- updated_at (timestamp)

CONTRACTS
- id (UUID)
- investor_id (UUID, references users.id)
- freelancer_id (UUID, references users.id)
- title (string)
- description (text)
- terms (text)
- value (numeric)
- status (string) 'draft', 'pending', 'active', 'completed', 'cancelled'
- smart_contract_address (string)
- transaction_hash (string)
- created_at (timestamp)
- updated_at (timestamp)
- completed_at (timestamp)

DELIVERABLES
- id (UUID)
- contract_id (UUID, references contracts.id)
- title (string)
- description (text)
- file_url (string)
- status (string) 'pending', 'approved', 'rejected'
- created_at (timestamp)
- updated_at (timestamp)

MATCHES
- id (UUID)
- investor_id (UUID, references users.id)
- freelancer_id (UUID, references users.id)
- status (string) 'pending', 'accepted', 'declined'
- created_at (timestamp)
- updated_at (timestamp)

CHAT_MESSAGES
- id (UUID)
- sender_id (UUID, references users.id)
- receiver_id (UUID, references users.id)
- message (text)
- read (boolean)
- created_at (timestamp)

PRESENTATIONS
- id (UUID)
- user_id (UUID, references users.id)
- title (string)
- description (text)
- content (json)
- thumbnail (string, URL)
- file_url (string, URL)
- created_at (timestamp)
- updated_at (timestamp)
*/
