import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Link } from 'expo-router';
import { supabase } from '@/lib/supabase';

export default function SignupScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSignup() {
    if (!email || !password || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setError('');
    setLoading(true);

    const { error: authError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });

    setLoading(false);

    if (authError) {
      setError(authError.message);
    } else {
      setSuccess(true);
    }
  }

  if (success) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: '#0a0a0a',
          justifyContent: 'center',
          paddingHorizontal: 24,
        }}
      >
        <Text style={{ color: '#ffffff', fontSize: 30, fontWeight: '700', marginBottom: 12 }}>
          Check your email
        </Text>
        <Text style={{ color: '#a1a1aa', fontSize: 16, lineHeight: 26, marginBottom: 32 }}>
          We sent a confirmation link to{' '}
          <Text style={{ color: '#ffffff' }}>{email}</Text>. Open it to activate your account.
        </Text>
        <Link href="/(auth)/login" asChild>
          <TouchableOpacity>
            <Text style={{ color: '#22c55e', fontSize: 16, fontWeight: '500' }}>
              Back to sign in
            </Text>
          </TouchableOpacity>
        </Link>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#0a0a0a' }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            paddingHorizontal: 24,
            paddingVertical: 48,
          }}
        >
          <Text style={{ color: '#ffffff', fontSize: 30, fontWeight: '700', marginBottom: 8 }}>
            Create account
          </Text>
          <Text style={{ color: '#a1a1aa', fontSize: 16, marginBottom: 40 }}>
            Start managing your money
          </Text>

          <View style={{ marginBottom: 16 }}>
            <Text style={{ color: '#a1a1aa', fontSize: 14, marginBottom: 8 }}>Email</Text>
            <TextInput
              style={{
                backgroundColor: '#18181b',
                color: '#ffffff',
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 16,
                fontSize: 16,
                borderWidth: 1,
                borderColor: '#27272a',
              }}
              placeholder="you@example.com"
              placeholderTextColor="#52525b"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType="emailAddress"
            />
          </View>

          <View style={{ marginBottom: 16 }}>
            <Text style={{ color: '#a1a1aa', fontSize: 14, marginBottom: 8 }}>Password</Text>
            <TextInput
              style={{
                backgroundColor: '#18181b',
                color: '#ffffff',
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 16,
                fontSize: 16,
                borderWidth: 1,
                borderColor: '#27272a',
              }}
              placeholder="••••••••"
              placeholderTextColor="#52525b"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              textContentType="newPassword"
            />
          </View>

          <View style={{ marginBottom: 8 }}>
            <Text style={{ color: '#a1a1aa', fontSize: 14, marginBottom: 8 }}>
              Confirm password
            </Text>
            <TextInput
              style={{
                backgroundColor: '#18181b',
                color: '#ffffff',
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 16,
                fontSize: 16,
                borderWidth: 1,
                borderColor: '#27272a',
              }}
              placeholder="••••••••"
              placeholderTextColor="#52525b"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              textContentType="newPassword"
            />
          </View>

          {error !== '' && (
            <Text style={{ color: '#f87171', fontSize: 14, marginTop: 8, marginBottom: 4 }}>
              {error}
            </Text>
          )}

          <TouchableOpacity
            style={{
              backgroundColor: '#22c55e',
              borderRadius: 12,
              paddingVertical: 16,
              alignItems: 'center',
              marginTop: 24,
              opacity: loading ? 0.7 : 1,
            }}
            onPress={handleSignup}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#0a0a0a" />
            ) : (
              <Text style={{ color: '#0a0a0a', fontWeight: '600', fontSize: 16 }}>
                Create account
              </Text>
            )}
          </TouchableOpacity>

          <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 32 }}>
            <Text style={{ color: '#a1a1aa', fontSize: 14 }}>Already have an account? </Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity>
                <Text style={{ color: '#22c55e', fontSize: 14, fontWeight: '500' }}>
                  Sign in
                </Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
