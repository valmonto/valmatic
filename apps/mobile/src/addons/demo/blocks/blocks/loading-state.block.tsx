import { Skeleton } from '@/components/ui/skeleton';
import { SafeAreaView } from '@/shared/components/safe-area-view';
import { View } from 'react-native';

/** Loading / skeleton — placeholders that mirror the real screen's layout. */
export function LoadingStateBlock() {
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="gap-6 px-5 pt-4">
        {/* Header */}
        <View className="gap-2">
          <Skeleton className="h-6 w-44 rounded-md" />
          <Skeleton className="h-4 w-28 rounded-md" />
        </View>

        {/* Stat cards */}
        <View className="flex-row gap-3">
          <Skeleton className="h-24 flex-1 rounded-2xl" />
          <Skeleton className="h-24 flex-1 rounded-2xl" />
        </View>

        {/* Chart card */}
        <Skeleton className="h-40 w-full rounded-2xl" />

        {/* List rows */}
        <View className="gap-4 pt-1">
          {Array.from({ length: 4 }).map((_, i) => (
            <View key={i} className="flex-row items-center gap-3">
              <Skeleton className="h-11 w-11 rounded-full" />
              <View className="flex-1 gap-2">
                <Skeleton className="h-4 w-3/4 rounded-md" />
                <Skeleton className="h-3 w-1/2 rounded-md" />
              </View>
              <Skeleton className="h-4 w-10 rounded-md" />
            </View>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}
