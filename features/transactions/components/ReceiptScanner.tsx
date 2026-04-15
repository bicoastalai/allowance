import { Alert, TouchableOpacity, Text, View, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useParseReceipt } from '../hooks/useParseReceipt';
import type { ParsedReceipt } from '../types';

type Props = {
  onParsed: (result: ParsedReceipt) => void;
};

/**
 * Camera button that launches the image picker, sends the photo to GPT-4o vision,
 * and calls onParsed with the extracted amount, vendor, and category.
 * Shows a scanning indicator while the request is in flight.
 */
export function ReceiptScanner({ onParsed }: Props) {
  const { mutateAsync: parseReceipt, isPending } = useParseReceipt();

  async function handleScan() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (permission.status !== 'granted') {
      Alert.alert('Permission needed', 'Camera access is required to scan receipts.');
      return;
    }

    Alert.alert('Scan Receipt', 'Choose a source', [
      {
        text: 'Camera',
        onPress: () => launch('camera'),
      },
      {
        text: 'Photo Library',
        onPress: () => launch('library'),
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  async function launch(source: 'camera' | 'library') {
    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ['images'],
      base64: true,
      quality: 0.6,
      allowsEditing: false,
    };

    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options);

    if (result.canceled || !result.assets[0]?.base64) return;

    const { base64, mimeType } = result.assets[0];

    try {
      const parsed = await parseReceipt({ base64: base64!, mimeType: mimeType ?? 'image/jpeg' });
      onParsed(parsed);
    } catch {
      Alert.alert('Could not read receipt', 'Please enter the details manually.');
    }
  }

  if (isPending) {
    return (
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          paddingVertical: 14,
          borderRadius: 12,
          backgroundColor: '#18181b',
          borderWidth: 1,
          borderColor: '#27272a',
          marginBottom: 20,
        }}
      >
        <ActivityIndicator size="small" color="#22c55e" />
        <Text style={{ color: '#a1a1aa', fontSize: 14 }}>Reading receipt…</Text>
      </View>
    );
  }

  return (
    <TouchableOpacity
      onPress={handleScan}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: '#18181b',
        borderWidth: 1,
        borderColor: '#27272a',
        marginBottom: 20,
      }}
    >
      <Text style={{ fontSize: 18 }}>📷</Text>
      <Text style={{ color: '#a1a1aa', fontSize: 14, fontWeight: '500' }}>Scan Receipt</Text>
    </TouchableOpacity>
  );
}
