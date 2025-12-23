'use client';

import { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { User } from '@supabase/supabase-js';
import { createSupabaseClient } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth-store';

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAdmin: false,
  loading: true,
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [loading, setLoading] = useState(true);
  const { user, isAdmin, setUser, setIsAdmin } = useAuthStore();
  
  // Supabase client'ı sadece bir kez oluştur
  const supabase = useMemo(() => createSupabaseClient(), []);

  useEffect(() => {
    const checkUser = async () => {
      try {
        // Önce session'dan kontrol et (daha hızlı)
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          setUser(session.user);
          
          // Admin kontrolü - JWT metadata'dan al (RLS infinite loop'u önlemek için)
          const isAdminFromJWT = (session.user.user_metadata?.is_admin as boolean) || false;
          setIsAdmin(isAdminFromJWT);
          
          // Eğer JWT'de is_admin yoksa, veritabanından al
          if (!isAdminFromJWT) {
            const { data: userData } = await supabase
              .from('users')
              .select('is_admin')
              .eq('id', session.user.id)
              .single();
            
            if (userData) {
              setIsAdmin(userData.is_admin || false);
            }
          }
        } else {
          setUser(null);
          setIsAdmin(false);
        }
      } catch (error) {
        console.error('Error checking user:', error);
        setUser(null);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkUser();

    // Auth state değişikliklerini dinle
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const currentUser = session?.user || null;
        setUser(currentUser);

        if (currentUser) {
          // JWT metadata'dan admin kontrolü
          const isAdminFromJWT = (currentUser.user_metadata?.is_admin as boolean) || false;
          setIsAdmin(isAdminFromJWT);
        } else {
          setIsAdmin(false);
        }
        
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, setUser, setIsAdmin]);

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

