import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { k } from '@pkg/locales';
import {
  Bell,
  LayoutDashboard,
  ListTodo,
  LogOut,
  Moon,
  Settings,
  Sun,
  Users,
} from 'lucide-react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { useTheme } from '@/shared/components/theme-provider';
import { useAuth } from '@/shared/auth/auth-context';

const OPEN_EVENT = 'command-menu:open';

/** Open the global command palette from anywhere (e.g. a header button). */
export function openCommandMenu() {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

/**
 * Global ⌘K / Ctrl+K command palette — Linear's signature interaction.
 * Self-contained: mounts once in the app shell and listens for the hotkey
 * (or an `openCommandMenu()` event from a trigger button).
 */
export function CommandMenu() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { logout } = useAuth();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    const onOpen = () => setOpen(true);
    document.addEventListener('keydown', onKeyDown);
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      window.removeEventListener(OPEN_EVENT, onOpen);
    };
  }, []);

  // Close the palette, then run the chosen action on the next tick.
  const run = (action: () => void) => {
    setOpen(false);
    action();
  };

  const navItems = [
    { label: t(k.common.nav.dashboard), icon: LayoutDashboard, to: '/' },
    { label: t(k.users.users), icon: Users, to: '/users' },
    { label: t(k.jobs.jobs), icon: ListTodo, to: '/jobs' },
    { label: t(k.notifications.notifications), icon: Bell, to: '/notifications' },
    { label: t(k.common.nav.settings), icon: Settings, to: '/settings' },
  ];

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title={t(k.common.command.navigation)}
      description={t(k.common.command.search)}
    >
      <CommandInput placeholder={t(k.common.command.search)} />
      <CommandList>
        <CommandEmpty>{t(k.common.command.noResults)}</CommandEmpty>
        <CommandGroup heading={t(k.common.command.navigation)}>
          {navItems.map((item) => (
            <CommandItem
              key={item.to}
              onSelect={() => run(() => navigate(item.to))}
              value={item.label}
            >
              <item.icon />
              <span>{item.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading={t(k.common.command.actions)}>
          <CommandItem onSelect={() => run(toggleTheme)} value="toggle theme appearance">
            {theme === 'dark' ? <Sun /> : <Moon />}
            <span>{t(k.common.command.toggleTheme)}</span>
          </CommandItem>
          <CommandItem onSelect={() => run(() => void logout())} value="log out sign out">
            <LogOut />
            <span>{t(k.auth.logOut)}</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
