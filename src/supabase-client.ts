import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://bdyvsejyqrpdkhsfydzj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJkeXZzZWp5cXJwZGtoc2Z5ZHpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyMjM0NDAsImV4cCI6MjA5Mzc5OTQ0MH0.ZKVZ2wzP1lD6slB-hmjwB0U6FF5yaUPCUw2KxmyvKXE';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
