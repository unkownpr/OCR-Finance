'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { createSupabaseClient } from '@/lib/supabase';
import { useAuth } from '@/components/providers/auth-provider';
import { toast } from 'sonner';
import {
  User,
  Mail,
  ShieldCheck,
  Save,
  Loader2,
  Smartphone,
  Download,
} from 'lucide-react';

export default function SettingsPage() {
  const { user, isAdmin } = useAuth();
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchUserData = async () => {
      try {
        const supabase = createSupabaseClient();
        const { data } = await supabase
          .from('users')
          .select('full_name')
          .eq('id', user.id)
          .single();

        if (data?.full_name) {
          setFullName(data.full_name);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();

    // PWA Install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    try {
      const supabase = createSupabaseClient();
      const { error } = await supabase
        .from('users')
        .update({ full_name: fullName })
        .eq('id', user.id);

      if (error) throw error;

      toast.success('Profil güncellendi');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Profil güncellenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleInstallPWA = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      toast.success('Uygulama yüklendi!');
    }

    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Ayarlar</h1>
        <p className="text-muted-foreground mt-1">
          Hesap ayarlarınızı ve tercihlerinizi yönetin
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profil Bilgileri */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Profil Bilgileri</CardTitle>
            <CardDescription>
              Hesap bilgilerinizi görüntüleyin ve güncelleyin
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveProfile} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  E-posta
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="bg-secondary/50"
                />
                <p className="text-xs text-muted-foreground">
                  E-posta adresi değiştirilemez
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullName" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Ad Soyad
                </Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Adınız Soyadınız"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={loading}
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" />
                  Hesap Durumu
                </Label>
                <div className="flex items-center gap-2">
                  {isAdmin ? (
                    <Badge variant="default" className="gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      Admin Hesabı
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Standart Kullanıcı</Badge>
                  )}
                </div>
              </div>

              <Button
                type="submit"
                className="w-full gap-2"
                disabled={loading}
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Kaydediliyor...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Değişiklikleri Kaydet
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Mobil Uygulama */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="w-5 h-5" />
              Mobil Uygulama
            </CardTitle>
            <CardDescription>
              Uygulamayı telefonunuza yükleyin
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
              <p className="text-sm text-muted-foreground mb-4">
                OCR Finance'i mobil cihazınıza yükleyerek uygulama gibi kullanabilirsiniz.
              </p>
              {isInstallable ? (
                <Button
                  onClick={handleInstallPWA}
                  className="w-full gap-2"
                  variant="default"
                >
                  <Download className="w-4 h-4" />
                  Uygulamayı Yükle
                </Button>
              ) : (
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    Uygulama zaten yüklenmiş veya bu tarayıcı PWA desteklemiyor
                  </p>
                </div>
              )}
            </div>

            <Separator />

            <div className="space-y-2 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">Özellikler:</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>Offline çalışma desteği</li>
                <li>Ana ekrana ekleme</li>
                <li>Hızlı erişim</li>
                <li>Bildirim desteği</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Versiyon Bilgisi */}
      <Card className="border-border/50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>OCR Finance v1.0.0</span>
            <span>© 2024 Tüm hakları saklıdır</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

