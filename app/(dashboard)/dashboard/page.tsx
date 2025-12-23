'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { createSupabaseClient } from '@/lib/supabase';
import { useAuth } from '@/components/providers/auth-provider';
import { useSettings } from '@/components/providers/settings-provider';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Receipt,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import Link from 'next/link';
import type { Invoice, InvoiceStats } from '@/types/invoice';

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const { settings } = useSettings();
  const [stats, setStats] = useState<InvoiceStats | null>(null);
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  // Title'ı güncelle
  useEffect(() => {
    document.title = `Dashboard - ${settings.siteName}`;
  }, [settings.siteName]);

  // Debug: Kullanıcı durumunu logla
  useEffect(() => {
    console.log('Dashboard - User state:', {
      user: user ? { id: user.id, email: user.email } : null,
      authLoading,
      loading,
    });
  }, [user, authLoading, loading]);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchDashboardData = async () => {
      try {
        const supabase = createSupabaseClient();

        // Auth kontrolü
        const { data: { session }, error: authError } = await supabase.auth.getSession();
        if (authError) {
          console.error('Auth error:', authError.message || authError);
          throw new Error(`Auth hatası: ${authError.message || 'Bilinmeyen hata'}`);
        }

        if (!session) {
          console.error('No active session for user:', user.id);
          throw new Error('Oturum bulunamadı. Lütfen tekrar giriş yapın.');
        }

        // Tüm faturaları çek
        const { data: invoices, error } = await supabase
          .from('invoices')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: false });

        if (error) {
          console.error('Supabase query error:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
          });
          throw new Error(`Veri çekme hatası: ${error.message || 'Bilinmeyen hata'}`);
        }

        // İstatistikleri hesapla
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const totalIncome = invoices
          ?.filter((inv) => inv.type === 'income')
          .reduce((sum, inv) => sum + Number(inv.amount), 0) || 0;

        const totalExpense = invoices
          ?.filter((inv) => inv.type === 'expense')
          .reduce((sum, inv) => sum + Number(inv.amount), 0) || 0;

        const monthlyIncome = invoices
          ?.filter((inv) => {
            const date = new Date(inv.date);
            return (
              inv.type === 'income' &&
              date.getMonth() === currentMonth &&
              date.getFullYear() === currentYear
            );
          })
          .reduce((sum, inv) => sum + Number(inv.amount), 0) || 0;

        const monthlyExpense = invoices
          ?.filter((inv) => {
            const date = new Date(inv.date);
            return (
              inv.type === 'expense' &&
              date.getMonth() === currentMonth &&
              date.getFullYear() === currentYear
            );
          })
          .reduce((sum, inv) => sum + Number(inv.amount), 0) || 0;

        setStats({
          totalIncome,
          totalExpense,
          balance: totalIncome - totalExpense,
          monthlyIncome,
          monthlyExpense,
          monthlyBalance: monthlyIncome - monthlyExpense,
        });

        // Son 5 faturayı al
        setRecentInvoices(invoices?.slice(0, 5) || []);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toast.error('Veriler yüklenirken bir hata oluştu', {
          description: error instanceof Error ? error.message : 'Lütfen sayfayı yenileyin',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  // Auth loading veya data loading bekle
  if (authLoading || loading) {
    return <DashboardSkeleton />;
  }

  // Kullanıcı yoksa (auth provider yüklendi ama user yok)
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="p-8 text-center">
          <CardTitle className="mb-4">Giriş Yapmanız Gerekiyor</CardTitle>
          <CardDescription className="mb-6">
            Dashboard'a erişmek için lütfen giriş yapın.
          </CardDescription>
          <Link href="/login">
            <Button>Giriş Yap</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold">{settings.siteName} - Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            {settings.siteDescription}
          </p>
        </div>
        <Link href="/dashboard/invoices/new">
          <Button size="lg" className="gap-2">
            <Plus className="w-5 h-5" />
            Yeni Fatura
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-border/50 bg-gradient-to-br from-card to-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Wallet className="w-4 h-4" />
              Toplam Bakiye
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              {formatCurrency(stats?.balance || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Tüm zamanlar
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-gradient-to-br from-card to-green-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Toplam Gelir
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-500">
              {formatCurrency(stats?.totalIncome || 0)}
            </div>
            <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
              <ArrowUpRight className="w-3 h-3 text-green-500" />
              Bu ay: {formatCurrency(stats?.monthlyIncome || 0)}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-gradient-to-br from-card to-red-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingDown className="w-4 h-4" />
              Toplam Gider
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-500">
              {formatCurrency(stats?.totalExpense || 0)}
            </div>
            <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
              <ArrowDownRight className="w-3 h-3 text-red-500" />
              Bu ay: {formatCurrency(stats?.monthlyExpense || 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Invoices */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Son Faturalar</CardTitle>
              <CardDescription>Son eklenen 5 fatura</CardDescription>
            </div>
            <Link href="/dashboard/invoices">
              <Button variant="ghost" size="sm">
                Tümünü Gör
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {recentInvoices.length === 0 ? (
            <div className="text-center py-12">
              <Receipt className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">Henüz fatura eklenmemiş</p>
              <Link href="/dashboard/invoices/new">
                <Button variant="outline" className="mt-4">
                  İlk Faturanı Ekle
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {recentInvoices.map((invoice) => (
                <Link
                  key={invoice.id}
                  href={`/dashboard/invoices/${invoice.id}`}
                  className="flex items-center justify-between p-4 rounded-lg border border-border/50 hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        invoice.type === 'income'
                          ? 'bg-green-500/10 text-green-500'
                          : 'bg-red-500/10 text-red-500'
                      }`}
                    >
                      {invoice.type === 'income' ? (
                        <ArrowUpRight className="w-5 h-5" />
                      ) : (
                        <ArrowDownRight className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{invoice.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {invoice.category} • {new Date(invoice.date).toLocaleDateString('tr-TR')}
                      </p>
                    </div>
                  </div>
                  <div
                    className={`text-lg font-bold ${
                      invoice.type === 'income' ? 'text-green-500' : 'text-red-500'
                    }`}
                  >
                    {invoice.type === 'income' ? '+' : '-'}
                    {formatCurrency(Number(invoice.amount))}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

const DashboardSkeleton = () => {
  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-11 w-32" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-9 w-40" />
              <Skeleton className="h-3 w-24 mt-2" />
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
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

