import { createBrowserClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

// Server-side veya basit kullanım için
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);

// Client component'lerde kullanım için - Session persistence ile
export const createSupabaseClient = () => {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          if (typeof document === 'undefined') return undefined;
          const value = document.cookie
            .split('; ')
            .find((row) => row.startsWith(`${name}=`))
            ?.split('=')[1];
          return value ? decodeURIComponent(value) : undefined;
        },
        set(name: string, value: string, options: any) {
          if (typeof document === 'undefined') return;
          const cookieOptions = [
            `${name}=${encodeURIComponent(value)}`,
            `path=${options.path || '/'}`,
            `max-age=${options.maxAge || 31536000}`, // 1 year default
            options.domain ? `domain=${options.domain}` : '',
            options.sameSite ? `samesite=${options.sameSite}` : 'samesite=lax',
            options.secure ? 'secure' : '',
          ]
            .filter(Boolean)
            .join('; ');
          document.cookie = cookieOptions;
        },
        remove(name: string, options: any) {
          if (typeof document === 'undefined') return;
          document.cookie = `${name}=; path=${options.path || '/'}; max-age=0`;
        },
      },
    }
  );
};

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          is_admin: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          is_admin?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          is_admin?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      invoices: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          amount: number;
          type: 'income' | 'expense';
          category: string;
          date: string;
          image_url: string | null;
          ocr_text: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          amount: number;
          type: 'income' | 'expense';
          category: string;
          date: string;
          image_url?: string | null;
          ocr_text?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          amount?: number;
          type?: 'income' | 'expense';
          category?: string;
          date?: string;
          image_url?: string | null;
          ocr_text?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};

