import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { SafeAreaView } from '@/shared/components/safe-area-view';
import { FolderPlus, Plus } from 'lucide-react-native';
import { View } from 'react-native';

/** Empty state — nothing to show yet, with a primary call-to-action. */
export function EmptyStateBlock() {
  return (
    <SafeAreaView className="flex-1 items-center justify-center bg-background">
      <EmptyState
        icon={FolderPlus}
        title="No projects yet"
        description="Create your first project to start tracking work with your team."
        action={
          <Button className="h-12 rounded-2xl px-6 shadow-lg shadow-primary/25">
            <Icon as={Plus} size={18} className="text-primary-foreground" />
            <Text className="font-semibold">New project</Text>
          </Button>
        }
      />
    </SafeAreaView>
  );
}
