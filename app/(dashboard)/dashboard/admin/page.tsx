'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { createSupabaseClient } from '@/lib/supabase';
import { useAuth } from '@/components/providers/auth-provider';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  ShieldCheck,
  Users,
  Receipt,
  TrendingUp,
  TrendingDown,
  AlertCircle,
} from 'lucide-react';

interface UserWithStats {
  id: string;
  email: string;
  full_name: string | null;
  is_admin: boolean;
  created_at: string;
  invoice_count: number;
  total_income: number;
  total_expense: number;
}

interface SystemStats {
  totalUsers: number;
  totalInvoices: number;
  totalIncome: number;
  totalExpense: number;
}

export default function AdminPage() {
  const router = useRouter();
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<UserWithStats[]>([]);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.push('/dashboard');
    }
  }, [isAdmin, authLoading, router]);

  useEffect(() => {
    if (!user || !isAdmin) return;

    const fetchAdminData = async () => {
      try {
        const supabase = createSupabaseClient();

        // Kullanıcıları ve istatistiklerini çek
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('*')
          .order('created_at', { ascending: false });

        if (usersError) throw usersError;

        // Her kullanıcı için fatura istatistiklerini çek
        const usersWithStats = await Promise.all(
          (usersData || []).map(async (userData) => {
            const { data: invoices } = await supabase
              .from('invoices')
              .select('amount, type')
              .eq('user_id', userData.id);

            const invoiceCount = invoices?.length || 0;
            const totalIncome = invoices
              ?.filter((inv) => inv.type === 'income')
              .reduce((sum, inv) => sum + Number(inv.amount), 0) || 0;
            const totalExpense = invoices
              ?.filter((inv) => inv.type === 'expense')
              .reduce((sum, inv) => sum + Number(inv.amount), 0) || 0;

            return {
              ...userData,
              invoice_count: invoiceCount,
              total_income: totalIncome,
              total_expense: totalExpense,
            };
          })
        );

        setUsers(usersWithStats);

        // Sistem istatistikleri
        const { data: allInvoices } = await supabase
          .from('invoices')
          .select('amount, type');

        const systemStats: SystemStats = {
          totalUsers: usersWithStats.length,
          totalInvoices: allInvoices?.length || 0,
          totalIncome: allInvoices
            ?.filter((inv) => inv.type === 'income')
            .reduce((sum, inv) => sum + Number(inv.amount), 0) || 0,
          totalExpense: allInvoices
            ?.filter((inv) => inv.type === 'expense')
            .reduce((sum, inv) => sum + Number(inv.amount), 0) || 0,
        };

        setStats(systemStats);
      } catch (error) {
        console.error('Error fetching admin data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, [user, isAdmin]);

  if (authLoading || loading) {
    return <AdminPageSkeleton />;
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
          <ShieldCheck className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Admin Panel</h1>
          <p className="text-muted-foreground mt-1">
            Sistem geneli istatistikler ve kullanıcı yönetimi
          </p>
        </div>
      </div>

      {/* Sistem İstatistikleri */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-primary/20 bg-gradient-to-br from-card to-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="w-4 h-4" />
              Toplam Kullanıcı
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{stats?.totalUsers || 0}</div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Receipt className="w-4 h-4" />
              Toplam Fatura
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.totalInvoices || 0}</div>
          </CardContent>
        </Card>

        <Card className="border-green-500/20 bg-gradient-to-br from-card to-green-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-500" />
              Toplam Gelir
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {formatCurrency(stats?.totalIncome || 0)}
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-500/20 bg-gradient-to-br from-card to-red-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-red-500" />
              Toplam Gider
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {formatCurrency(stats?.totalExpense || 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Kullanıcı Listesi */}
      <Card>
        <CardHeader>
          <CardTitle>Tüm Kullanıcılar</CardTitle>
          <CardDescription>
            Sistemdeki tüm kullanıcılar ve istatistikleri
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {users.map((userData) => (
              <div
                key={userData.id}
                className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-card hover:bg-secondary/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <Avatar className="w-12 h-12">
                    <AvatarFallback className="bg-primary/20 text-primary font-bold">
                      {userData.email.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{userData.email}</p>
                      {userData.is_admin && (
                        <Badge variant="default" className="gap-1">
                          <ShieldCheck className="w-3 h-3" />
                          Admin
                        </Badge>
                      )}
                    </div>
                    {userData.full_name && (
                      <p className="text-sm text-muted-foreground">{userData.full_name}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      Kayıt: {formatDate(userData.created_at)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-6 text-right">
                  <div>
                    <p className="text-xs text-muted-foreground">Fatura</p>
                    <p className="text-lg font-bold">{userData.invoice_count}</p>
                  </div>
                  <div>
                    <p className="text-xs text-green-500">Gelir</p>
                    <p className="text-sm font-bold text-green-500">
                      {formatCurrency(userData.total_income)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-red-500">Gider</p>
                    <p className="text-sm font-bold text-red-500">
                      {formatCurrency(userData.total_expense)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Admin Uyarısı */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-primary" />
            <CardTitle className="text-primary">Admin Bilgilendirme</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {process.env.NEXT_PUBLIC_ADMIN_EMAIL} e-posta adresine sahip kullanıcılar otomatik olarak admin yetkisi alır.
            Admin kullanıcılar tüm sistem verilerine erişebilir ve kullanıcı istatistiklerini görüntüleyebilir.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

const AdminPageSkeleton = () => {
  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center gap-3">
        <Skeleton className="w-12 h-12 rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-4 w-96" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-9 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

