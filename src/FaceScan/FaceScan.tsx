import { IMAGE_UPLOAD, IPA_BASE } from '@env';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { CameraType, CameraView, useCameraPermissions } from 'expo-camera';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Button, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import tw from "twrnc";
import { Toast, useToast } from '../hooks/useToost';

const API_BASE_URL = IPA_BASE;
const API_ENDPOINTS = {
    IMAGE_UPLOAD: IMAGE_UPLOAD,
};

const FaceScan = () => {
    const navigation = useNavigation();
    const cameraRef = useRef<CameraView>(null);
    const toast = useToast();
    const [facing, setFacing] = useState<CameraType>('front');
    const [permission, requestPermission] = useCameraPermissions();
    const [uploading, setUploading] = useState(false);
    const [circleProgress, setCircleProgress] = useState<number>(0);
    const [isScanning, setIsScanning] = useState<boolean>(false);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    // Auto progress animation - completes in ~3 seconds
    useEffect(() => {
        if (!isScanning) {
            // Clean up interval if scanning stops
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            return;
        }

        intervalRef.current = setInterval(() => {
            setCircleProgress(prev => {
                const newProgress = prev + 1.5; // Adjust speed here (higher = faster)

                // Capture photo when progress reaches 100%
                if (newProgress >= 100) {
                    if (intervalRef.current) {
                        clearInterval(intervalRef.current);
                        intervalRef.current = null;
                    }
                    // Delay capture slightly for visual feedback
                    setTimeout(() => {
                        takePicture();
                    }, 200);
                    return 100;
                }

                return newProgress;
            });
        }, 50); // Update every 50ms for smooth animation

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [isScanning]);

    const toggleCameraFacing = () => {
        setFacing(current => (current === 'back' ? 'front' : 'back'));
    };

    const startScan = useCallback(() => {
        setCircleProgress(0);
        setIsScanning(true);
    }, []);

    // Capture photo and upload in one flow
    const takePicture = async () => {
        if (cameraRef.current) {
            try {
                setUploading(true);

                // Get access token from AsyncStorage
                const accessToken = await AsyncStorage.getItem('token');

                if (!accessToken) {
                    toast.show({
                        message: 'Authentication Required. Please log in to continue.',
                        type: 'warning',
                        style: 'center',
                        buttons: [
                            {
                                text: 'OK',
                                action: 'custom',
                                onPress: () => (navigation as any).navigate('Auth')
                            }
                        ]
                    });
                    setUploading(false);
                    setIsScanning(false);
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
                    toast.show({
                        message: 'Session Expired. Please log in again.',
                        type: 'error',
                        style: 'center',
                        buttons: [
                            {
                                text: 'OK',
                                action: 'custom',
                                onPress: () => (navigation as any).navigate('Auth')
                            }
                        ]
                    });
                    setUploading(false);
                    setIsScanning(false);
                    return;
                }

                if (response.ok && result.success) {
                    // Show success message
                    toast.show({
                        message: 'Face scan completed successfully! ✓',
                        type: 'success',
                        style: 'top',
                        duration: 2000
                    });

                    // Step 3: Navigate to FaceMetrics after showing success
                    setTimeout(() => {
                        setUploading(false);
                        setIsScanning(false);
                        (navigation as any).replace('FaceMetrics');
                    }, 1000);

                } else {
                    throw new Error(result.message || 'Upload failed');
                }

            } catch (error) {
                console.error('Error in takePicture:', error);
                setUploading(false);
                setIsScanning(false);

                toast.show({
                    message: 'Failed to process image. Please try again.',
                    type: 'error',
                    style: 'center',
                    buttons: [{ text: 'OK', action: 'dismiss' }]
                });
            }
        }
    };

    // Handle permission states AFTER all hooks are called
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

                    {isScanning && (<Text style={styles.progressText}>
                        {circleProgress >= 100
                            ? '✓ Scan Complete!'
                            : 'Please your face center and hold still while scanning...'}
                    </Text>)}
                </View>

                <CameraView
                    ref={cameraRef}
                    style={styles.camera}
                    facing={facing}
                >
                    <View style={styles.faceOutlineContainer}>
                        {/* Circular Progress Animation - Only shows when scanning */}

                        <View style={styles.circleProgressContainer}>
                            {Array.from({ length: 60 }).map((_, index) => {
                                const angle = (index * 6) - 90;
                                const isActive = (index / 60) * 100 <= circleProgress;

                                return (
                                    <View
                                        key={index}
                                        style={[
                                            styles.progressSegment,
                                            {
                                                transform: [
                                                    { rotate: `${angle}deg` },
                                                    { translateX: 140 }, // Adjusted for smaller circle
                                                ],
                                                backgroundColor: isActive ? '#00FF00' : 'rgba(255,255,255,0.3)',
                                            }
                                        ]}
                                    />
                                );
                            })}

                            {/* Center dot for better visual */}
                            {/* <View style={styles.centerDot} /> */}
                        </View>

                    </View>

                    {/* Progress indicator */}
                    {isScanning && (
                        <View style={styles.progressContainer}>

                            {circleProgress < 100 && (
                                <Text style={styles.progressPercent}>
                                    {Math.round(circleProgress)}%
                                </Text>
                            )}
                        </View>
                    )}
                </CameraView>

                <View style={styles.bottomSection}>
                    <TouchableOpacity
                        style={[
                            styles.captureButton,
                            (uploading || isScanning) && styles.captureButtonDisabled
                        ]}
                        onPress={startScan}
                        disabled={uploading || isScanning}
                    >
                        <View style={styles.captureButtonInner}>
                            {(uploading || isScanning) ? (
                                <ActivityIndicator size="large" color="white" />
                            ) : (
                                    <MaterialIcons name="camera-alt" size={32} color="white" />
                            )}
                        </View>
                    </TouchableOpacity>

                    {!(uploading || isScanning) && (
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

            {/* Toast Component */}
            <Toast
                style={toast.style}
                visible={toast.visible}
                message={toast.message}
                type={toast.type}
                fadeAnim={toast.fadeAnim}
                buttons={toast.buttons}
                onHide={toast.hide}
            />
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
        marginVertical: 20,
        lineHeight: 20,
    },
    faceOutlineContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: -20,
    },
    // Circular Progress Animation Styles - Adjusted size
    circleProgressContainer: {
        width: 350, // Reduced from 300
        height: 350, // Reduced from 300
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
    },
    progressSegment: {
        position: 'absolute',
        width: 18, // Reduced from 20
        height: 4,
        borderRadius: 2,
    },
    centerDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: 'rgba(255,255,255,0.5)',
    },
    progressContainer: {
        position: 'absolute',
        top: 80,
        left: 0,
        right: 0,
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    progressText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '600',
        textAlign: 'center',
        margin: 5
    },
    progressPercent: {
        color: '#00FF00',
        fontSize: 32,
        fontWeight: 'bold',
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