import Link from 'next/link';
import { Github } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="border-t border-border/50 bg-background/80 backdrop-blur-sm mt-auto">
      <div className="container mx-auto px-8 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-sm text-muted-foreground">
            <p>OCR Finance v1.0.0 • © 2024 Tüm hakları saklıdır</p>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-sm text-muted-foreground">
              Powered by{' '}
              <Link 
                href="https://ssilistre.dev" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline font-medium"
              >
                ssilistre.dev
              </Link>
            </div>
            
            <Link 
              href="https://github.com/unkownpr/OCR-Finance" 
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <Github className="w-4 h-4" />
              <span>Açık Kaynak</span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

