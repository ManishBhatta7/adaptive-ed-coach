
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Check } from 'lucide-react';

interface LanguageSelectorProps {
  onLanguageChange: (lang: string) => void;
}

const languages = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'Hindi' },
  { code: 'od', name: 'Odia' }
];

const LanguageSelector = ({ onLanguageChange }: LanguageSelectorProps) => {
  const [currentLanguage, setCurrentLanguage] = useState('en');
  
  useEffect(() => {
    // Load saved language preference from localStorage
    const savedLanguage = localStorage.getItem('preferredLanguage');
    if (savedLanguage) {
      setCurrentLanguage(savedLanguage);
      onLanguageChange(savedLanguage);
    }
  }, [onLanguageChange]);
  
  const handleLanguageSelect = (langCode: string) => {
    setCurrentLanguage(langCode);
    localStorage.setItem('preferredLanguage', langCode);
    onLanguageChange(langCode);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          {languages.find(lang => lang.code === currentLanguage)?.name || 'English'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => handleLanguageSelect(language.code)}
            className="flex items-center justify-between"
          >
            {language.name}
            {currentLanguage === language.code && (
              <Check className="h-4 w-4 ml-2" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSelector;
