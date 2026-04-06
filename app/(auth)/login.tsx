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

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);

    if (error) {
      setError(error.message);
    }
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-[#0a0a0a]"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View className="flex-1 justify-center px-6">
        <Text className="text-white text-3xl font-bold mb-2">Welcome back</Text>
        <Text className="text-zinc-400 text-base mb-10">Sign in to your account</Text>

        <View className="gap-4">
          <View>
            <Text className="text-zinc-400 text-sm mb-2">Email</Text>
            <TextInput
              className="bg-zinc-900 text-white rounded-xl px-4 py-4 text-base border border-zinc-800"
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

          <View>
            <Text className="text-zinc-400 text-sm mb-2">Password</Text>
            <TextInput
              className="bg-zinc-900 text-white rounded-xl px-4 py-4 text-base border border-zinc-800"
              placeholder="••••••••"
              placeholderTextColor="#52525b"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              textContentType="password"
            />
          </View>

          {error ? (
            <Text className="text-red-400 text-sm">{error}</Text>
          ) : null}

          <TouchableOpacity
            className="bg-[#22c55e] rounded-xl py-4 items-center mt-2"
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#0a0a0a" />
            ) : (
              <Text className="text-[#0a0a0a] font-semibold text-base">Sign in</Text>
            )}
          </TouchableOpacity>
        </View>

        <View className="flex-row justify-center mt-8">
          <Text className="text-zinc-400 text-sm">Don't have an account? </Text>
          <Link href="/(auth)/signup">
            <Text className="text-[#22c55e] text-sm font-medium">Sign up</Text>
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
