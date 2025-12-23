'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createSupabaseClient } from '@/lib/supabase';
import { hexToHSL } from '@/lib/color-utils';

interface AppSettings {
  // Genel
  siteName: string;
  siteDescription: string;
  siteLogo: string;
  contactEmail: string;
  maxUploadSize: number;
  allowedFileTypes: string[];
  invoiceCategories: string[];
  currency: string;
  dateFormat: string;
  timezone: string;
  
  // Tema
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  successColor: string;
  warningColor: string;
  errorColor: string;
  fontFamily: string;
  
  // Güvenlik
  enableRegistration: boolean;
  requireEmailVerification: boolean;
}

const defaultSettings: AppSettings = {
  siteName: 'OCR Finance',
  siteDescription: 'OCR teknolojisi ile fatura okuma ve finansal takip uygulaması',
  siteLogo: '',
  contactEmail: 'info@ocrfinance.com',
  maxUploadSize: 10,
  allowedFileTypes: ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'],
  invoiceCategories: ['Yemek', 'Ulaşım', 'Faturalar', 'Alışveriş', 'Eğlence', 'Sağlık', 'Eğitim', 'Kira', 'Diğer'],
  currency: 'TRY',
  dateFormat: 'DD/MM/YYYY',
  timezone: 'Europe/Istanbul',
  primaryColor: '#10B981', // Emerald yeşil - para, büyüme (160 84% 39%)
  secondaryColor: '#1F3A31', // Koyu yeşil gri (160 20% 20%)
  accentColor: '#F59E0B', // Altın/Amber - değer, zenginlik (43 96% 56%)
  successColor: '#22C55E', // Yeşil - başarı (142 76% 36%)
  warningColor: '#FB923C', // Turuncu - uyarı (38 92% 50%)
  errorColor: '#EF4444', // Kırmızı - hata (0 72% 51%)
  fontFamily: 'var(--font-geist-sans), Inter, system-ui, sans-serif',
  enableRegistration: true,
  requireEmailVerification: false,
};

interface SettingsContextType {
  settings: AppSettings;
  loading: boolean;
  refreshSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType>({
  settings: defaultSettings,
  loading: true,
  refreshSettings: async () => {},
});

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return context;
};

export const SettingsProvider = ({ children }: { children: React.ReactNode }) => {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const supabase = createSupabaseClient();
      const { data, error } = await supabase
        .from('site_settings')
        .select('setting_key, setting_value');

      if (error) {
        // Tablo yoksa veya hata varsa sadece default ayarları kullan
        // Konsola yazma - gereksiz hata mesajı gösterme
        if (error.code !== 'PGRST116' && error.code !== '42P01') {
          console.warn('⚠️ Ayarlar yüklenemedi, varsayılan değerler kullanılıyor:', error.message);
        }
        setSettings(defaultSettings);
        setLoading(false);
        return;
      }

      if (data && data.length > 0) {
        // JSONB değerleri Supabase'den zaten parse edilmiş geliyor
        const settingsMap = new Map(
          data.map((s: any) => [s.setting_key, s.setting_value])
        );

        const newSettings: AppSettings = {
          siteName: settingsMap.get('site_name') || defaultSettings.siteName,
          siteDescription: settingsMap.get('site_description') || defaultSettings.siteDescription,
          siteLogo: settingsMap.get('site_logo') || defaultSettings.siteLogo,
          contactEmail: settingsMap.get('contact_email') || defaultSettings.contactEmail,
          maxUploadSize: settingsMap.get('max_upload_size') || defaultSettings.maxUploadSize,
          allowedFileTypes: settingsMap.get('allowed_file_types') || defaultSettings.allowedFileTypes,
          invoiceCategories: settingsMap.get('invoice_categories') || defaultSettings.invoiceCategories,
          currency: settingsMap.get('currency') || defaultSettings.currency,
          dateFormat: settingsMap.get('date_format') || defaultSettings.dateFormat,
          timezone: settingsMap.get('timezone') || defaultSettings.timezone,
          primaryColor: settingsMap.get('primary_color') || defaultSettings.primaryColor,
          secondaryColor: settingsMap.get('secondary_color') || defaultSettings.secondaryColor,
          accentColor: settingsMap.get('accent_color') || defaultSettings.accentColor,
          successColor: settingsMap.get('success_color') || defaultSettings.successColor,
          warningColor: settingsMap.get('warning_color') || defaultSettings.warningColor,
          errorColor: settingsMap.get('error_color') || defaultSettings.errorColor,
          fontFamily: settingsMap.get('font_family') || defaultSettings.fontFamily,
          enableRegistration: settingsMap.get('enable_registration') ?? defaultSettings.enableRegistration,
          requireEmailVerification: settingsMap.get('require_email_verification') ?? defaultSettings.requireEmailVerification,
        };

        setSettings(newSettings);
        
        // CSS variables'a uygula
        applyThemeSettings(newSettings);
      } else {
        setSettings(defaultSettings);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      setSettings(defaultSettings);
    } finally {
      setLoading(false);
    }
  };

  const applyThemeSettings = (settings: AppSettings) => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      
      // Hex renkleri HSL formatına çevir ve CSS değişkenlerine uygula
      // Tailwind CSS 4.0 HSL formatında bekliyor (örn: "217 91% 60%")
      try {
        // Primary renk - Tailwind'in ana temayı
        const primaryHSL = hexToHSL(settings.primaryColor);
        root.style.setProperty('--primary', primaryHSL);
        
        // Secondary renk
        const secondaryHSL = hexToHSL(settings.secondaryColor);
        root.style.setProperty('--secondary', secondaryHSL);
        
        // Accent renk
        const accentHSL = hexToHSL(settings.accentColor);
        root.style.setProperty('--accent', accentHSL);
        root.style.setProperty('--ring', accentHSL); // Focus ring için de kullan
        
        // Success renk
        const successHSL = hexToHSL(settings.successColor);
        root.style.setProperty('--success', successHSL);
        
        // Warning renk
        const warningHSL = hexToHSL(settings.warningColor);
        root.style.setProperty('--warning', warningHSL);
        
        // Error/Destructive renk
        const errorHSL = hexToHSL(settings.errorColor);
        root.style.setProperty('--destructive', errorHSL);
        
        // Font family uygula
        if (settings.fontFamily) {
          root.style.setProperty('--font-sans', settings.fontFamily);
          document.body.style.fontFamily = settings.fontFamily;
        }
        
        console.log('✅ Tema renkleri uygulandı:', {
          primary: primaryHSL,
          secondary: secondaryHSL,
          accent: accentHSL,
          success: successHSL,
          warning: warningHSL,
          error: errorHSL,
        });
      } catch (error) {
        console.error('❌ Tema renkleri uygulanırken hata:', error);
      }
    }
  };

  useEffect(() => {
    // İlk yüklemede default renkleri uygula
    applyThemeSettings(defaultSettings);
    // Sonra veritabanından yükle
    fetchSettings();
  }, []);

  const refreshSettings = async () => {
    setLoading(true);
    await fetchSettings();
  };

  return (
    <SettingsContext.Provider value={{ settings, loading, refreshSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

