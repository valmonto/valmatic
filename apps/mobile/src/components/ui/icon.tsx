import { TextClassContext } from '@/components/ui/text';
import { cn } from '@/shared/lib/utils';
import type { LucideIcon, LucideProps } from 'lucide-react-native';
import { useCssElement } from 'nativewind';
import * as React from 'react';

type IconProps = LucideProps & {
  as: LucideIcon;
} & React.RefAttributes<LucideIcon>;

// NativeWind v5 replaced `cssInterop(Comp, …)` (mutate-in-place) with
// `useCssElement(Comp, props, mapping)`, and the mapping key `nativeStyleToProp`
// became `nativeStyleMapping`. This maps the resolved `size-*` width/height and
// text color onto the Lucide icon's `size`/`color` props.
const ICON_MAPPING = {
  className: {
    target: 'style',
    nativeStyleMapping: {
      height: 'size',
      width: 'size',
      color: 'color',
    },
  },
} as const;

/**
 * A wrapper for Lucide icons with NativeWind `className` support.
 *
 * @example
 * ```tsx
 * import { ArrowRight } from 'lucide-react-native';
 * import { Icon } from '@/components/ui/icon';
 *
 * <Icon as={ArrowRight} className="text-red-500" size={16} />
 * ```
 */
function Icon({ as: IconComponent, className, size = 14, ...props }: IconProps) {
  const textClass = React.useContext(TextClassContext);
  return useCssElement(
    IconComponent,
    { className: cn('text-foreground', textClass, className), size, ...props },
    ICON_MAPPING,
  );
}

export { Icon };
