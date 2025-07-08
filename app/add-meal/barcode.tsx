import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { Camera, CameraView } from 'expo-camera';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft } from 'lucide-react-native';
import { apiService } from '@/services/api';
import { MealType } from '@/types/api';
import { useI18n } from '@/hooks/useI18n';

export default function BarcodeScreen() {
  const { t } = useI18n();
  const { type } = useLocalSearchParams<{ type: MealType }>();
  const { mealId } = useLocalSearchParams<{ mealId: string }>();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const scanningRef = useRef(false);

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanningRef.current) return;
    scanningRef.current = true;
    setScanned(true);

    try {
      const result = await apiService.getFoodByBarcode(data);

      if (result.id) {
        if (!result.quantity) {
          result.quantity = 100;
        }
        router.push({
          pathname: '/add-meal/results',
          params: {
            type,
            mealId: mealId,
            method: 'barcode',
            data: JSON.stringify([result]),
          },
        });
      } else {
        Alert.alert(t('common.error'), t('add_meal.product_not_found'), [
          { text: t('common.retry'), onPress: () => { setScanned(false); scanningRef.current = false; } },
          {
            text: t('add_meal.use_photo_instead'),
            onPress: () => router.replace(`/add-meal/camera?type=${type}&mealId=${mealId}`),
          },
        ]);
      }
    } catch (err) {
      Alert.alert(t('common.error'), t('add_meal.barcode_scan_failed'));
      setScanned(false);
      scanningRef.current = false;
    }
  };


  if (hasPermission === null) {
    return <Text>{t('add_meal.requesting_camera_permission')}</Text>;
  }

  if (hasPermission === false) {
    return <Text>{t('add_meal.no_camera_access')}</Text>;
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#3B82F6', '#2563EB']} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('add_meal.scan_barcode_title')}</Text>
      </LinearGradient>

      <CameraView
        style={StyleSheet.absoluteFillObject}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['qr', 'ean13', 'ean8', 'upc_a', 'upc_e', 'code128'],
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 2,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
  },
});
