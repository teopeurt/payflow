import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initializeSupabase } from '@payflow/core/integrations/supabase/client';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

initializeSupabase(supabaseUrl, supabaseAnonKey);

createRoot(document.getElementById("root")!).render(<App />);
