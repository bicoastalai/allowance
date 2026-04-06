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

    const { error } = await supabase.auth.signUp({ email, password });

    setLoading(false);

    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
    }
  }

  if (success) {
    return (
      <View className="flex-1 bg-[#0a0a0a] justify-center px-6">
        <Text className="text-white text-3xl font-bold mb-3">Check your email</Text>
        <Text className="text-zinc-400 text-base leading-6 mb-8">
          We sent a confirmation link to{' '}
          <Text className="text-white">{email}</Text>. Open it to activate your account.
        </Text>
        <Link href="/(auth)/login">
          <Text className="text-[#22c55e] text-base font-medium">Back to sign in</Text>
        </Link>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-[#0a0a0a]"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 justify-center px-6 py-12">
          <Text className="text-white text-3xl font-bold mb-2">Create account</Text>
          <Text className="text-zinc-400 text-base mb-10">Start managing your money</Text>

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
                textContentType="newPassword"
              />
            </View>

            <View>
              <Text className="text-zinc-400 text-sm mb-2">Confirm password</Text>
              <TextInput
                className="bg-zinc-900 text-white rounded-xl px-4 py-4 text-base border border-zinc-800"
                placeholder="••••••••"
                placeholderTextColor="#52525b"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                textContentType="newPassword"
              />
            </View>

            {error ? (
              <Text className="text-red-400 text-sm">{error}</Text>
            ) : null}

            <TouchableOpacity
              className="bg-[#22c55e] rounded-xl py-4 items-center mt-2"
              onPress={handleSignup}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#0a0a0a" />
              ) : (
                <Text className="text-[#0a0a0a] font-semibold text-base">Create account</Text>
              )}
            </TouchableOpacity>
          </View>

          <View className="flex-row justify-center mt-8">
            <Text className="text-zinc-400 text-sm">Already have an account? </Text>
            <Link href="/(auth)/login">
              <Text className="text-[#22c55e] text-sm font-medium">Sign in</Text>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
