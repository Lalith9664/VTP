import axios from 'axios';
import { supabase } from './supabase';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL || 'https://placeholder-backend.onrender.com',
  headers: { 'Content-Type': 'application/json' }
});

// Automatically inject the Supabase token for authentication if available
api.interceptors.request.use(async (config) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
    }
  } catch (error) {
    // Silently proceed if Supabase configuration is mock/placeholder
    console.warn("Supabase token resolution bypassed:", error);
  }
  return config;
});

export default api;
