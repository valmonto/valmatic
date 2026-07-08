import { useState, type ReactNode } from 'react';
import { Controller, useForm, type Resolver } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, View } from 'react-native';
import { SafeAreaView } from '@/shared/components/safe-area-view';
import { AxiosError } from 'axios';
import { Lock, Mail, type LucideIcon } from 'lucide-react-native';
import { LoginRequestSchema, type LoginRequest } from '@pkg/contracts';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { cn } from '@/shared/lib/utils';
import { useAuthStore } from '@/shared/auth/auth-store';

// Dep-free react-hook-form resolver backed by the shared Zod contract.
const resolver: Resolver<LoginRequest> = (values) => {
  const result = LoginRequestSchema.safeParse(values);
  if (result.success) {
    return { values: result.data, errors: {} };
  }
  const errors: Record<string, { type: string; message: string }> = {};
  for (const issue of result.error.issues) {
    const key = String(issue.path[0] ?? '');
    if (key && !errors[key]) {
      errors[key] = { type: 'validation', message: issue.message };
    }
  }
  return { values: {}, errors: errors as never };
};

function messageForError(error: unknown): string {
  if (error instanceof AxiosError) {
    if (error.response) return 'Incorrect email or password.';
    return 'Could not reach the server. Check your connection.';
  }
  return 'Something went wrong. Please try again.';
}

/** An input row with a leading icon, rounded surface, and error state. */
function Field({
  icon,
  error,
  children,
}: {
  icon: LucideIcon;
  error?: string;
  children: ReactNode;
}) {
  return (
    <View className="gap-1.5">
      <View
        className={cn(
          'h-13 flex-row items-center gap-3 rounded-2xl border border-border bg-card px-4',
          error && 'border-destructive'
        )}
      >
        <Icon as={icon} size={18} className="text-muted-foreground" />
        {children}
      </View>
      {error ? <Text className="px-1 text-xs font-medium text-destructive">{error}</Text> : null}
    </View>
  );
}

export default function LoginScreen() {
  const { t } = useTranslation();
  const signIn = useAuthStore((s) => s.signIn);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginRequest>({
    resolver,
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      await signIn(values);
      // On success the root auth gate redirects to the home screen.
    } catch (error) {
      setServerError(messageForError(error));
    }
  });

  const fieldClassName = 'h-full flex-1 border-0 bg-transparent px-0 text-base shadow-none';

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View className="flex-1 justify-center gap-10 px-6">
          {/* Brand + heading */}
          <View className="items-center gap-5">
            <View className="size-16 items-center justify-center rounded-3xl bg-primary shadow-lg shadow-primary/40">
              <Text className="text-3xl font-bold text-primary-foreground">V</Text>
            </View>
            <View className="items-center gap-1.5">
              <Text variant="h1" className="text-3xl">
                {t('auth.welcomeBack')}
              </Text>
              <Text variant="muted" className="text-center text-base">
                {t('auth.signInToAccount')}
              </Text>
            </View>
          </View>

          {/* Form */}
          <View className="gap-3.5">
            <Field icon={Mail} error={errors.email?.message}>
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    className={fieldClassName}
                    placeholder={t('auth.email')}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    autoCapitalize="none"
                    autoComplete="email"
                    keyboardType="email-address"
                    editable={!isSubmitting}
                  />
                )}
              />
            </Field>

            <Field icon={Lock} error={errors.password?.message}>
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    className={fieldClassName}
                    placeholder={t('auth.password')}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    secureTextEntry
                    autoComplete="current-password"
                    editable={!isSubmitting}
                    onSubmitEditing={onSubmit}
                  />
                )}
              />
            </Field>

            {serverError ? (
              <View className="rounded-xl bg-destructive/10 px-4 py-3">
                <Text className="text-sm font-medium text-destructive">{serverError}</Text>
              </View>
            ) : null}

            <Button
              onPress={onSubmit}
              disabled={isSubmitting}
              className="mt-2 h-13 rounded-2xl shadow-lg shadow-primary/25"
            >
              <Text className="text-base font-semibold">
                {isSubmitting ? t('auth.signingIn') : t('auth.signIn')}
              </Text>
            </Button>
          </View>

          {/* Footer */}
          <View className="flex-row items-center justify-center gap-1">
            <Text variant="muted">{t('auth.dontHaveAccount')}</Text>
            <Text className="font-semibold text-primary">{t('auth.signUp')}</Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
