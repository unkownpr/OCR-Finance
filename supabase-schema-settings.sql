-- ============================================
-- Site Settings Tablosu
-- ============================================
-- Bu tablo uygulamanın genel ayarlarını tutar
-- Not: Bu tablo opsiyoneldir. Yoksa varsayılan ayarlar kullanılır.

-- Site ayarları tablosu
CREATE TABLE IF NOT EXISTS public.site_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key TEXT NOT NULL UNIQUE,
    setting_value JSONB NOT NULL,
    setting_type TEXT NOT NULL CHECK (setting_type IN ('general', 'theme', 'email', 'security', 'api')),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_site_settings_key ON public.site_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_site_settings_type ON public.site_settings(setting_type);

-- RLS Politikaları
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Herkes okuyabilir (ayarlar public)
CREATE POLICY "Herkes site ayarlarını okuyabilir"
    ON public.site_settings
    FOR SELECT
    USING (true);

-- Sadece admin güncelleyebilir
CREATE POLICY "Sadece adminler ayarları güncelleyebilir"
    ON public.site_settings
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.is_admin = true
        )
    );

-- Updated_at otomatik güncelleme trigger'ı
CREATE OR REPLACE FUNCTION public.update_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_site_settings_updated_at
    BEFORE UPDATE ON public.site_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_settings_updated_at();

-- ============================================
-- Varsayılan Ayarları Ekle (Opsiyonel)
-- ============================================
-- Bu satırları istersen ekleyebilirsin, yoksa kod varsayılanları kullanır

INSERT INTO public.site_settings (setting_key, setting_value, setting_type, description) VALUES
    ('site_name', '"OCR Finance"', 'general', 'Site adı'),
    ('site_description', '"OCR teknolojisi ile fatura okuma ve finansal takip uygulaması"', 'general', 'Site açıklaması'),
    ('site_logo', '""', 'general', 'Site logosu URL'),
    ('contact_email', '"info@ocrfinance.com"', 'general', 'İletişim e-posta adresi'),
    ('max_upload_size', '10', 'general', 'Maksimum yükleme boyutu (MB)'),
    ('allowed_file_types', '["image/jpeg", "image/png", "image/jpg", "application/pdf"]', 'general', 'İzin verilen dosya tipleri'),
    ('invoice_categories', '["Yemek", "Ulaşım", "Faturalar", "Alışveriş", "Eğlence", "Sağlık", "Eğitim", "Kira", "Diğer"]', 'general', 'Fatura kategorileri'),
    ('currency', '"TRY"', 'general', 'Para birimi'),
    ('date_format', '"DD/MM/YYYY"', 'general', 'Tarih formatı'),
    ('timezone', '"Europe/Istanbul"', 'general', 'Zaman dilimi'),
    ('primary_color', '"#10B981"', 'theme', 'Ana renk (Primary)'),
    ('secondary_color', '"#1F3A31"', 'theme', 'İkincil renk (Secondary)'),
    ('accent_color', '"#F59E0B"', 'theme', 'Vurgu rengi (Accent)'),
    ('success_color', '"#22C55E"', 'theme', 'Başarı rengi'),
    ('warning_color', '"#FB923C"', 'theme', 'Uyarı rengi'),
    ('error_color', '"#EF4444"', 'theme', 'Hata rengi'),
    ('font_family', '"var(--font-geist-sans), Inter, system-ui, sans-serif"', 'theme', 'Yazı tipi ailesi'),
    ('enable_registration', 'true', 'security', 'Kayıt olma etkin mi?'),
    ('require_email_verification', 'false', 'security', 'E-posta doğrulaması gerekli mi?')
ON CONFLICT (setting_key) DO NOTHING;

-- ============================================
-- Kullanım Notları
-- ============================================
-- 1. Bu SQL dosyasını Supabase SQL Editor'de çalıştırın
-- 2. Veya bu tablo olmasa bile uygulama varsayılan ayarlarla çalışır
-- 3. Admin panelinden ayarları yönetmek için bu tablo gereklidir
-- 4. JSONB formatında değerler saklanır (string değerler için çift tırnak kullanılır)

