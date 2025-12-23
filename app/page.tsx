import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Wallet,
  Receipt,
  BarChart3,
  Zap,
  Shield,
  Smartphone,
  ArrowRight,
  CheckCircle,
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/10">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-sm bg-background/80 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <Wallet className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">OCR Finance</h1>
              <p className="text-xs text-muted-foreground">Fatura Takip</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost">Giriş Yap</Button>
            </Link>
            <Link href="/register">
              <Button>Kayıt Ol</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="inline-block px-4 py-2 bg-primary/10 rounded-full">
            <p className="text-sm font-medium text-primary">OCR Teknolojisi ile Akıllı Fatura Yönetimi</p>
          </div>
          <h2 className="text-5xl md:text-6xl font-bold tracking-tight">
            Faturalarınızı Akıllıca
            <span className="text-primary block mt-2">Takip Edin</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            OCR teknolojisi ile faturalarınızı otomatik olarak okuyun, 
            finansal durumunuzu gerçek zamanlı takip edin ve bütçenizi kolayca yönetin.
          </p>
          <div className="flex items-center justify-center gap-4 pt-6">
            <Link href="/register">
              <Button size="lg" className="gap-2 text-lg px-8 py-6">
                Ücretsiz Başla
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                Demo'yu İzle
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold mb-4">Güçlü Özellikler</h3>
          <p className="text-muted-foreground">
            Finansal yönetiminizi kolaylaştıran modern araçlar
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>OCR Teknolojisi</CardTitle>
              <CardDescription>
                Fatura görsellerinden otomatik olarak tutar ve bilgileri çıkarın
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Detaylı İstatistikler</CardTitle>
              <CardDescription>
                Gelir-gider analizleri ve görsel grafiklerle finansal durumunuzu görün
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                <Receipt className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Fatura Yönetimi</CardTitle>
              <CardDescription>
                Tüm faturalarınızı tek bir yerde düzenleyin ve kategorize edin
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Güvenli Saklama</CardTitle>
              <CardDescription>
                Verileriniz Supabase ile güvenli bir şekilde saklanır
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                <Smartphone className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Mobil Uyumlu</CardTitle>
              <CardDescription>
                PWA desteği ile mobil cihazlarınızda uygulama gibi kullanın
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                <Wallet className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Bütçe Takibi</CardTitle>
              <CardDescription>
                Gelir ve giderlerinizi takip ederek bütçenizi kontrol altında tutun
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-12 text-center">
            <h3 className="text-3xl font-bold mb-4">
              Finansal Kontrolü Elinize Alın
            </h3>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              Bugün başlayın ve faturalarınızı akıllıca yönetmenin keyfini çıkarın. 
              Ücretsiz, hızlı ve kolay!
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-5 h-5 text-primary" />
                Ücretsiz kullanım
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-5 h-5 text-primary" />
                Kredi kartı gerektirmez
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-5 h-5 text-primary" />
                Anında başlayın
              </div>
            </div>
            <Link href="/register">
              <Button size="lg" className="mt-8 gap-2">
                Hemen Başla
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2024 OCR Finance. Tüm hakları saklıdır.</p>
        </div>
      </footer>
    </div>
  );
}
