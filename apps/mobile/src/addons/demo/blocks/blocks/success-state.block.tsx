import { Button } from '@/components/ui/button';
import { DataList } from '@/components/ui/data-list';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { SafeAreaView } from '@/shared/components/safe-area-view';
import { LinearGradient } from 'expo-linear-gradient';
import { Check } from 'lucide-react-native';
import { View } from 'react-native';

/** Success / confirmation — celebratory hero, receipt summary, and Done. */
export function SuccessStateBlock() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 items-center justify-center gap-7 px-8">
        <View className="items-center justify-center">
          <LinearGradient
            colors={['#10b981', 'transparent']}
            style={{
              position: 'absolute',
              width: 200,
              height: 200,
              borderRadius: 100,
              opacity: 0.28,
            }}
          />
          <LinearGradient
            colors={['#10b981', '#059669']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              width: 100,
              height: 100,
              borderRadius: 50,
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#10b981',
              shadowOpacity: 0.45,
              shadowRadius: 22,
              shadowOffset: { width: 0, height: 12 },
              elevation: 12,
            }}
          >
            <Icon as={Check} size={52} className="text-white" />
          </LinearGradient>
        </View>

        <View className="items-center gap-2">
          <Text variant="h1" className="text-2xl">
            Payment successful
          </Text>
          <Text variant="muted" className="max-w-xs text-center text-base leading-relaxed">
            Your Pro plan is now active. A receipt has been sent to your email.
          </Text>
        </View>

        <View className="w-full overflow-hidden rounded-2xl border border-border bg-card px-4">
          <DataList
            rows={[
              { label: 'Plan', value: 'Pro — annual' },
              { label: 'Amount', value: '$290.00' },
              { label: 'Date', value: 'Jul 8, 2026' },
            ]}
          />
        </View>
      </View>

      <View className="px-6 pb-4">
        <Button className="h-13 rounded-2xl shadow-lg shadow-primary/25">
          <Text className="text-base font-semibold">Done</Text>
        </Button>
      </View>
    </SafeAreaView>
  );
}
