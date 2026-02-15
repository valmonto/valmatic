import { useTranslation } from 'react-i18next';
import { Languages, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supportedLanguages, type SupportedLanguage } from '@pkg/locales';

const languageNames: Record<SupportedLanguage, string> = {
  en: 'English',
  es: 'Español',
};

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const currentLanguage = (i18n.language?.split('-')[0] || 'en') as SupportedLanguage;

  const changeLanguage = (lng: SupportedLanguage) => {
    i18n.changeLanguage(lng);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm">
          <Languages className="size-4" />
          <span className="sr-only">Change language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {supportedLanguages.map((lang) => {
          const isActive = currentLanguage === lang;
          return (
            <DropdownMenuItem key={lang} onClick={() => changeLanguage(lang)}>
              {isActive && <Check className="mr-2 h-4 w-4" />}
              {!isActive && <span className="mr-2 h-4 w-4" />}
              <span>{languageNames[lang]}</span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
