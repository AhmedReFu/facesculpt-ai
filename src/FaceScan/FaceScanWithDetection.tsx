import { IMAGE_UPLOAD, IPA_BASE } from '@env';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    BackHandler,
    Button,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Frame, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import { Face, Camera as FaceCamera } from 'react-native-vision-camera-face-detector';
import tw from 'twrnc';
import { Toast, useToast } from '../hooks/useToost';

const API_BASE_URL = IPA_BASE;
const API_ENDPOINTS = {
    IMAGE_UPLOAD: IMAGE_UPLOAD,
};

const MIN_FACE_RATIO = 0.20;
const MAX_FACE_RATIO = 0.35;

type FaceStatus =
    | 'NO_FACE'
    | 'MULTIPLE_FACES'
    | 'TOO_FAR'
    | 'TOO_CLOSE'
    | 'FACE_NOT_CLEAR'
    | 'OK';

const FaceScanWithDetection = () => {
    const navigation = useNavigation();
    const device = useCameraDevice('front');
    const { hasPermission, requestPermission } = useCameraPermission();
    const cameraRef = useRef<any>(null);
    const toast = useToast();

    const [uploading, setUploading] = useState(false);
    const [circleProgress, setCircleProgress] = useState<number>(0);
    const [isScanning, setIsScanning] = useState<boolean>(false);
    const [faceStatus, setFaceStatus] = useState<FaceStatus>('NO_FACE');
    const [faces, setFaces] = useState<Face[]>([]);

    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    // ✅ Hardware back should go DailyTrack (NOT Auth)
    useFocusEffect(
        useCallback(() => {
            const onBackPress = () => {
                // Option A (recommended): reset stack so Auth is not behind
                (navigation as any).reset({
                    index: 0,
                    routes: [{ name: 'DailyTrack' }],
                });

                // Option B (if you want only navigate):
                // (navigation as any).navigate('DailyTrack');

                return true; // block default back
            };

            const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
            return () => sub.remove();
        }, [navigation])
    );

    // ---- Face detector options ----
    const faceDetectionOptions = useRef<any>({
        performanceMode: 'fast',
        landmarkMode: 'all',
        contourMode: 'none',
        classificationMode: 'all',
        minFaceSize: 0.2,
        trackingEnabled: true,
    }).current;

    // ---- Camera permission ----
    useEffect(() => {
        if (!hasPermission) {
            requestPermission();
        }
    }, [hasPermission, requestPermission]);

    // ---- Helpers ----
    const probOk = (value: number | null | undefined, min = 0.2) => {
        if (value == null) return false;
        return value >= min;
    };

    const isFaceClear = (face: Face) => {
        const lm: any = face.landmarks;
        if (!lm) return false;

        const hasEyes = lm.LEFT_EYE && lm.RIGHT_EYE;
        const hasNose = lm.NOSE_BASE;
        const hasMouth =
            lm.MOUTH_LEFT && lm.MOUTH_RIGHT && (lm.MOUTH_BOTTOM || lm.MOUTH_TOP);
        const hasEars = lm.LEFT_EAR && lm.RIGHT_EAR;

        if (!hasEyes || !hasNose || !hasMouth || !hasEars) {
            return false;
        }

        const leftEyeOpen = (face as any).leftEyeOpenProbability;
        const rightEyeOpen = (face as any).rightEyeOpenProbability;

        if (!probOk(leftEyeOpen, 0.6)) return false;
        if (!probOk(rightEyeOpen, 0.6)) return false;

        return true;
    };

    const evaluateFaceDistance = (face: Face, frame: Frame): FaceStatus => {
        const { width, height } = face.bounds;
        const faceArea = width * height;
        const frameArea = frame.width * frame.height;
        const ratio = faceArea / frameArea;

        if (ratio < MIN_FACE_RATIO) return 'TOO_FAR';
        if (ratio > MAX_FACE_RATIO) return 'TOO_CLOSE';
        return 'OK';
    };

    const resetProgress = () => {
        setCircleProgress(0);
    };

    // ---- Face detection callback ----
    const handleFacesDetection = (facesDetected: Face[], frame: Frame) => {
        if (!isScanning) return;

        try {
            setFaces(facesDetected);

            if (!facesDetected || facesDetected.length === 0) {
                setFaceStatus('NO_FACE');
                resetProgress();
                return;
            }

            if (facesDetected.length !== 1) {
                setFaceStatus('MULTIPLE_FACES');
                resetProgress();
                return;
            }

            const face = facesDetected[0];

            if (!isFaceClear(face)) {
                setFaceStatus('FACE_NOT_CLEAR');
                resetProgress();
                return;
            }

            const distanceStatus = evaluateFaceDistance(face, frame);
            if (distanceStatus !== 'OK') {
                setFaceStatus(distanceStatus);
                resetProgress();
                return;
            }

            setFaceStatus('OK');
        } catch (e) {
            console.error('face detection error:', e);
            setFaceStatus('FACE_NOT_CLEAR');
            resetProgress();
        }
    };

    // ---- Progress ring animation ----
    useEffect(() => {
        if (!isScanning) {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            resetProgress();
            return;
        }

        intervalRef.current = setInterval(() => {
            if (faceStatus === 'OK') {
                setCircleProgress(prev => {
                    const next = prev + 1.5;
                    if (next >= 100) {
                        if (intervalRef.current) {
                            clearInterval(intervalRef.current);
                            intervalRef.current = null;
                        }
                        setTimeout(() => {
                            takePicture();
                        }, 200);
                        return 100;
                    }
                    return next;
                });
            } else {
                resetProgress();
            }
        }, 50);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [isScanning, faceStatus]);

    const startScan = useCallback(() => {
        setCircleProgress(0);
        setFaceStatus('NO_FACE');
        setIsScanning(true);
        toast.show({
            message: 'Center your face in the frame and hold still.',
            type: 'warning',
            style: 'top',
            duration: 2000,
        });
    }, [toast]);

    // ---- Capture + upload ----
    const takePicture = async () => {
        if (!cameraRef.current) return;

        try {
            setUploading(true);
            setIsScanning(false);

            const accessToken = await AsyncStorage.getItem('token');

            if (!accessToken) {
                toast.show({
                    message: 'Authentication required. Please sign in to continue.',
                    type: 'warning',
                    style: 'center',
                    buttons: [
                        {
                            text: 'OK',
                            action: 'custom',
                            onPress: () => (navigation as any).navigate('Auth'),
                        },
                    ],
                });
                setUploading(false);
                return;
            }

            const photo = await cameraRef.current.takePhoto({
                quality: 0.8,
                enableShutterSound: false,
            });

            if (!photo) {
                throw new Error('Failed to capture photo. Please try again.');
            }

            console.log('Photo captured:', photo.path);

            await new Promise(resolve => setTimeout(resolve, 1200));

            const formData = new FormData();
            formData.append(
                'image',
                {
                    uri: `file://${photo.path}`,
                    type: 'image/jpeg',
                    name: 'face-scan.jpg',
                } as any,
            );

            const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.IMAGE_UPLOAD}`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'multipart/form-data',
                },
                body: formData,
            });

            const result = await response.json();
            console.log('Upload response:', result);

            if (response.status === 401) {
                await AsyncStorage.removeItem('token');
                toast.show({
                    message: 'Session expired. Please sign in again.',
                    type: 'error',
                    style: 'center',
                    buttons: [
                        {
                            text: 'OK',
                            action: 'custom',
                            onPress: () => (navigation as any).navigate('Auth'),
                        },
                    ],
                });
                setUploading(false);
                return;
            }

            if (response.ok && result.success) {
                toast.show({
                    message: 'Face scan completed successfully. ✓',
                    type: 'success',
                    style: 'top',
                    duration: 2000,
                });

                setTimeout(() => {
                    setUploading(false);
                    (navigation as any).replace('FaceMetrics');
                }, 1000);
                return;
            } else {
                throw new Error(result.message || 'Failed to upload image.');
            }
        } catch (error: any) {
            console.error('Error in takePicture:', error);
            setUploading(false);

            toast.show({
                message: error?.message || 'Something went wrong. Please try again.',
                type: 'error',
                style: 'center',
                buttons: [{ text: 'OK', action: 'dismiss' }],
            });
            return;
        }
    };

    // ---- Status texts ----
    const statusTextMap: Record<FaceStatus, { text: string; color: string }> = {
        NO_FACE: {
            text: 'No face detected. Please move your face into the frame.',
            color: '#ff4d4d',
        },
        MULTIPLE_FACES: {
            text: 'More than one face detected. Make sure only your face is visible.',
            color: '#ff4d4d',
        },
        TOO_FAR: {
            text: 'You are too far from the camera. Move a little closer.',
            color: '#ffcc00',
        },
        TOO_CLOSE: {
            text: 'You are too close to the camera. Move slightly back.',
            color: '#ffcc00',
        },
        FACE_NOT_CLEAR: {
            text:
                'Your face is not clear. Keep your eyes, nose, lips and both ears fully visible with nothing covering your face.',
            color: '#ff4d4d',
        },
        OK: {
            text: 'Great! Hold still while we scan your face. ✅',
            color: '#00ff5e',
        },
    };

    // ---- Loading / permission / device ----
    if (!device) {
        return (
            <View style={styles.container}>
                <Text style={styles.message}>Loading camera...</Text>
            </View>
        );
    }

    if (!hasPermission) {
        return (
            <View style={styles.container}>
                <Text style={styles.message}>
                    Camera access is required to perform a face scan.
                </Text>
                <Button title="Grant Camera Permission" onPress={requestPermission} />
            </View>
        );
    }

    // ---- Main UI ----
    return (
        <View style={styles.fullScreen}>
            <StatusBar style="light" />

            <View style={styles.overlay}>
                {/* Header */}
                <View style={tw`bg-black`}>
                    <View style={styles.header}>
                        <Text style={tw`text-white text-2xl font-bold`}>Face Scan</Text>

                        {/* Close button -> DailyTrack */}
                        <TouchableOpacity
                            onPress={() =>
                                (navigation as any).reset({
                                    index: 0,
                                    routes: [{ name: 'DailyTrack' }],
                                })
                            }
                            style={styles.closeButton}
                        >
                            <Ionicons name="close" size={28} color="white" />
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.instructions}>
                        Align your face inside the circle{'\n'}and keep it steady.
                    </Text>

                    {isScanning && (
                        <Text style={[styles.progressText, { color: statusTextMap[faceStatus].color }]}>
                            {statusTextMap[faceStatus].text}
                        </Text>
                    )}
                </View>

                {/* Camera preview */}
                <FaceCamera
                    ref={cameraRef}
                    style={styles.camera}
                    device={device}
                    isActive={true}
                    photo={true}
                    faceDetectionCallback={handleFacesDetection}
                    faceDetectionOptions={faceDetectionOptions}
                />

                {/* Ring + center dot overlay */}
                <View style={StyleSheet.absoluteFill} pointerEvents="none">
                    <View style={styles.faceOutlineContainer}>
                        <View style={styles.circleProgressContainer}>
                            {Array.from({ length: 60 }).map((_, index) => {
                                const angle = index * 6 - 90;
                                const isActive = isScanning && (index / 60) * 100 <= circleProgress;

                                return (
                                    <View
                                        key={index}
                                        style={[
                                            styles.progressSegment,
                                            {
                                                transform: [{ rotate: `${angle}deg` }, { translateX: 140 }],
                                                backgroundColor: isActive ? '#00FF00' : 'rgba(255,255,255,0.2)',
                                            },
                                        ]}
                                    />
                                );
                            })}

                            <View style={styles.centerDot} />
                        </View>
                    </View>

                    {/* Percentage text */}
                    {isScanning && (
                        <View style={styles.progressContainer}>
                            {circleProgress < 100 && faceStatus === 'OK' && (
                                <Text style={styles.progressPercent}>{Math.round(circleProgress)}%</Text>
                            )}
                        </View>
                    )}
                </View>

                {/* Bottom capture button */}
                <View style={styles.bottomSection}>
                    <TouchableOpacity
                        style={[styles.captureButton, (uploading || isScanning) && styles.captureButtonDisabled]}
                        onPress={startScan}
                        disabled={uploading || isScanning}
                    >
                        <View style={styles.captureButtonInner}>
                            {uploading || isScanning ? (
                                <ActivityIndicator size="large" color="white" />
                            ) : (
                                <MaterialIcons name="camera-alt" size={32} color="white" />
                            )}
                        </View>
                    </TouchableOpacity>
                </View>

                {uploading && (
                    <View style={styles.uploadingOverlay}>
                        <Text style={styles.uploadingText}>Analyzing your face...</Text>
                    </View>
                )}
            </View>

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
    circleProgressContainer: {
        width: 350,
        height: 350,
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
    },
    progressSegment: {
        position: 'absolute',
        width: 18,
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
        margin: 5,
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

export default FaceScanWithDetection;
