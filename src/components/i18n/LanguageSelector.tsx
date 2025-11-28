import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
// This import should now work because we fixed src/i18n/index.ts
import { supportedLanguages, getCultureConfig } from '@/i18n';
import { Globe, Check, Info } from 'lucide-react';

interface LanguageSelectorProps {
  variant?: 'select' | 'button' | 'modal';
  showFlag?: boolean;
  showNativeName?: boolean;
  className?: string;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  variant = 'select',
  showFlag = true,
  showNativeName = false,
  className = '',
}) => {
  const { i18n, t } = useTranslation();
  const [showModal, setShowModal] = useState(false);

  // Fallback if languages aren't loaded yet
  const safeLanguages = supportedLanguages || [{ code: 'en', name: 'English', flag: '🇺🇸' }];
  const currentLanguage = safeLanguages.find(lang => lang.code === i18n.language) || safeLanguages[0];

  const handleLanguageChange = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
    localStorage.setItem('preferred-language', languageCode);
    setShowModal(false);
  };

  const LanguageInfo: React.FC<{ language: typeof safeLanguages[0] }> = ({ language }) => {
    const config = getCultureConfig ? getCultureConfig(language.code) : { currency: 'USD' };
    
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">{language.flag}</span>
            <div>
              <div className="font-medium">{language.name}</div>
              <div className="text-sm text-gray-600">{language.nativeName}</div>
            </div>
          </div>
          {i18n.language === language.code && (
            <Badge variant="default" className="bg-green-100 text-green-800">
              <Check className="w-3 h-3 mr-1" />
              Current
            </Badge>
          )}
        </div>
      </div>
    );
  };

  // Select variant (for Sidebar)
  if (variant === 'select') {
    return (
      <Select value={i18n.language} onValueChange={handleLanguageChange}>
        <SelectTrigger className={`w-full ${className}`}>
          <SelectValue>
            <div className="flex items-center space-x-2 truncate">
              {showFlag && <span>{currentLanguage.flag}</span>}
              <span className="truncate">{showNativeName ? currentLanguage.nativeName : currentLanguage.name}</span>
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {safeLanguages.map((language) => (
            <SelectItem key={language.code} value={language.code}>
              <div className="flex items-center space-x-2">
                {showFlag && <span>{language.flag}</span>}
                <span>{showNativeName ? language.nativeName : language.name}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  // Button variant (for Collapsed Sidebar)
  if (variant === 'button') {
    return (
      <>
        <Button
          variant="ghost"
          onClick={() => setShowModal(true)}
          className={`flex items-center justify-center ${className}`}
          title="Change Language"
        >
          {showFlag ? <span className="text-xl">{currentLanguage.flag}</span> : <Globe className="w-5 h-5" />}
          {showNativeName && <span className="ml-2">{currentLanguage.nativeName}</span>}
        </Button>

        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Select Language</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 gap-2 mt-4">
              {safeLanguages.map((language) => (
                <Button
                  key={language.code}
                  variant={i18n.language === language.code ? "default" : "outline"}
                  className="justify-start h-12"
                  onClick={() => handleLanguageChange(language.code)}
                >
                  <span className="text-2xl mr-3">{language.flag}</span>
                  <div className="flex flex-col items-start">
                    <span className="text-sm font-medium">{language.name}</span>
                    <span className="text-xs opacity-70">{language.nativeName}</span>
                  </div>
                  {i18n.language === language.code && <Check className="ml-auto w-4 h-4" />}
                </Button>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return null;
};

export default LanguageSelector;