import { IMAGE_UPLOAD, IPA_BASE } from '@env';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { CameraType, CameraView, useCameraPermissions } from 'expo-camera';
import { StatusBar } from 'expo-status-bar';
import React, { useRef, useState } from 'react';
import { ActivityIndicator, Alert, Button, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Ellipse } from 'react-native-svg';
import tw from "twrnc";

const API_BASE_URL = IPA_BASE;
const API_ENDPOINTS = {
    IMAGE_UPLOAD: IMAGE_UPLOAD,
};

const FaceScan = () => {
    const navigation = useNavigation();
    const cameraRef = useRef<CameraView>(null);

    const [facing, setFacing] = useState<CameraType>('front');
    const [permission, requestPermission] = useCameraPermissions();
    const [uploading, setUploading] = useState(false);

    if (!permission) {
        return <View />;
    }

    if (!permission.granted) {
        return (
            <View style={styles.container}>
                <Text style={styles.message}>We need your permission to show the camera</Text>
                <Button onPress={requestPermission} title="Grant Permission" />
            </View>
        );
    }

    const toggleCameraFacing = () => {
        setFacing(current => (current === 'back' ? 'front' : 'back'));
    };

    // Capture photo and upload in one flow
    const takePicture = async () => {
        if (cameraRef.current) {
            try {
                setUploading(true);

                // Get access token from AsyncStorage
                const accessToken = await AsyncStorage.getItem('token');

                if (!accessToken) {
                    Alert.alert(
                        'Authentication Required',
                        'Please log in to continue',
                        [
                            {
                                text: 'OK',
                                onPress: () => (navigation as any).replace('Login')
                            }
                        ]
                    );
                    setUploading(false);
                    return;
                }

                // Step 1: Capture the photo
                const photo = await cameraRef.current.takePictureAsync({
                    quality: 0.8,
                    shutterSound: false,
                    base64: false,
                    exif: false,
                });

                if (!photo) {
                    throw new Error('Failed to capture photo');
                }

                console.log('Photo captured:', photo.uri);

                // Step 2: Upload to server with Bearer token
                const formData = new FormData();
                formData.append('image', {
                    uri: photo.uri,
                    type: 'image/jpeg',
                    name: 'face-scan.jpg',
                } as any);

                const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.IMAGE_UPLOAD}`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'multipart/form-data',
                    },
                    body: formData,
                });

                const result = await response.json();
                console.log('Upload response:', result);

                // Handle different response statuses
                if (response.status === 401) {
                    // Token expired or invalid
                    await AsyncStorage.removeItem('token');
                    Alert.alert(
                        'Session Expired',
                        'Please log in again',
                        [
                            {
                                text: 'OK',
                                onPress: () => (navigation as any).replace('Login')
                            }
                        ]
                    );
                    return;
                }

                if (response.ok && result.success) {
                    // Step 3: Navigate to FaceMetrics with the scan data
                    (navigation as any).navigate('FaceMetrics');
                } else {
                    throw new Error(result.message || 'Upload failed');
                }

            } catch (error) {
                console.error('Error in takePicture:', error);
                Alert.alert(
                    'Error',
                    error instanceof Error ? error.message : 'Failed to process image. Please try again.'
                );
            } finally {
                setUploading(false);
            }
        }
    };

    return (
        <View style={styles.fullScreen}>
            <StatusBar style='light' />

            <View style={styles.overlay}>
                <View style={tw`bg-black`}>
                    <View style={styles.header}>
                        <Text style={tw`text-white text-2xl font-bold`}>Face Scan</Text>
                        <TouchableOpacity
                            onPress={() => (navigation as any).navigate("DailyTrack")}
                            style={styles.closeButton}
                        >
                            <Ionicons name="close" size={28} color="white" />
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.instructions}>
                        Position your face within the outline{'\n'}and hold still
                    </Text>
                </View>

                <CameraView
                    ref={cameraRef}
                    style={styles.camera}
                    facing={facing}
                >
                    <View style={styles.faceOutlineContainer}>
                        <Svg height="400" width="280" style={styles.svg}>
                            <Ellipse
                                cx="140"
                                cy="200"
                                rx="110"
                                ry="190"
                                stroke="white"
                                strokeWidth="3"
                                fill="transparent"
                            />
                            <Circle cx="100" cy="180" r="4" fill="white" />
                            <Circle cx="190" cy="180" r="4" fill="white" />
                            <Circle cx="140" cy="250" r="4" fill="white" />
                            <Circle cx="100" cy="300" r="4" fill="white" />
                            <Circle cx="180" cy="300" r="4" fill="white" />
                        </Svg>
                    </View>
                </CameraView>

                <View style={styles.bottomSection}>
                    <TouchableOpacity
                        style={[
                            styles.captureButton,
                            uploading && styles.captureButtonDisabled
                        ]}
                        onPress={takePicture}
                        disabled={uploading}
                    >
                        <View style={styles.captureButtonInner}>
                            {uploading ? (
                                <ActivityIndicator size="large" color="white" />
                            ) : (
                                    <MaterialIcons name="camera-alt" size={32} color="white" />
                            )}
                        </View>
                    </TouchableOpacity>

                    {!uploading && (
                        <TouchableOpacity
                            style={styles.flipButton}
                            onPress={toggleCameraFacing}
                        >
                            <Ionicons name="camera-reverse" size={32} color="white" />
                        </TouchableOpacity>
                    )}
                </View>

                {uploading && (
                    <View style={styles.uploadingOverlay}>
                        <Text style={styles.uploadingText}>Analyzing your face...</Text>
                    </View>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    fullScreen: {
        flex: 1,
        backgroundColor: '#000',
    },
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#0f1418',
    },
    message: {
        textAlign: 'center',
        paddingBottom: 10,
        color: 'white',
        fontSize: 16,
    },
    camera: {
        flex: 1,
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0)',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 56,
        paddingHorizontal: 20,
        position: 'relative',
    },
    closeButton: {
        position: 'absolute',
        left: 20,
        top: 56,
    },
    instructions: {
        color: '#9CA3AF',
        fontSize: 16,
        textAlign: 'center',
        marginTop: 24,
        marginHorizontal: 60,
        marginVertical: 60,
        lineHeight: 20,
    },
    faceOutlineContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: -40,
    },
    svg: {
        overflow: 'visible',
    },
    bottomSection: {
        alignItems: 'center',
        paddingVertical: 70,
        position: 'relative',
    },
    captureButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(96, 165, 250, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: 'rgba(96, 165, 250, 0.5)',
    },
    captureButtonDisabled: {
        opacity: 0.6,
    },
    captureButtonInner: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#60A5FA',
        justifyContent: 'center',
        alignItems: 'center',
    },
    flipButton: {
        position: 'absolute',
        right: 40,
        top: 24,
        opacity: 0.8,
    },
    uploadingOverlay: {
        position: 'absolute',
        bottom: 150,
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    uploadingText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
    },
});

export default FaceScan;