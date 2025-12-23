'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { processInvoiceWithOCR } from '@/lib/ocr';
import { analyzeInvoiceImageWithGemini } from '@/lib/gemini';
import { createSupabaseClient } from '@/lib/supabase';
import { useAuth } from '@/components/providers/auth-provider';
import { useSettings } from '@/components/providers/settings-provider';
import { toast } from 'sonner';
import { Upload, Image as ImageIcon, Loader2, Check, X, Sparkles, Zap } from 'lucide-react';
import type { InvoiceType } from '@/types/invoice';

interface InvoiceUploadProps {
  onSuccess?: () => void;
}

export const InvoiceUpload = ({ onSuccess }: InvoiceUploadProps) => {
  const { user } = useAuth();
  const { settings } = useSettings();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [ocrProgress, setOcrProgress] = useState<{ status: string; progress: number } | null>(null);
  const [useAI, setUseAI] = useState(true); // AI destekli OCR varsayılan açık
  
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<InvoiceType>('expense');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [ocrText, setOcrText] = useState('');
  const [ocrConfidence, setOcrConfidence] = useState<number | null>(null);
  
  // Gemini API key var mı?
  const hasGeminiKey = Boolean(settings.geminiApiKey);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.type.startsWith('image/')) {
      toast.error('Lütfen bir görsel dosyası seçin');
      return;
    }

    setFile(selectedFile);
    
    // Önizleme oluştur
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(selectedFile);

    // Otomatik OCR analizi başlat
    await handleProcessOCR(selectedFile);
  };

  const handleProcessOCR = async (fileToProcess?: File) => {
    const targetFile = fileToProcess || file;
    
    if (!targetFile) {
      toast.error('Lütfen önce bir görsel seçin');
      return;
    }

    setProcessing(true);
    setOcrProgress({ status: 'Başlatılıyor...', progress: 0 });

    try {
      // AI destekli OCR kullanılıyorsa ve Gemini key varsa
      if (useAI && hasGeminiKey) {
        const loadingToast = toast.info('Fatura AI ile analiz ediliyor...', {
          description: 'Gemini Vision API çalışıyor ✨',
          icon: <Sparkles className="w-4 h-4" />,
          duration: 30000,
        });

        setOcrProgress({ status: 'Gemini Vision AI analiz ediyor...', progress: 0.5 });

        const geminiResult = await analyzeInvoiceImageWithGemini(
          targetFile,
          settings.geminiApiKey,
          settings.geminiModel || 'gemini-2.0-flash-exp'
        );

        console.log('🤖 Gemini AI sonuçları:', geminiResult);

        let autoFilledFields = 0;

        // Tutar
        if (geminiResult.amount) {
          setAmount(geminiResult.amount.toString());
          autoFilledFields++;
        }

        // Tarih
        if (geminiResult.date) {
          try {
            const dateParts = geminiResult.date.split(/[./]/);
            if (dateParts.length === 3) {
              const [day, month, year] = dateParts;
              const parsedDate = new Date(`${year}-${month}-${day}`);
              if (!isNaN(parsedDate.getTime())) {
                setDate(parsedDate.toISOString().split('T')[0]);
                autoFilledFields++;
              }
            }
          } catch (e) {
            console.error('Tarih parse hatası:', e);
          }
        }

        // Başlık (vendor)
        if (geminiResult.vendor) {
          setTitle(geminiResult.vendor.substring(0, 50));
          autoFilledFields++;
        }

        // Kategori
        if (geminiResult.category && settings.invoiceCategories.includes(geminiResult.category)) {
          setCategory(geminiResult.category);
          autoFilledFields++;
        }

        // OCR metnini göster (AI analizi)
        setOcrText(geminiResult.rawExtraction || 'AI analizi tamamlandı');
        setOcrConfidence(geminiResult.confidence * 100);

        toast.dismiss(loadingToast);

        toast.success('AI analizi tamamlandı! 🎉', {
          description: `${autoFilledFields} alan otomatik dolduruldu • Güven: ${Math.round(geminiResult.confidence * 100)}%`,
          duration: 5000,
        });

        if (geminiResult.invoiceNumber) {
          toast.info('Fatura No tespit edildi', {
            description: geminiResult.invoiceNumber,
          });
        }
      } else {
        // Standart Tesseract.js OCR
        const loadingToast = toast.info('Fatura işleniyor...', {
          description: 'Tesseract OCR çalışıyor',
          icon: <ImageIcon className="w-4 h-4" />,
          duration: 30000,
        });

        const ocrResult = await processInvoiceWithOCR(targetFile, (progress) => {
          setOcrProgress(progress);
        });

        setOcrText(ocrResult.text);
        setOcrConfidence(ocrResult.confidence);

        // Basit başlık önerisi
        if (!title && ocrResult.text) {
          const firstLine = ocrResult.text.split('\n')[0].substring(0, 50);
          setTitle(firstLine);
        }

        toast.dismiss(loadingToast);

        toast.success('OCR işlemi tamamlandı', {
          description: `Metin tanındı • Güven: ${Math.round(ocrResult.confidence)}%`,
        });

        toast.info('Manuel düzenleme gerekebilir', {
          description: 'Lütfen fatura bilgilerini kontrol edin',
        });
      }
    } catch (error) {
      toast.error('İşlem başarısız', {
        description: error instanceof Error ? error.message : 'Lütfen alanları manuel olarak doldurun',
      });
      console.error('OCR/AI Error:', error);
    } finally {
      setProcessing(false);
      setOcrProgress(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error('Lütfen giriş yapın');
      return;
    }

    if (!title || !amount || !category) {
      toast.error('Lütfen tüm alanları doldurun');
      return;
    }

    setUploading(true);

    try {
      const supabase = createSupabaseClient();
      let imageUrl: string | null = null;

      // Görsel yükle
      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('invoices')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('invoices')
          .getPublicUrl(fileName);

        imageUrl = publicUrl;
      }

      // Fatura kaydet
      const { error: insertError } = await supabase
        .from('invoices')
        .insert({
          user_id: user.id,
          title,
          amount: parseFloat(amount),
          type,
          category,
          date,
          image_url: imageUrl,
          ocr_text: ocrText || null,
        });

      if (insertError) throw insertError;

      toast.success('Fatura başarıyla eklendi!');
      
      // Formu temizle
      setFile(null);
      setPreview(null);
      setTitle('');
      setAmount('');
      setCategory('');
      setDate(new Date().toISOString().split('T')[0]);
      setOcrText('');
      setOcrConfidence(null);
      setOcrProgress(null);
      setUseAI(true); // AI destekli OCR varsayılan açık
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      onSuccess?.();
    } catch (error) {
      toast.error('Fatura eklenirken bir hata oluştu');
      console.error('Upload Error:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Görsel Yükleme */}
        <Card>
          <CardHeader>
            <CardTitle>Fatura Görseli</CardTitle>
            <CardDescription>
              {hasGeminiKey 
                ? 'Fatura görselinizi yükleyin - AI destekli OCR ile otomatik analiz edilecek'
                : 'Fatura görselinizi yükleyin - Standart OCR ile metin tanınacak'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="file">Görsel Dosyası</Label>
              <Input
                ref={fileInputRef}
                id="file"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                disabled={processing || uploading}
              />
            </div>

            {/* AI Destekli OCR Checkbox - Sadece Gemini key varsa görünsün */}
            {hasGeminiKey && (
              <div className="flex items-start space-x-3 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                <input
                  type="checkbox"
                  id="useAI"
                  checked={useAI}
                  onChange={(e) => setUseAI(e.target.checked)}
                  disabled={processing || uploading}
                  className="mt-1 w-4 h-4 text-primary bg-background border-primary/30 rounded focus:ring-2 focus:ring-primary cursor-pointer disabled:cursor-not-allowed"
                />
                <div className="flex-1">
                  <Label htmlFor="useAI" className="flex items-center gap-2 cursor-pointer font-medium text-sm">
                    <Zap className="w-4 h-4 text-primary" />
                    AI Destekli OCR (Gemini Vision)
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    {useAI ? (
                      <>
                        <span className="text-primary font-medium">✓ Aktif:</span> Gemini AI faturayı direkt analiz edecek ve tüm alanları otomatik dolduracak
                      </>
                    ) : (
                      <>
                        <span className="text-muted-foreground">○ Kapalı:</span> Standart OCR kullanılacak, manuel düzenleme gerekebilir
                      </>
                    )}
                  </p>
                </div>
              </div>
            )}

            {preview && (
              <div className="relative">
                <img
                  src={preview}
                  alt="Fatura önizleme"
                  className="w-full h-auto rounded-lg border border-border"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm"
                  onClick={() => {
                    setFile(null);
                    setPreview(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                  disabled={processing || uploading}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}

            {!preview && (
              <div className="border-2 border-dashed border-border rounded-lg p-12 text-center">
                <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">
                  Henüz görsel seçilmedi
                </p>
              </div>
            )}

            {ocrProgress && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  <span className="text-sm font-medium">OCR Analizi Devam Ediyor...</span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{ocrProgress.status}</span>
                    <span>{Math.round(ocrProgress.progress * 100)}%</span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-300 ease-out"
                      style={{ width: `${ocrProgress.progress * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

            {ocrText && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>{useAI ? 'AI Analizi' : 'Tespit Edilen Metin'}</Label>
                  {ocrConfidence !== null && (
                    <Badge variant={ocrConfidence > 80 ? 'default' : 'secondary'} className="text-xs">
                      Güven: {Math.round(ocrConfidence)}%
                    </Badge>
                  )}
                </div>
                <Textarea
                  value={ocrText}
                  readOnly
                  className="h-32 text-xs font-mono bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  {useAI && hasGeminiKey ? (
                    <>🤖 AI ile analiz edildi. Fatura bilgileri otomatik dolduruldu.</>
                  ) : (
                    <>📝 OCR ile metin tanındı. Lütfen bilgileri kontrol edin.</>
                  )}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Fatura Bilgileri */}
        <Card>
          <CardHeader>
            <CardTitle>Fatura Bilgileri</CardTitle>
            <CardDescription>
              {hasGeminiKey && useAI
                ? 'AI tüm alanları otomatik dolduracak, kontrol edip kaydedin'
                : 'Lütfen fatura bilgilerini girin veya kontrol edin'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Başlık *</Label>
              <Input
                id="title"
                placeholder="Örn: Market alışverişi"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                disabled={uploading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Tutar (TRY) *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                disabled={uploading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Tip *</Label>
              <Select value={type} onValueChange={(value) => setType(value as InvoiceType)} disabled={uploading}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="expense">
                    <div className="flex items-center gap-2">
                      <Badge variant="destructive" className="w-2 h-2 p-0 rounded-full" />
                      Gider
                    </div>
                  </SelectItem>
                  <SelectItem value="income">
                    <div className="flex items-center gap-2">
                      <Badge className="w-2 h-2 p-0 rounded-full bg-green-500" />
                      Gelir
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Kategori *</Label>
              <Select value={category} onValueChange={setCategory} disabled={uploading}>
                <SelectTrigger>
                  <SelectValue placeholder="Kategori seçin" />
                </SelectTrigger>
                <SelectContent>
                  {settings.invoiceCategories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Tarih *</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                disabled={uploading}
              />
            </div>

            <Button
              type="submit"
              className="w-full gap-2"
              size="lg"
              disabled={uploading || !title || !amount || !category}
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Kaydediliyor...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Faturayı Kaydet
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </form>
  );
};

