import React, { useEffect, useRef, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import { Camera, useCameraDevice, useCameraPermission, useFrameProcessor } from 'react-native-vision-camera';
import { scanFaces } from 'vision-camera-face-detector';

interface FaceDetectionCameraProps {
  onCapture?: (path: string) => void;
}

export default function FaceDetectionCamera({ onCapture }: FaceDetectionCameraProps) {
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('front');
  const cameraRef = useRef<Camera>(null);
  const [isActive, setIsActive] = useState(true);

  // Use shared value for worklet
  const messageValue = useSharedValue('Align your face');
  const [message, setMessage] = useState('Align your face');

  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission]);

  useEffect(() => {
    return () => {
      setIsActive(false);
    };
  }, []);

  // Update React state from shared value
  useEffect(() => {
    const interval = setInterval(() => {
      setMessage(messageValue.value);
    }, 100);

    return () => clearInterval(interval);
  }, []);

  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';

    const faces = scanFaces(frame);

    if (faces.length === 0) {
      messageValue.value = 'No face detected';
      return;
    }

    const face = faces[0];
    const boxWidth = face.bounds.width;
    const boxHeight = face.bounds.height;
    const faceArea = boxWidth * boxHeight;
    const frameArea = frame.width * frame.height;
    const ratio = faceArea / frameArea;

    // Distance check based on face width
    if (boxWidth < 150) {
      messageValue.value = 'Move closer to camera';
    } else if (boxWidth > 350) {
      messageValue.value = 'Move back from camera';
    } else if (face.yawAngle && face.yawAngle > 20) {
      messageValue.value = 'Turn head right';
    } else if (face.yawAngle && face.yawAngle < -20) {
      messageValue.value = 'Turn head left';
    } else if (face.rollAngle && Math.abs(face.rollAngle) > 15) {
      messageValue.value = 'Keep head straight';
    } else {
      messageValue.value = 'Perfect position ✓';
    }
  }, []);

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePhoto({
          flash: 'off',
        });
        console.log('Photo path:', photo.path);
        onCapture?.(photo.path);
        Alert.alert('Success', 'Photo captured successfully!');
      } catch (error) {
        console.error('Error taking picture:', error);
        Alert.alert('Error', 'Failed to capture photo');
      }
    }
  };

  if (!hasPermission) {
    return (
      <View style={styles.center}>
        <Text style={styles.permissionText}>
          Camera permission required
        </Text>
        <TouchableOpacity onPress={requestPermission} style={styles.permissionButton}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>No camera device found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={isActive}
        photo={true}
        frameProcessor={frameProcessor}
      />

      {/* Face Detection Message */}
      <View style={styles.messageOverlay}>
        <Text style={styles.messageText}>{message}</Text>
      </View>

      {/* Guide Frame */}
      <View style={styles.guideFrame} />

      {/* Capture Button */}
      <View style={styles.captureContainer}>
        <TouchableOpacity onPress={takePicture} style={styles.captureButton}>
          <View style={styles.captureButtonInner} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  messageOverlay: {
    position: 'absolute',
    top: 80,
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    zIndex: 10,
  },
  messageText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  guideFrame: {
    position: 'absolute',
    top: '25%',
    alignSelf: 'center',
    width: 250,
    height: 320,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 150,
    zIndex: 5,
  },
  captureContainer: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    zIndex: 10,
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#fff',
  },
  captureButtonInner: {
    width: 55,
    height: 55,
    borderRadius: 28,
    backgroundColor: '#fff',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    paddingHorizontal: 40,
  },
  permissionText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 24,
  },
  errorText: {
    color: '#ff4444',
    fontSize: 16,
    textAlign: 'center',
  },
  permissionButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});