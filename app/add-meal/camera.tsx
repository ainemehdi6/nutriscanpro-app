import { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Camera, RotateCcw } from 'lucide-react-native';
import { apiService } from '@/services/api';
import { MealType } from '@/types/api';
import { useI18n } from '@/hooks/useI18n';

export default function CameraScreen() {
  const { t } = useI18n();
  const { type } = useLocalSearchParams<{ type: MealType }>();
  const { mealId } = useLocalSearchParams<{ mealId: string }>();
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [loading, setLoading] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  const handleGoBack = () => {
    router.back();
  };

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const takePicture = async () => {
    if (!cameraRef.current || loading) return;

    setLoading(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: true,
      });

      if (photo?.uri) {
        const result = await apiService.AnalyseItemByImage(photo.uri);

        if (result.foods) {
          router.push({
            pathname: '/add-meal/results',
            params: {
              type,
              mealId: mealId,
              method: 'camera',
              data: JSON.stringify(result.foods),
            },
          });
        } else {
          Alert.alert(
            t('common.error'),
            t('add_meal.analysis_failed'),
            [
              {
                text: t('common.retry'),
                onPress: () => setLoading(false),
              },
              {
                text: t('add_meal.use_text_instead'),
                onPress: () => router.replace(`/add-meal/description?type=${type}`),
              },
            ]
          );
        }
      }
    } catch (error) {
      console.error('Error taking picture:', error);
      Alert.alert(t('common.error'), t('add_meal.camera_error'));
      setLoading(false);
    }
  };


  if (!permission) {
    return (
      <View style={styles.container}>
        <Text>{t('add_meal.requesting_camera_permission')}</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#22C55E', '#16A34A']}
          style={styles.header}
        >
          <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
            <ArrowLeft size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('add_meal.take_photo_title')}</Text>
        </LinearGradient>

        <View style={styles.permissionContainer}>
          <Camera size={64} color="#9CA3AF" />
          <Text style={styles.permissionTitle}>{t('add_meal.camera_access_required')}</Text>
          <Text style={styles.permissionText}>
            {t('add_meal.camera_permission_desc')}
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>{t('add_meal.grant_permission')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#22C55E', '#16A34A']}
        style={styles.header}
      >
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <ArrowLeft size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('add_meal.take_photo_title')}</Text>
        <TouchableOpacity style={styles.flipButton} onPress={toggleCameraFacing}>
          <RotateCcw size={20} color="white" />
        </TouchableOpacity>
      </LinearGradient>

      <View style={styles.cameraContainer}>
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          facing={facing}
        />

        <View style={styles.overlay}>
          <Text style={styles.instructionText}>
            {loading ? t('add_meal.analyzing_image') : t('add_meal.position_meal')}
          </Text>

          <View style={styles.captureContainer}>
            <TouchableOpacity
              style={[styles.captureButton, loading && styles.captureButtonDisabled]}
              onPress={takePicture}
              disabled={loading}
            >
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
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
    flex: 1,
  },
  flipButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    flexDirection: 'column',
    justifyContent: 'space-between',
    padding: 20,
  },
  instructionText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 40,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 8,
    padding: 12,
  },
  captureContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  captureButtonDisabled: {
    opacity: 0.5,
  },
  captureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#22C55E',
  },
  webNotSupported: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#F8FAFC',
  },
  webTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  webText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#F8FAFC',
  },
  permissionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  permissionText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  permissionButton: {
    backgroundColor: '#22C55E',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});