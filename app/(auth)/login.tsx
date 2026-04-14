import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Link } from 'expo-router';
import { supabase } from '@/lib/supabase';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }

    setError('');
    setLoading(true);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setLoading(false);

    if (authError) {
      setError(authError.message);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#0a0a0a' }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 24 }}>
        <Text style={{ color: '#ffffff', fontSize: 30, fontWeight: '700', marginBottom: 8 }}>
          Welcome back
        </Text>
        <Text style={{ color: '#a1a1aa', fontSize: 16, marginBottom: 40 }}>
          Sign in to your account
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

        <View style={{ marginBottom: 8 }}>
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
            textContentType="password"
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
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#0a0a0a" />
          ) : (
            <Text style={{ color: '#0a0a0a', fontWeight: '600', fontSize: 16 }}>
              Sign in
            </Text>
          )}
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 32 }}>
          <Text style={{ color: '#a1a1aa', fontSize: 14 }}>Don't have an account? </Text>
          <Link href="/(auth)/signup" asChild>
            <TouchableOpacity>
              <Text style={{ color: '#22c55e', fontSize: 14, fontWeight: '500' }}>
                Sign up
              </Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
