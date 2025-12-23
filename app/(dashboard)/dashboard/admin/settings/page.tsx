'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { createSupabaseClient } from '@/lib/supabase';
import { toast } from 'sonner';
import {
  Settings,
  Palette,
  Users,
  Shield,
  Save,
  Loader2,
  Globe,
  Mail,
  Upload,
  Trash2,
  Edit,
  CheckCircle2,
  XCircle,
  UserCog,
} from 'lucide-react';
import type { SiteSetting, UserWithRole, GeneralSettings, ThemeSettings, SecuritySettings } from '@/types/settings';

import { useSettings } from '@/components/providers/settings-provider';

export default function AdminSettingsPage() {
  const { user, isAdmin } = useAuth();
  const { refreshSettings } = useSettings();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  // Genel Ayarlar
  const [generalSettings, setGeneralSettings] = useState<GeneralSettings>({
    site_name: '',
    site_description: '',
    site_logo: '',
    contact_email: '',
    max_upload_size: 10,
    allowed_file_types: [],
    invoice_categories: [],
    currency: 'TRY',
    date_format: 'DD/MM/YYYY',
    timezone: 'Europe/Istanbul',
  });

  // Tema Ayarları
  const [themeSettings, setThemeSettings] = useState<ThemeSettings>({
    primary_color: '#10B981',
    secondary_color: '#1F3A31',
    accent_color: '#F59E0B',
    success_color: '#22C55E',
    warning_color: '#FB923C',
    error_color: '#EF4444',
    font_family: 'var(--font-geist-sans), Inter, system-ui, sans-serif',
  });

  // Güvenlik Ayarları
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    enable_registration: true,
    require_email_verification: false,
  });

  // Kullanıcılar
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');

  useEffect(() => {
    if (!isAdmin) {
      router.push('/dashboard');
      return;
    }

    fetchAllSettings();
    fetchUsers();
  }, [isAdmin, router]);

  const fetchAllSettings = async () => {
    try {
      const supabase = createSupabaseClient();
      const { data, error } = await supabase
        .from('site_settings')
        .select('*');

      if (error) {
        console.error('Supabase error:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        });
        throw new Error(`Ayarlar çekilemedi: ${error.message}`);
      }

      if (data) {
        // JSONB değerleri Supabase'den zaten parse edilmiş geliyor
        const settingsMap = new Map(
          data.map((s: SiteSetting) => [s.setting_key, s.setting_value])
        );

        // Genel Ayarlar
        setGeneralSettings({
          site_name: settingsMap.get('site_name') || '',
          site_description: settingsMap.get('site_description') || '',
          site_logo: settingsMap.get('site_logo') || '',
          contact_email: settingsMap.get('contact_email') || '',
          max_upload_size: settingsMap.get('max_upload_size') || 10,
          allowed_file_types: settingsMap.get('allowed_file_types') || [],
          invoice_categories: settingsMap.get('invoice_categories') || [],
          currency: settingsMap.get('currency') || 'TRY',
          date_format: settingsMap.get('date_format') || 'DD/MM/YYYY',
          timezone: settingsMap.get('timezone') || 'Europe/Istanbul',
        });

        // Tema Ayarları
        setThemeSettings({
          primary_color: settingsMap.get('primary_color') || '#10B981',
          secondary_color: settingsMap.get('secondary_color') || '#1F3A31',
          accent_color: settingsMap.get('accent_color') || '#F59E0B',
          success_color: settingsMap.get('success_color') || '#22C55E',
          warning_color: settingsMap.get('warning_color') || '#FB923C',
          error_color: settingsMap.get('error_color') || '#EF4444',
          font_family: settingsMap.get('font_family') || 'var(--font-geist-sans), Inter, system-ui, sans-serif',
        });

        // Güvenlik Ayarları
        setSecuritySettings({
          enable_registration: settingsMap.get('enable_registration') || true,
          require_email_verification: settingsMap.get('require_email_verification') || false,
        });
      }
    } catch (error: any) {
      console.error('Ayarlar yüklenirken hata:', error.message || error);
      toast.error('Ayarlar yüklenemedi', {
        description: error instanceof Error ? error.message : 'Lütfen sayfayı yenileyin',
      });
    }
  };

  const fetchUsers = async () => {
    try {
      const supabase = createSupabaseClient();
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setUsers(data);
    } catch (error) {
      console.error('Kullanıcılar yüklenirken hata:', error);
      toast.error('Kullanıcılar yüklenemedi');
    }
  };

  const handleSaveGeneralSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const supabase = createSupabaseClient();
      const updates = [
        { key: 'site_name', value: generalSettings.site_name },
        { key: 'site_description', value: generalSettings.site_description },
        { key: 'site_logo', value: generalSettings.site_logo },
        { key: 'contact_email', value: generalSettings.contact_email },
        { key: 'max_upload_size', value: generalSettings.max_upload_size },
        { key: 'allowed_file_types', value: generalSettings.allowed_file_types },
        { key: 'invoice_categories', value: generalSettings.invoice_categories },
        { key: 'currency', value: generalSettings.currency },
        { key: 'date_format', value: generalSettings.date_format },
        { key: 'timezone', value: generalSettings.timezone },
      ];

      for (const update of updates) {
        const { error } = await supabase
          .from('site_settings')
          .update({ setting_value: update.value })
          .eq('setting_key', update.key);

        if (error) throw error;
      }

      await refreshSettings(); // Ayarları yenile
      toast.success('Genel ayarlar kaydedildi', {
        description: 'Değişiklikler uygulandı',
      });
      await fetchAllSettings(); // Formu güncelle
    } catch (error) {
      console.error('Ayarlar kaydedilirken hata:', error);
      toast.error('Ayarlar kaydedilemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveThemeSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const supabase = createSupabaseClient();
      const updates = [
        { key: 'primary_color', value: themeSettings.primary_color },
        { key: 'secondary_color', value: themeSettings.secondary_color },
        { key: 'accent_color', value: themeSettings.accent_color },
        { key: 'success_color', value: themeSettings.success_color },
        { key: 'warning_color', value: themeSettings.warning_color },
        { key: 'error_color', value: themeSettings.error_color },
        { key: 'font_family', value: themeSettings.font_family },
      ];

      for (const update of updates) {
        const { error } = await supabase
          .from('site_settings')
          .update({ setting_value: update.value })
          .eq('setting_key', update.key);

        if (error) throw error;
      }

      await refreshSettings(); // Ayarları ve renkleri yenile
      toast.success('Tema ayarları kaydedildi', {
        description: 'Renkler güncellendi',
      });
      await fetchAllSettings(); // Formu güncelle
    } catch (error) {
      console.error('Tema ayarları kaydedilirken hata:', error);
      toast.error('Tema ayarları kaydedilemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSecuritySettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const supabase = createSupabaseClient();
      const updates = [
        { key: 'enable_registration', value: securitySettings.enable_registration },
        { key: 'require_email_verification', value: securitySettings.require_email_verification },
      ];

      for (const update of updates) {
        const { error } = await supabase
          .from('site_settings')
          .update({ setting_value: update.value })
          .eq('setting_key', update.key);

        if (error) throw error;
      }

      await refreshSettings(); // Ayarları yenile
      toast.success('Güvenlik ayarları kaydedildi');
      await fetchAllSettings(); // Formu güncelle
    } catch (error) {
      console.error('Güvenlik ayarları kaydedilirken hata:', error);
      toast.error('Güvenlik ayarları kaydedilemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAdmin = async (userId: string, currentStatus: boolean) => {
    try {
      const supabase = createSupabaseClient();
      const { error } = await supabase
        .from('users')
        .update({ is_admin: !currentStatus })
        .eq('id', userId);

      if (error) throw error;

      toast.success(`Kullanıcı yetkisi güncellendi`);
      fetchUsers();
    } catch (error) {
      console.error('Yetki güncellenirken hata:', error);
      toast.error('Yetki güncellenemedi');
    }
  };

  const handleAddCategory = () => {
    if (!newCategory.trim()) {
      toast.error('Kategori adı boş olamaz');
      return;
    }

    if (generalSettings.invoice_categories.includes(newCategory.trim())) {
      toast.error('Bu kategori zaten mevcut');
      return;
    }

    setGeneralSettings({
      ...generalSettings,
      invoice_categories: [...generalSettings.invoice_categories, newCategory.trim()],
    });
    setNewCategory('');
  };

  const handleRemoveCategory = (category: string) => {
    setGeneralSettings({
      ...generalSettings,
      invoice_categories: generalSettings.invoice_categories.filter((c) => c !== category),
    });
    toast.success('Kategori silindi');
  };

  const handleStartEditCategory = (category: string) => {
    setEditingCategory(category);
    setEditingValue(category);
  };

  const handleSaveEditCategory = () => {
    if (!editingValue.trim()) {
      toast.error('Kategori adı boş olamaz');
      return;
    }

    if (editingValue.trim() === editingCategory) {
      // Değişiklik yok
      setEditingCategory(null);
      return;
    }

    if (generalSettings.invoice_categories.includes(editingValue.trim())) {
      toast.error('Bu kategori adı zaten mevcut');
      return;
    }

    setGeneralSettings({
      ...generalSettings,
      invoice_categories: generalSettings.invoice_categories.map((c) =>
        c === editingCategory ? editingValue.trim() : c
      ),
    });
    setEditingCategory(null);
    setEditingValue('');
    toast.success('Kategori güncellendi');
  };

  const handleCancelEditCategory = () => {
    setEditingCategory(null);
    setEditingValue('');
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Settings className="w-8 h-8" />
          Admin Ayarları
        </h1>
        <p className="text-muted-foreground mt-1">
          Site genelinde tüm ayarları buradan yönetin
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto">
          <TabsTrigger value="general" className="gap-2">
            <Globe className="w-4 h-4" />
            Genel
          </TabsTrigger>
          <TabsTrigger value="theme" className="gap-2">
            <Palette className="w-4 h-4" />
            Tema
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2">
            <Users className="w-4 h-4" />
            Kullanıcılar
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="w-4 h-4" />
            Güvenlik
          </TabsTrigger>
        </TabsList>

        {/* Genel Ayarlar */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Genel Site Ayarları</CardTitle>
              <CardDescription>
                Site bilgileri ve genel yapılandırma ayarları
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveGeneralSettings} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="site_name">Site Adı</Label>
                    <Input
                      id="site_name"
                      value={generalSettings.site_name}
                      onChange={(e) => setGeneralSettings({ ...generalSettings, site_name: e.target.value })}
                      placeholder="OCR Finance"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contact_email">İletişim E-postası</Label>
                    <Input
                      id="contact_email"
                      type="email"
                      value={generalSettings.contact_email}
                      onChange={(e) => setGeneralSettings({ ...generalSettings, contact_email: e.target.value })}
                      placeholder="info@ocrfinance.com"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="site_description">Site Açıklaması</Label>
                  <Textarea
                    id="site_description"
                    value={generalSettings.site_description}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, site_description: e.target.value })}
                    placeholder="Fatura ve makbuz yönetim sistemi"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="site_logo">Site Logo URL</Label>
                  <Input
                    id="site_logo"
                    value={generalSettings.site_logo}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, site_logo: e.target.value })}
                    placeholder="https://example.com/logo.png"
                  />
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="currency">Para Birimi</Label>
                    <Input
                      id="currency"
                      value={generalSettings.currency}
                      onChange={(e) => setGeneralSettings({ ...generalSettings, currency: e.target.value })}
                      placeholder="TRY"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="date_format">Tarih Formatı</Label>
                    <Input
                      id="date_format"
                      value={generalSettings.date_format}
                      onChange={(e) => setGeneralSettings({ ...generalSettings, date_format: e.target.value })}
                      placeholder="DD/MM/YYYY"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="max_upload_size">Max. Dosya Boyutu (MB)</Label>
                    <Input
                      id="max_upload_size"
                      type="number"
                      value={generalSettings.max_upload_size}
                      onChange={(e) => setGeneralSettings({ ...generalSettings, max_upload_size: Number(e.target.value) })}
                      min="1"
                      max="100"
                    />
                  </div>
                </div>

                <Separator />

                {/* Kategoriler */}
                <div className="space-y-4">
                  <Label>Fatura Kategorileri</Label>
                  <div className="flex gap-2">
                    <Input
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      placeholder="Yeni kategori ekle..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCategory();
                        }
                      }}
                    />
                    <Button type="button" onClick={handleAddCategory} variant="outline">
                      Ekle
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {generalSettings.invoice_categories.map((category) => (
                      <div key={category}>
                        {editingCategory === category ? (
                          // Edit modu
                          <div className="flex items-center gap-1 bg-secondary rounded-md px-2 py-1">
                            <Input
                              value={editingValue}
                              onChange={(e) => setEditingValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleSaveEditCategory();
                                } else if (e.key === 'Escape') {
                                  handleCancelEditCategory();
                                }
                              }}
                              className="h-7 w-32 text-sm"
                              autoFocus
                            />
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0"
                              onClick={handleSaveEditCategory}
                            >
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0"
                              onClick={handleCancelEditCategory}
                            >
                              <XCircle className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        ) : (
                          // Normal görünüm
                          <Badge variant="secondary" className="gap-2 px-3 py-1.5">
                            {category}
                            <div className="flex items-center gap-1 ml-1">
                              <button
                                type="button"
                                onClick={() => handleStartEditCategory(category)}
                                className="hover:text-primary transition-colors"
                                title="Düzenle"
                              >
                                <Edit className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveCategory(category)}
                                className="hover:text-destructive transition-colors"
                                title="Sil"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    💡 Kategoriye tıklayarak düzenleyebilir, Enter tuşuyla kaydedebilir, ESC tuşuyla iptal edebilirsiniz
                  </p>
                </div>

                <Button type="submit" className="w-full gap-2" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Kaydediliyor...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Ayarları Kaydet
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tema Ayarları */}
        <TabsContent value="theme" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tema ve Renk Ayarları</CardTitle>
              <CardDescription>
                Site teması ve renk paletini özelleştirin
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveThemeSettings} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Object.entries(themeSettings).map(([key, value]) => {
                    if (key === 'font_family') return null;
                    
                    const labels: Record<string, string> = {
                      primary_color: 'Ana Renk',
                      secondary_color: 'İkincil Renk',
                      accent_color: 'Vurgu Rengi',
                      success_color: 'Başarı Rengi',
                      warning_color: 'Uyarı Rengi',
                      error_color: 'Hata Rengi',
                    };

                    const descriptions: Record<string, string> = {
                      primary_color: 'Butonlar, linkler ve ana vurgular',
                      secondary_color: 'İkincil butonlar ve arka planlar',
                      accent_color: 'Focus ring ve vurgu alanları',
                      success_color: 'Başarı mesajları ve ikonlar',
                      warning_color: 'Uyarı mesajları ve dikkat alanları',
                      error_color: 'Hata mesajları ve destructive butonlar',
                    };

                    return (
                      <div key={key} className="space-y-2">
                        <Label htmlFor={key} className="flex items-center justify-between">
                          <span>{labels[key]}</span>
                          <div 
                            className="w-6 h-6 rounded-full border-2 border-border shadow-sm"
                            style={{ backgroundColor: value }}
                            title="Renk önizleme"
                          />
                        </Label>
                        <div className="flex gap-2">
                          <Input
                            id={key}
                            type="color"
                            value={value}
                            onChange={(e) => setThemeSettings({ ...themeSettings, [key]: e.target.value })}
                            className="w-20 h-10 cursor-pointer"
                          />
                          <Input
                            value={value}
                            onChange={(e) => setThemeSettings({ ...themeSettings, [key]: e.target.value })}
                            placeholder="#000000"
                            className="flex-1 font-mono"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {descriptions[key]}
                        </p>
                      </div>
                    );
                  })}
                </div>

                <Separator />

                {/* Renk Önizlemesi */}
                <div className="space-y-3">
                  <Label>Renk Önizlemesi</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <Button 
                      type="button"
                      style={{ 
                        backgroundColor: themeSettings.primary_color,
                        color: 'white'
                      }}
                    >
                      Ana Buton
                    </Button>
                    <Button 
                      type="button"
                      variant="secondary"
                      style={{ 
                        backgroundColor: themeSettings.secondary_color,
                        color: 'white'
                      }}
                    >
                      İkincil Buton
                    </Button>
                    <Badge 
                      style={{ 
                        backgroundColor: themeSettings.success_color,
                        color: 'white'
                      }}
                    >
                      Başarılı
                    </Badge>
                    <Badge 
                      style={{ 
                        backgroundColor: themeSettings.warning_color,
                        color: 'white'
                      }}
                    >
                      Uyarı
                    </Badge>
                    <Badge 
                      style={{ 
                        backgroundColor: themeSettings.error_color,
                        color: 'white'
                      }}
                    >
                      Hata
                    </Badge>
                    <Badge 
                      style={{ 
                        backgroundColor: themeSettings.accent_color,
                        color: 'white'
                      }}
                    >
                      Vurgu
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    💡 Renkleri kaydettiğinizde tüm sistem bu renklerle güncellenecektir
                  </p>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="font_family">Font Ailesi</Label>
                  <Input
                    id="font_family"
                    value={themeSettings.font_family}
                    onChange={(e) => setThemeSettings({ ...themeSettings, font_family: e.target.value })}
                    placeholder="Inter, system-ui, sans-serif"
                  />
                </div>

                <Button type="submit" className="w-full gap-2" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Kaydediliyor...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Tema Ayarlarını Kaydet
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Kullanıcı Yönetimi */}
        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Kullanıcı Yönetimi</CardTitle>
              <CardDescription>
                Kullanıcıları görüntüleyin ve yetkilerini yönetin
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {users.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Henüz kullanıcı yok
                  </p>
                ) : (
                  <div className="space-y-3">
                    {users.map((u) => (
                      <div
                        key={u.id}
                        className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <UserCog className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{u.full_name || 'İsimsiz Kullanıcı'}</p>
                              <p className="text-sm text-muted-foreground">{u.email}</p>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {u.is_admin ? (
                            <Badge variant="default" className="gap-1">
                              <Shield className="w-3 h-3" />
                              Admin
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Kullanıcı</Badge>
                          )}

                          {u.id !== user?.id && (
                            <Button
                              size="sm"
                              variant={u.is_admin ? 'destructive' : 'default'}
                              onClick={() => handleToggleAdmin(u.id, u.is_admin)}
                            >
                              {u.is_admin ? 'Admin Kaldır' : 'Admin Yap'}
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Güvenlik Ayarları */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Güvenlik Ayarları</CardTitle>
              <CardDescription>
                Hesap güvenliği ve erişim ayarları
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveSecuritySettings} className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg border">
                    <div className="space-y-1">
                      <Label className="text-base">Yeni Kayıt</Label>
                      <p className="text-sm text-muted-foreground">
                        Yeni kullanıcıların kayıt olmasına izin ver
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant={securitySettings.enable_registration ? 'default' : 'outline'}
                      size="sm"
                      onClick={() =>
                        setSecuritySettings({
                          ...securitySettings,
                          enable_registration: !securitySettings.enable_registration,
                        })
                      }
                    >
                      {securitySettings.enable_registration ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Açık
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4 mr-2" />
                          Kapalı
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg border">
                    <div className="space-y-1">
                      <Label className="text-base">E-posta Doğrulama</Label>
                      <p className="text-sm text-muted-foreground">
                        Yeni hesaplar için e-posta doğrulaması zorunlu
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant={securitySettings.require_email_verification ? 'default' : 'outline'}
                      size="sm"
                      onClick={() =>
                        setSecuritySettings({
                          ...securitySettings,
                          require_email_verification: !securitySettings.require_email_verification,
                        })
                      }
                    >
                      {securitySettings.require_email_verification ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Açık
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4 mr-2" />
                          Kapalı
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                <Button type="submit" className="w-full gap-2" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Kaydediliyor...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Güvenlik Ayarlarını Kaydet
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

