'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  LayoutDashboard,
  Receipt,
  BarChart3,
  Settings,
  LogOut,
  Wallet,
  ShieldCheck,
  Shield,
  Github,
} from 'lucide-react';
import { useAuth } from '@/components/providers/auth-provider';
import { useSettings } from '@/components/providers/settings-provider';
import { createSupabaseClient } from '@/lib/supabase';
import { toast } from 'sonner';

const menuItems = [
  {
    title: 'Dashboard',
    icon: LayoutDashboard,
    href: '/dashboard',
  },
  {
    title: 'Faturalar',
    icon: Receipt,
    href: '/dashboard/invoices',
  },
  {
    title: 'İstatistikler',
    icon: BarChart3,
    href: '/dashboard/stats',
  },
  {
    title: 'Ayarlar',
    icon: Settings,
    href: '/dashboard/settings',
  },
];

export const Sidebar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAdmin } = useAuth();
  const { settings } = useSettings();

  const handleLogout = async () => {
    try {
      const supabase = createSupabaseClient();
      await supabase.auth.signOut();
      toast.success('Çıkış yapıldı');
      router.push('/login');
      router.refresh();
    } catch (error) {
      toast.error('Çıkış yapılırken bir hata oluştu');
    }
  };

  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-card border-r border-border flex flex-col">
      {/* Logo */}
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
          <Wallet className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold">{settings.siteName}</h1>
          <p className="text-xs text-muted-foreground">Fatura Takip</p>
        </div>
      </div>

      <Separator />

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');

          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant={isActive ? 'secondary' : 'ghost'}
                className={cn(
                  'w-full justify-start gap-3',
                  isActive && 'bg-primary/10 text-primary hover:bg-primary/20'
                )}
              >
                <Icon className="w-5 h-5" />
                {item.title}
              </Button>
            </Link>
          );
        })}

        {isAdmin && (
          <>
            <Separator className="my-4" />
            <div className="space-y-2">
              <div className="px-3 py-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Admin
                </p>
              </div>
              <Link href="/dashboard/admin">
                <Button
                  variant={pathname === '/dashboard/admin' ? 'secondary' : 'ghost'}
                  className={cn(
                    'w-full justify-start gap-3',
                    pathname === '/dashboard/admin' && 'bg-primary/10 text-primary hover:bg-primary/20'
                  )}
                >
                  <ShieldCheck className="w-5 h-5" />
                  Admin Panel
                </Button>
              </Link>
              <Link href="/dashboard/admin/settings">
                <Button
                  variant={pathname?.startsWith('/dashboard/admin/settings') ? 'secondary' : 'ghost'}
                  className={cn(
                    'w-full justify-start gap-3',
                    pathname?.startsWith('/dashboard/admin/settings') && 'bg-primary/10 text-primary hover:bg-primary/20'
                  )}
                >
                  <Shield className="w-5 h-5" />
                  Site Ayarları
                </Button>
              </Link>
            </div>
          </>
        )}
      </nav>

      <Separator />

      {/* User Section */}
      <div className="p-4 space-y-2">
        <div className="flex items-center gap-3 p-2 rounded-lg bg-secondary/50">
          <Avatar className="w-10 h-10">
            <AvatarFallback className="bg-primary/20 text-primary">
              {user?.email ? getInitials(user.email) : 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.email}</p>
            {isAdmin && (
              <p className="text-xs text-primary font-medium">Admin</p>
            )}
          </div>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={handleLogout}
        >
          <LogOut className="w-5 h-5" />
          Çıkış Yap
        </Button>
      </div>

      <Separator />

      {/* Open Source Badge */}
      <div className="p-4">
        <a
          href="https://github.com/unkownpr/OCR-Finance"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 p-3 rounded-lg border border-border hover:bg-secondary/50 transition-colors group"
        >
          <Github className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          <div className="text-center">
            <p className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">
              Open Source
            </p>
            <p className="text-[10px] text-muted-foreground/70">
              GitHub'da görüntüle
            </p>
          </div>
        </a>
      </div>
    </aside>
  );
};

