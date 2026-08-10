import { useTranslation } from 'react-i18next';
import { k, supportedLanguages, type SupportedLanguage } from '@pkg/locales';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { useAuth } from '@/shared/auth/auth-context';
import { useTheme } from '@/shared/components/theme-provider';
import { Check, ChevronsUpDown, Languages, LogOut, Moon, Settings, Sun, User } from 'lucide-react';
import { useMemo } from 'react';

const languageNames: Record<SupportedLanguage, string> = {
  en: 'English',
  es: 'Español',
  lt: 'Lietuvių',
};

export function UserActionsDropdown() {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const { isMobile } = useSidebar();
  const { theme, toggleTheme } = useTheme();
  const currentLanguage = (i18n.language?.split('-')[0] || 'en') as SupportedLanguage;

  const avatarFallback = useMemo(() => {
    if (!user) return '';
    const [first, last] = (user.displayName || user.name || '').split(' ');
    if (!first) return 'U';
    if (first && last) return `${first[0]}${last[0]}`.toUpperCase();
    return `${first[0]}`.toUpperCase();
  }, [user]);

  if (!user) return null;

  const displayName = user.displayName || user.name || 'User';

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="group transition-colors data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src="/diverse-user-avatars.png" alt={displayName} />
                <AvatarFallback className="rounded-lg">{avatarFallback}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{displayName}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {user.email.toLowerCase()}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto size-4 text-muted-foreground transition-all duration-200 ease-out group-hover:text-foreground group-data-[state=open]:scale-110 group-data-[state=open]:text-foreground" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? 'bottom' : 'right'}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src="/diverse-user-avatars.png" alt={displayName} />
                  <AvatarFallback className="rounded-lg">{avatarFallback}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{displayName}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {user.email.toLowerCase()}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              <span>{t(k.users.profile)}</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              <span>{t(k.common.nav.settings)}</span>
            </DropdownMenuItem>
            {/* Below md the top bar drops its language + theme controls to
                stay uncluttered — they resurface here. Conditionally rendered
                (not CSS-hidden): display:none menu items would still catch
                Radix keyboard navigation on desktop. */}
            {isMobile && (
              <>
                <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  toggleTheme();
                }}
              >
                {theme === 'light' ? (
                  <Moon className="mr-2 h-4 w-4" />
                ) : (
                  <Sun className="mr-2 h-4 w-4" />
                )}
                <span>{t(k.common.command.toggleTheme)}</span>
              </DropdownMenuItem>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Languages className="mr-2 h-4 w-4" />
                  <span>{t(k.common.command.changeLanguage)}</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {supportedLanguages.map((lang) => (
                    <DropdownMenuItem key={lang} onClick={() => i18n.changeLanguage(lang)}>
                      {currentLanguage === lang ? (
                        <Check className="mr-2 h-4 w-4" />
                      ) : (
                        <span className="mr-2 h-4 w-4" />
                      )}
                      <span>{languageNames[lang]}</span>
                    </DropdownMenuItem>
                  ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>{t(k.auth.logOut)}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
