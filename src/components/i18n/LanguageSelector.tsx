import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
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
  const [hoveredLang, setHoveredLang] = useState<string | null>(null);

  const currentLanguage = supportedLanguages.find(lang => lang.code === i18n.language) || supportedLanguages[0];

  const handleLanguageChange = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
    localStorage.setItem('preferred-language', languageCode);
    setShowModal(false);
  };

  const formatLanguageDisplay = (lang: typeof supportedLanguages[0], includeFlag: boolean = showFlag) => {
    let display = '';
    
    if (includeFlag) {
      display += `${lang.flag} `;
    }
    
    if (showNativeName) {
      display += lang.nativeName;
    } else {
      display += lang.name;
    }
    
    return display;
  };

  const LanguageInfo: React.FC<{ language: typeof supportedLanguages[0] }> = ({ language }) => {
    const config = getCultureConfig(language.code);
    
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
        
        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
          <div>
            <span className="font-medium">Date format:</span> {config.dateFormat}
          </div>
          <div>
            <span className="font-medium">Time format:</span> {config.timeFormat}
          </div>
          <div>
            <span className="font-medium">Currency:</span> {config.currency}
          </div>
          <div>
            <span className="font-medium">Direction:</span> {config.direction.toUpperCase()}
          </div>
        </div>
      </div>
    );
  };

  // Select variant
  if (variant === 'select') {
    return (
      <Select value={i18n.language} onValueChange={handleLanguageChange}>
        <SelectTrigger className={`w-40 ${className}`}>
          <SelectValue>
            <div className="flex items-center space-x-2">
              {showFlag && <span>{currentLanguage.flag}</span>}
              <span>{showNativeName ? currentLanguage.nativeName : currentLanguage.name}</span>
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {supportedLanguages.map((language) => (
            <SelectItem key={language.code} value={language.code}>
              <div className="flex items-center space-x-2">
                {showFlag && <span>{language.flag}</span>}
                <span>{showNativeName ? language.nativeName : language.name}</span>
                {i18n.language === language.code && (
                  <Check className="w-4 h-4 text-green-600" />
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  // Button variant
  if (variant === 'button') {
    return (
      <Button
        variant="outline"
        onClick={() => setShowModal(true)}
        className={`flex items-center space-x-2 ${className}`}
      >
        <Globe className="w-4 h-4" />
        {showFlag && <span>{currentLanguage.flag}</span>}
        <span>{showNativeName ? currentLanguage.nativeName : currentLanguage.name}</span>
      </Button>
    );
  }

  // Modal variant (opened by button)
  return (
    <>
      <Button
        variant="outline"
        onClick={() => setShowModal(true)}
        className={`flex items-center space-x-2 ${className}`}
      >
        <Globe className="w-4 h-4" />
        {showFlag && <span>{currentLanguage.flag}</span>}
        <span>{showNativeName ? currentLanguage.nativeName : currentLanguage.name}</span>
      </Button>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Globe className="w-5 h-5" />
              <span>{t('settings.language')}</span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Info className="w-4 h-4" />
              <span>Select your preferred language and cultural settings</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {supportedLanguages.map((language) => (
                <Card
                  key={language.code}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    i18n.language === language.code 
                      ? 'ring-2 ring-blue-500 bg-blue-50' 
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => handleLanguageChange(language.code)}
                  onMouseEnter={() => setHoveredLang(language.code)}
                  onMouseLeave={() => setHoveredLang(null)}
                >
                  <CardContent className="p-4">
                    <LanguageInfo language={language} />
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="pt-4 border-t">
              <div className="text-sm text-gray-600">
                <p className="mb-2">
                  <strong>Note:</strong> Changing the language will also update:
                </p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Date and time formats</li>
                  <li>Number and currency formats</li>
                  <li>Text direction (for RTL languages)</li>
                  <li>Cultural preferences</li>
                </ul>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

// Mini language switcher for headers/navigation
export const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();
  const currentLanguage = supportedLanguages.find(lang => lang.code === i18n.language) || supportedLanguages[0];

  return (
    <LanguageSelector 
      variant="select"
      showFlag={true}
      showNativeName={false}
      className="w-32"
    />
  );
};

// Comprehensive language settings component
export const LanguageSettings: React.FC = () => {
  const { i18n, t } = useTranslation();
  const currentConfig = getCultureConfig(i18n.language);
  const currentLanguage = supportedLanguages.find(lang => lang.code === i18n.language) || supportedLanguages[0];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">{t('settings.language')}</h3>
        <p className="text-gray-600 text-sm mb-4">
          Choose your preferred language and regional settings
        </p>
        
        <LanguageSelector variant="modal" showFlag={true} showNativeName={true} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <h4 className="font-medium mb-3">Current Settings</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Language:</span>
                <span className="flex items-center space-x-1">
                  <span>{currentLanguage.flag}</span>
                  <span>{currentLanguage.name}</span>
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Native name:</span>
                <span>{currentLanguage.nativeName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Text direction:</span>
                <span className="uppercase">{currentConfig.direction}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <h4 className="font-medium mb-3">Format Examples</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Date:</span>
                <span>{new Intl.DateTimeFormat(i18n.language).format(new Date())}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Time:</span>
                <span>{new Intl.DateTimeFormat(i18n.language, { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                }).format(new Date())}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Number:</span>
                <span>{new Intl.NumberFormat(i18n.language).format(1234.56)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Currency:</span>
                <span>{new Intl.NumberFormat(i18n.language, {
                  style: 'currency',
                  currency: currentConfig.currency
                }).format(99.99)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LanguageSelector;