import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { SettingsProvider } from "@/components/providers/settings-provider";
import { createSupabaseClient } from "@/lib/supabase";
import { Footer } from "@/components/layout/footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Dinamik metadata oluşturma
export async function generateMetadata() {
  try {
    const supabase = createSupabaseClient();
    const { data } = await supabase
      .from('site_settings')
      .select('setting_key, setting_value')
      .in('setting_key', ['site_name', 'site_description', 'primary_color']);

    const settingsMap = new Map(data?.map((s: any) => [s.setting_key, s.setting_value]));
    
    const siteName = settingsMap.get('site_name') || 'OCR Finance';
    const siteDescription = settingsMap.get('site_description') || 'OCR teknolojisi ile fatura okuma ve finansal takip uygulaması';
    const primaryColor = settingsMap.get('primary_color') || '#10B981';

    return {
      title: `${siteName} - Fatura Takip Sistemi`,
      description: siteDescription,
      manifest: "/manifest.json",
      themeColor: primaryColor,
    };
  } catch (error) {
    // Hata durumunda varsayılan değerler
    return {
      title: "OCR Finance - Fatura Takip Sistemi",
      description: "OCR teknolojisi ile fatura okuma ve finansal takip uygulaması",
      manifest: "/manifest.json",
      themeColor: "#10B981",
    };
  }
}

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className="dark" suppressHydrationWarning>
      <body 
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}
        suppressHydrationWarning
      >
        <SettingsProvider>
          <div className="flex-1 flex flex-col">
            {children}
          </div>
          <Footer />
          <Toaster />
        </SettingsProvider>
      </body>
    </html>
  );
}
