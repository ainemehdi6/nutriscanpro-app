import { useState } from 'react';
import { View, Text, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Link, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/hooks/useI18n';
import Button from '@/components/Button';
import Input from '@/components/Input';
import { UserPlus } from 'lucide-react-native';

export default function SignupScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const { register } = useAuth();
  const { t } = useI18n();

  const validateForm = () => {
    const newErrors: {
      name?: string;
      email?: string;
      password?: string;
      confirmPassword?: string;
    } = {};

    if (!name.trim()) {
      newErrors.name = t('validation.name_required');
    }

    if (!email.trim()) {
      newErrors.email = t('validation.email_required');
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = t('validation.email_invalid');
    }

    if (!password.trim()) {
      newErrors.password = t('validation.password_required');
    } else if (password.length < 6) {
      newErrors.password = t('validation.password_min_length');
    }

    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = t('validation.confirm_password_required');
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = t('validation.passwords_not_match');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      await register(email.trim(), password, name.trim());
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert(t('auth.registration_failed'), error instanceof Error ? error.message : t('auth.try_again'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#F0FDF4', '#ECFDF5']}
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <UserPlus size={32} color="#22C55E" />
            </View>
            <Text style={styles.title}>{t('auth.join_app')}</Text>
            <Text style={styles.subtitle}>{t('auth.create_account_subtitle')}</Text>
          </View>

          <View style={styles.form}>
            <Input
              label={t('auth.full_name')}
              value={name}
              onChangeText={setName}
              placeholder={t('auth.full_name')}
              autoCapitalize="words"
              error={errors.name}
            />

            <Input
              label={t('auth.email')}
              value={email}
              onChangeText={setEmail}
              placeholder={t('auth.email')}
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
            />

            <Input
              label={t('auth.password')}
              value={password}
              onChangeText={setPassword}
              placeholder={t('auth.password')}
              secureTextEntry
              error={errors.password}
            />

            <Input
              label={t('auth.confirm_password')}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder={t('auth.confirm_password')}
              secureTextEntry
              error={errors.confirmPassword}
            />

            <Button
              title={loading ? t('auth.creating_account') : t('auth.create_account')}
              onPress={handleSignup}
              disabled={loading}
              style={styles.signupButton}
            />

            <View style={styles.linkContainer}>
              <Text style={styles.linkText}>
                {t('auth.have_account')}{' '}
                <Link href="/auth/login" style={styles.link}>
                  {t('auth.sign_in')}
                </Link>
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  form: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  signupButton: {
    marginTop: 8,
    marginBottom: 16,
  },
  linkContainer: {
    alignItems: 'center',
  },
  linkText: {
    fontSize: 14,
    color: '#6B7280',
  },
  link: {
    color: '#22C55E',
    fontWeight: '600',
  },
});