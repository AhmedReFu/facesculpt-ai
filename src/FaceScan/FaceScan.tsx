import { IMAGE_UPLOAD, IPA_BASE } from '@env';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import React, {
    useCallback,
    useEffect,
    useRef,
    useState,
} from 'react';
import {
    ActivityIndicator,
    Button,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import {
    Frame,
    useCameraDevice,
    useCameraPermission,
} from 'react-native-vision-camera';
import {
    Face,
    Camera as FaceCamera,
} from 'react-native-vision-camera-face-detector';
import tw from 'twrnc';
import { Toast, useToast } from '../hooks/useToost';

const API_BASE_URL = IPA_BASE;
const API_ENDPOINTS = {
    IMAGE_UPLOAD: IMAGE_UPLOAD,
};

const MIN_FACE_RATIO = 0.2;
const MAX_FACE_RATIO = 0.35;

type FaceStatus =
    | 'NO_FACE'
    | 'MULTIPLE_FACES'
    | 'TOO_FAR'
    | 'TOO_CLOSE'
    | 'FACE_NOT_CLEAR'
    | 'OK'
    | 'TURN_LEFT'
    | 'TURN_RIGHT'
    | 'LOOK_UP'
    | 'LOOK_DOWN'
    | 'LOOK_CENTER';

type ScanStep = 'CENTER' | 'LEFT' | 'RIGHT' | 'UP' | 'DOWN' | 'DONE';

const STEP_ORDER: ScanStep[] = ['CENTER', 'LEFT', 'RIGHT', 'UP', 'DOWN'];

const FaceScan = () => {
    const navigation = useNavigation();
    const device = useCameraDevice('front');
    const { hasPermission, requestPermission } = useCameraPermission();
    const cameraRef = useRef<any>(null);
    const toast = useToast();

    const [uploading, setUploading] = useState(false);
    const [circleProgress, setCircleProgress] = useState<number>(0);
    const [isScanning, setIsScanning] = useState<boolean>(false);
    const [isRecording, setIsRecording] = useState<boolean>(false);
    const [faceStatus, setFaceStatus] = useState<FaceStatus>('NO_FACE');
    const [currentStep, setCurrentStep] = useState<ScanStep>('CENTER');
    const [videoPath, setVideoPath] = useState<string | null>(null);

    const intervalRef = useRef<NodeJS.Timeout | null>(null);

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
    const probOk = (value: number | null | undefined, min = 0.3) => {
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

        if (!probOk(leftEyeOpen, 0.4)) return false;
        if (!probOk(rightEyeOpen, 0.4)) return false;

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

    const getHeadDirection = (face: Face): ScanStep | 'UNKNOWN' => {
        const yaw = (face as any).headEulerAngleY ?? 0; // left/right
        const pitch = (face as any).headEulerAngleX ?? 0; // up/down

        // tweak thresholds if needed
        if (Math.abs(yaw) < 10 && Math.abs(pitch) < 10) return 'CENTER';
        if (yaw < -15) return 'LEFT';
        if (yaw > 15) return 'RIGHT';
        if (pitch < -10) return 'UP';
        if (pitch > 10) return 'DOWN';
        return 'UNKNOWN';
    };

    const getDirectionStatus = (step: ScanStep): FaceStatus => {
        switch (step) {
            case 'CENTER':
                return 'LOOK_CENTER';
            case 'LEFT':
                return 'TURN_LEFT';
            case 'RIGHT':
                return 'TURN_RIGHT';
            case 'UP':
                return 'LOOK_UP';
            case 'DOWN':
                return 'LOOK_DOWN';
            default:
                return 'LOOK_CENTER';
        }
    };

    const isStepDirectionMatch = (step: ScanStep, dir: ScanStep | 'UNKNOWN') => {
        if (step === 'DONE') return true;
        if (dir === 'UNKNOWN') return false;
        return step === dir;
    };

    // ---- Start video recording ----
    const startVideoRecording = useCallback(async () => {
        if (!cameraRef.current || isRecording) return;

        try {
            setIsRecording(true);
            setUploading(true);

            const accessToken = await AsyncStorage.getItem('token');

            // if you want to require login before recording, uncomment this part
            /*
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
              setIsRecording(false);
              setUploading(false);
              return;
            }
            */

            cameraRef.current.startRecording({
                fileType: 'mp4',
                onRecordingFinished: async (video: { path: string }) => {
                    try {
                        console.log('Video recorded at:', video.path);
                        setVideoPath(video.path);
                        setIsRecording(false);
                        setUploading(false);

                        toast.show({
                            message: 'Face scan video saved locally.',
                            type: 'success',
                            style: 'top',
                            duration: 2000,
                        });

                        // ---- API upload logic (commented for now) ----
                        /*
                        const formData = new FormData();
                        formData.append(
                          'video',
                          {
                            uri: `file://${video.path}`,
                            type: 'video/mp4',
                            name: 'face-scan.mp4',
                          } as any,
                        );
            
                        const response = await fetch(
                          `${API_BASE_URL}${API_ENDPOINTS.IMAGE_UPLOAD}`,
                          {
                            method: 'POST',
                            headers: {
                              Authorization: `Bearer ${accessToken}`,
                              'Content-Type': 'multipart/form-data',
                            },
                            body: formData,
                          },
                        );
            
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
                          return;
                        }
            
                        if (response.ok && result.success) {
                          toast.show({
                            message: 'Face scan uploaded successfully. ✓',
                            type: 'success',
                            style: 'top',
                            duration: 2000,
                          });
            
                          setTimeout(() => {
                            (navigation as any).replace('FaceMetrics');
                          }, 1000);
                        } else {
                          throw new Error(result.message || 'Failed to upload video.');
                        }
                        */
                    } catch (error: any) {
                        console.error('Error after recording finished:', error);
                        setIsRecording(false);
                        setUploading(false);
                        toast.show({
                            message: error?.message || 'Something went wrong. Please try again.',
                            type: 'error',
                            style: 'center',
                            buttons: [{ text: 'OK', action: 'dismiss' }],
                        });
                    }
                },
                onRecordingError: (error: any) => {
                    console.error('Recording error:', error);
                    setIsRecording(false);
                    setUploading(false);
                    toast.show({
                        message: 'Recording error. Please try again.',
                        type: 'error',
                        style: 'center',
                        buttons: [{ text: 'OK', action: 'dismiss' }],
                    });
                },
            });
        } catch (err: any) {
            console.error('startVideoRecording error:', err);
            setIsRecording(false);
            setUploading(false);
        }
    }, [isRecording, navigation, toast]);

    const stopVideoRecording = useCallback(() => {
        if (cameraRef.current && isRecording) {
            try {
                cameraRef.current.stopRecording();
            } catch (e) {
                console.error('stopRecording error:', e);
            }
        }
    }, [isRecording]);

    // ---- Handle step completion ----
    const handleStepComplete = useCallback(() => {
        const idx = STEP_ORDER.indexOf(currentStep);
        if (idx === -1 || idx === STEP_ORDER.length - 1) {
            // all steps done
            setCurrentStep('DONE');
            setIsScanning(false);
            resetProgress();
            stopVideoRecording();
            toast.show({
                message: 'All angles captured. ✅',
                type: 'success',
                style: 'top',
                duration: 2000,
            });
        } else {
            const nextStep = STEP_ORDER[idx + 1];
            setCurrentStep(nextStep);
            resetProgress();
            toast.show({
                message: `Good! Now follow the next step.`,
                type: 'warning',
                style: 'top',
                duration: 1500,
            });
        }
    }, [currentStep, stopVideoRecording, toast]);

    // ---- Face detection callback ----
    const handleFacesDetection = (facesDetected: Face[], frame: Frame) => {
        if (!isScanning || currentStep === 'DONE' || isRecording === false) {
            // still detect while recording? you can adjust this
            if (!isScanning) return;
        }

        try {
            if (!facesDetected || facesDetected.length === 0) {
                setFaceStatus(prev => (prev === 'NO_FACE' ? prev : 'NO_FACE'));
                resetProgress();
                return;
            }

            if (facesDetected.length !== 1) {
                setFaceStatus(prev =>
                    prev === 'MULTIPLE_FACES' ? prev : 'MULTIPLE_FACES',
                );
                resetProgress();
                return;
            }

            const face = facesDetected[0];

            if (!isFaceClear(face)) {
                setFaceStatus(prev =>
                    prev === 'FACE_NOT_CLEAR' ? prev : 'FACE_NOT_CLEAR',
                );
                resetProgress();
                return;
            }

            const distanceStatus = evaluateFaceDistance(face, frame);
            if (distanceStatus !== 'OK') {
                setFaceStatus(distanceStatus);
                resetProgress();
                return;
            }

            const dir = getHeadDirection(face);

            if (!isStepDirectionMatch(currentStep, dir)) {
                const status = getDirectionStatus(currentStep);
                setFaceStatus(status);
                resetProgress();
                return;
            }

            // all good for this step
            setFaceStatus(prev => (prev === 'OK' ? prev : 'OK'));
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

        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
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
                            handleStepComplete();
                        }, 200);
                        return 100;
                    }
                    return next;
                });
            } else {
                if (circleProgress !== 0) {
                    resetProgress();
                }
            }
        }, 50);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [isScanning, faceStatus, handleStepComplete]);

    // ---- Start scan ----
    const startScan = useCallback(() => {
        setCircleProgress(0);
        setFaceStatus('NO_FACE');
        setCurrentStep('CENTER');
        setIsScanning(true);
        setVideoPath(null);

        toast.show({
            message: 'Center your face, then follow the angle steps.',
            type: 'warning',
            style: 'top',
            duration: 2500,
        });

        startVideoRecording();
    }, [startVideoRecording, toast]);

    // ---- Status texts ----
    const statusTextMap: Record<FaceStatus, { text: string; color: string }> = {
        NO_FACE: {
            text: 'No face detected. Move your face into the frame.',
            color: '#ff4d4d',
        },
        MULTIPLE_FACES: {
            text: 'More than one face detected. Make sure only your face is visible.',
            color: '#ff4d4d',
        },
        TOO_FAR: {
            text: 'Too far from camera. Move closer.',
            color: '#ffcc00',
        },
        TOO_CLOSE: {
            text: 'Too close to camera. Move slightly back.',
            color: '#ffcc00',
        },
        FACE_NOT_CLEAR: {
            text:
                'Face not clear. Keep eyes, nose, lips and both ears visible with nothing covering your face.',
            color: '#ff4d4d',
        },
        OK: {
            text: 'Great! Hold still for this angle. ✅',
            color: '#00ff5e',
        },
        TURN_LEFT: {
            text: 'Slowly turn your face to the LEFT.',
            color: '#60A5FA',
        },
        TURN_RIGHT: {
            text: 'Slowly turn your face to the RIGHT.',
            color: '#60A5FA',
        },
        LOOK_UP: {
            text: 'Gently look UP with your head.',
            color: '#60A5FA',
        },
        LOOK_DOWN: {
            text: 'Gently look DOWN with your head.',
            color: '#60A5FA',
        },
        LOOK_CENTER: {
            text: 'Look straight at the camera.',
            color: '#60A5FA',
        },
    };

    const stepLabelMap: Record<ScanStep, string> = {
        CENTER: 'Center',
        LEFT: 'Left',
        RIGHT: 'Right',
        UP: 'Up',
        DOWN: 'Down',
        DONE: 'Done',
    };

    const isStepCompleted = (step: ScanStep) => {
        if (currentStep === 'DONE') return true;
        const currentIndex = STEP_ORDER.indexOf(currentStep);
        const stepIndex = STEP_ORDER.indexOf(step);
        if (stepIndex === -1) return false;
        return stepIndex < currentIndex;
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
                        <TouchableOpacity
                            onPress={() => (navigation as any).navigate('DailyTrack')}
                            style={styles.closeButton}
                        >
                            <Ionicons name="close" size={28} color="white" />
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.instructions}>
                        Align your face inside the circle and follow the angle steps.
                    </Text>

                    {/* Multi-step indicator */}
                    <View style={styles.stepsRow}>
                        {STEP_ORDER.map(step => {
                            const active = step === currentStep;
                            const done = isStepCompleted(step);
                            return (
                                <View key={step} style={styles.stepItem}>
                                    <View
                                        style={[
                                            styles.stepCircle,
                                            done && styles.stepCircleDone,
                                            active && styles.stepCircleActive,
                                        ]}
                                    />
                                    <Text style={styles.stepLabel}>{stepLabelMap[step]}</Text>
                                </View>
                            );
                        })}
                    </View>

                    {isScanning && (
                        <Text
                            style={[
                                styles.progressText,
                                { color: statusTextMap[faceStatus].color },
                            ]}
                        >
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
                    photo={false}
                    video={true}
                    audio={false}
                    faceDetectionCallback={handleFacesDetection}
                    faceDetectionOptions={faceDetectionOptions}
                />

                {/* Center big circular progress */}
                <View style={StyleSheet.absoluteFill} pointerEvents="none">
                    <View style={styles.faceOutlineContainer}>
                        <View style={styles.circleProgressContainer}>
                            {Array.from({ length: 60 }).map((_, index) => {
                                const angle = index * 6 - 90;
                                const isActiveSeg =
                                    isScanning &&
                                    (index / 60) * 100 <= circleProgress &&
                                    faceStatus === 'OK';

                                return (
                                    <View
                                        key={index}
                                        style={[
                                            styles.progressSegment,
                                            {
                                                transform: [
                                                    { rotate: `${angle}deg` },
                                                    { translateX: 140 },
                                                ],
                                                backgroundColor: isActiveSeg
                                                    ? '#00FF00'
                                                    : 'rgba(255,255,255,0.2)',
                                            },
                                        ]}
                                    />
                                );
                            })}

                            {/* center dot */}
                            <View style={styles.centerDot} />
                        </View>
                    </View>

                    {/* Percentage text */}
                    {isScanning && (
                        <View style={styles.progressContainer}>
                            {circleProgress < 100 && faceStatus === 'OK' && (
                                <Text style={styles.progressPercent}>
                                    {Math.round(circleProgress)}%
                                </Text>
                            )}
                        </View>
                    )}
                </View>

                {/* Bottom capture button */}
                <View style={styles.bottomSection}>
                    <TouchableOpacity
                        style={[
                            styles.captureButton,
                            (uploading || isScanning || isRecording) &&
                            styles.captureButtonDisabled,
                        ]}
                        onPress={startScan}
                        disabled={uploading || isScanning || isRecording}
                    >
                        <View style={styles.captureButtonInner}>
                            {uploading || isScanning || isRecording ? (
                                <ActivityIndicator size="large" color="white" />
                            ) : (
                                <MaterialIcons name="camera-alt" size={32} color="white" />
                            )}
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Video path info (debug) */}
                {videoPath && (
                    <View style={styles.videoPathContainer}>
                        <Text style={styles.videoPathLabel}>Saved video path:</Text>
                        <Text style={styles.videoPathValue}>{videoPath}</Text>
                    </View>
                )}

                {uploading && (
                    <View style={styles.uploadingOverlay}>
                        <Text style={styles.uploadingText}>Recording / processing...</Text>
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
    stepsRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 8,
    },
    stepItem: {
        alignItems: 'center',
        marginHorizontal: 8,
    },
    stepCircle: {
        width: 16,
        height: 16,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: '#4B5563',
        backgroundColor: 'transparent',
    },
    stepCircleActive: {
        borderColor: '#60A5FA',
    },
    stepCircleDone: {
        backgroundColor: '#22C55E',
        borderColor: '#22C55E',
    },
    stepLabel: {
        color: '#9CA3AF',
        fontSize: 12,
        marginTop: 4,
    },
    videoPathContainer: {
        position: 'absolute',
        bottom: 20,
        left: 16,
        right: 16,
        backgroundColor: 'rgba(0,0,0,0.7)',
        padding: 8,
        borderRadius: 8,
    },
    videoPathLabel: {
        color: '#9CA3AF',
        fontSize: 12,
    },
    videoPathValue: {
        color: '#E5E7EB',
        fontSize: 12,
    },
});

export default FaceScan;
