import { Icon } from '@/components/ui/icon';
import { NativeOnlyAnimatedView } from '@/components/ui/native-only-animated-view';
import { Text } from '@/components/ui/text';
import { cn } from '@/shared/lib/utils';
import * as DialogPrimitive from '@rn-primitives/dialog';
import { LinearGradient } from 'expo-linear-gradient';
import { Search, type LucideIcon } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { FadeIn, FadeInDown, FadeOut, ReduceMotion } from 'react-native-reanimated';
import { FullWindowOverlay as RNFullWindowOverlay } from 'react-native-screens';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const FullWindowOverlay = Platform.OS === 'ios' ? RNFullWindowOverlay : React.Fragment;

type CommandItem = {
  icon?: LucideIcon;
  label: string;
  shortcut?: string;
  keywords?: string[];
  onSelect: () => void;
};
type CommandGroup = { heading?: string; items: CommandItem[] };

type CommandPaletteProps = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  groups: CommandGroup[];
  placeholder?: string;
  emptyText?: string;
};

/**
 * A mobile command palette (⌘K equivalent): a spotlight-style glass overlay with
 * a search field and a grouped, filterable command list. Controlled via
 * `open`/`onOpenChange`. Token-styled; closes on select or an outside tap.
 */
function CommandPalette({
  open,
  onOpenChange,
  groups,
  placeholder = 'Type a command or search…',
  emptyText = 'No results found.',
}: CommandPaletteProps) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const close = () => onOpenChange?.(false);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <FullWindowOverlay>
          <DialogPrimitive.Overlay
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width,
              height,
              alignItems: 'center',
              paddingTop: insets.top + 48,
              paddingHorizontal: 16,
            }}
          >
            <NativeOnlyAnimatedView
              entering={FadeIn.duration(180).reduceMotion(ReduceMotion.System)}
              exiting={FadeOut.duration(150).reduceMotion(ReduceMotion.System)}
              pointerEvents="none"
              style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)' }]}
            />
            <NativeOnlyAnimatedView
              entering={FadeInDown.duration(200).reduceMotion(ReduceMotion.System)}
              exiting={FadeOut.duration(140).reduceMotion(ReduceMotion.System)}
              style={{ width: '100%', maxWidth: 560, maxHeight: height * 0.6 }}
            >
              <CommandPanel
                groups={groups}
                placeholder={placeholder}
                emptyText={emptyText}
                onClose={close}
              />
            </NativeOnlyAnimatedView>
          </DialogPrimitive.Overlay>
        </FullWindowOverlay>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

function CommandPanel({
  groups,
  placeholder,
  emptyText,
  onClose,
}: {
  groups: CommandGroup[];
  placeholder?: string;
  emptyText?: string;
  onClose: () => void;
}) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const tint = isDark ? 'rgba(22,22,27,0.98)' : 'rgba(255,255,255,0.98)';
  const [query, setQuery] = React.useState('');

  const q = query.trim().toLowerCase();
  const filtered = groups
    .map((g) => ({
      ...g,
      items: g.items.filter(
        (it) =>
          !q ||
          it.label.toLowerCase().includes(q) ||
          it.keywords?.some((k) => k.toLowerCase().includes(q)),
      ),
    }))
    .filter((g) => g.items.length > 0);

  const run = (it: CommandItem) => {
    onClose();
    it.onSelect();
  };

  return (
    <View
      // Absorb touches so taps inside the panel don't dismiss via the backdrop.
      onStartShouldSetResponder={() => true}
      style={{ backgroundColor: tint }}
      className="border-border overflow-hidden rounded-2xl border shadow-lg shadow-black/30"
    >
      <LinearGradient
        pointerEvents="none"
        colors={
          isDark
            ? ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0)']
            : ['rgba(255,255,255,0.7)', 'rgba(255,255,255,0)']
        }
        locations={[0, 0.2]}
        style={StyleSheet.absoluteFill}
      />

      {/* Search row */}
      <View
        className="border-border flex-row items-center gap-2.5 border-b px-4"
        style={{ height: 52 }}
      >
        <Icon as={Search} size={18} className="text-muted-foreground" />
        <TextInput
          autoFocus
          value={query}
          onChangeText={setQuery}
          placeholder={placeholder}
          autoCapitalize="none"
          autoCorrect={false}
          style={{ fontFamily: 'Inter_400Regular', padding: 0 }}
          className="text-foreground placeholder:text-muted-foreground flex-1 text-base"
        />
      </View>

      {/* Results */}
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 8 }}
      >
        {filtered.length === 0 ? (
          <View className="py-10">
            <Text variant="muted" className="text-center text-sm">
              {emptyText}
            </Text>
          </View>
        ) : (
          filtered.map((g, gi) => (
            <View key={gi} className="mb-1">
              {g.heading ? (
                <Text className="text-muted-foreground px-2.5 pb-1 pt-2 text-[11px] font-medium uppercase tracking-wider">
                  {g.heading}
                </Text>
              ) : null}
              {g.items.map((it, ii) => (
                <Pressable
                  key={ii}
                  onPress={() => run(it)}
                  className="active:bg-accent flex-row items-center gap-3 rounded-lg px-2.5 py-2.5"
                >
                  {it.icon ? (
                    <Icon as={it.icon} size={18} className="text-muted-foreground" />
                  ) : null}
                  <Text className="flex-1 text-[15px] text-foreground">{it.label}</Text>
                  {it.shortcut ? (
                    <View className="border-border rounded-md border px-1.5 py-0.5">
                      <Text className="text-muted-foreground text-[11px]">{it.shortcut}</Text>
                    </View>
                  ) : null}
                </Pressable>
              ))}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

export { CommandPalette };
export type { CommandGroup, CommandItem, CommandPaletteProps };
