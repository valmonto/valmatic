import { useState } from 'react';
import { Link } from 'react-router';
import { toast } from 'sonner';
import {
  Bell,
  ChevronRight,
  CircleHelp,
  FileText,
  LogOut,
  Moon,
  ShieldCheck,
  Smartphone,
  Sun,
  Vibrate,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { Switch } from '@/components/ui/switch';
import { useTheme } from '@/shared/components/theme-provider';

const demoUser = {
  name: 'Alex Morgan',
  email: 'alex@acme.dev',
  role: 'Product Engineer',
  initials: 'AM',
};

const menuItems: { label: string; icon: LucideIcon }[] = [
  { label: 'Security & sessions', icon: ShieldCheck },
  { label: 'Connected devices', icon: Smartphone },
  { label: 'Help & support', icon: CircleHelp },
  { label: 'Terms of service', icon: FileText },
];

function PreferenceRow({
  icon: Icon,
  label,
  description,
  checked,
  onCheckedChange,
  border,
}: {
  icon: LucideIcon;
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  border?: boolean;
}) {
  return (
    <div className={cn('flex items-center gap-3 px-3.5 py-3', border && 'border-t border-border/40')}>
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-medium">{label}</p>
        <p className="text-[11px] text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} aria-label={label} />
    </div>
  );
}

export default function MobileProfilePage() {
  const { theme, toggleTheme } = useTheme();
  const [pushEnabled, setPushEnabled] = useState(true);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);

  return (
    <div className="space-y-4">
      <header className="pt-2">
        <h1 className="text-[22px] font-semibold tracking-tight">Profile</h1>
      </header>

      {/* Identity card */}
      <section className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-[0_1px_2px_rgba(16,18,28,0.04)]">
        <div className="flex flex-col items-center bg-gradient-to-b from-primary/8 to-transparent px-4 pt-7 pb-5 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/70 text-lg font-semibold text-primary-foreground shadow-md shadow-primary/30 ring-2 ring-white/20">
            {demoUser.initials}
          </div>
          <h2 className="mt-3 text-base font-semibold tracking-tight">{demoUser.name}</h2>
          <p className="text-xs text-muted-foreground">{demoUser.email}</p>
          <span className="mt-2 rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold text-primary ring-1 ring-inset ring-primary/20">
            {demoUser.role}
          </span>
        </div>
        <div className="grid grid-cols-3 divide-x divide-border/40 border-t border-border/40 text-center">
          {[
            { value: '128', label: 'Tasks' },
            { value: '9', label: 'This week' },
            { value: '97%', label: 'On time' },
          ].map((stat) => (
            <div key={stat.label} className="py-3">
              <p className="text-sm font-semibold tabular-nums tracking-tight">{stat.value}</p>
              <p className="text-[10px] text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Preferences */}
      <section className="space-y-2">
        <h2 className="px-1 text-[11px] font-medium tracking-[0.08em] text-muted-foreground/70 uppercase">
          Preferences
        </h2>
        <div className="rounded-2xl border border-border/60 bg-card shadow-[0_1px_2px_rgba(16,18,28,0.04)]">
          <PreferenceRow
            icon={theme === 'light' ? Sun : Moon}
            label="Dark mode"
            description="Follows the app-wide theme"
            checked={theme === 'dark'}
            onCheckedChange={toggleTheme}
          />
          <PreferenceRow
            icon={Bell}
            label="Push notifications"
            description="Mentions, assignments and deploys"
            checked={pushEnabled}
            onCheckedChange={setPushEnabled}
            border
          />
          <PreferenceRow
            icon={Vibrate}
            label="Haptic feedback"
            description="Vibrate on key interactions"
            checked={hapticsEnabled}
            onCheckedChange={setHapticsEnabled}
            border
          />
        </div>
      </section>

      {/* Menu */}
      <section className="space-y-2">
        <h2 className="px-1 text-[11px] font-medium tracking-[0.08em] text-muted-foreground/70 uppercase">
          Account
        </h2>
        <div className="rounded-2xl border border-border/60 bg-card shadow-[0_1px_2px_rgba(16,18,28,0.04)]">
          {menuItems.map((item, index) => (
            <button
              key={item.label}
              type="button"
              onClick={() => toast('Demo only', { description: 'This screen is not part of the demo.' })}
              className={cn(
                'flex w-full items-center gap-3 px-3.5 py-3 text-left transition-colors hover:bg-muted/40',
                index > 0 && 'border-t border-border/40',
              )}
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <item.icon className="size-4" />
              </span>
              <span className="flex-1 text-[13px] font-medium">{item.label}</span>
              <ChevronRight className="size-4 text-muted-foreground/50" />
            </button>
          ))}
        </div>
      </section>

      <Link
        to="/"
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border/60 bg-card py-3 text-[13px] font-medium text-destructive shadow-[0_1px_2px_rgba(16,18,28,0.04)] transition-colors hover:bg-destructive/5"
      >
        <LogOut className="size-4" />
        Exit mobile demo
      </Link>

      <p className="pb-2 text-center text-[11px] text-muted-foreground/60">
        vboilerplate mobile · demo data only
      </p>
    </div>
  );
}
