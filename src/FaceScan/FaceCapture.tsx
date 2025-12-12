import { CameraView, useCameraPermissions } from 'expo-camera';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Dimensions, StyleSheet, Text, View } from 'react-native';

const { width, height } = Dimensions.get('window');

const FaceCapture = () => {
    const [permission, requestPermission] = useCameraPermissions();
    const [circleProgress, setCircleProgress] = useState<number>(0);
    const [isScanning, setIsScanning] = useState<boolean>(false);

    const cameraRef = useRef<any>(null);

    // Auto-start scanning when component mounts
    useEffect(() => {
        if (permission?.granted) {
            setTimeout(() => {
                setIsScanning(true);
            }, 500);
        }
    }, [permission]);

    // Auto progress animation - completes in ~3 seconds
    useEffect(() => {
        if (!isScanning) return;

        const interval = setInterval(() => {
            setCircleProgress(prev => {
                const newProgress = prev + 1.5; // Adjust speed here (higher = faster)

                // Capture photo when progress reaches 100%
                if (newProgress >= 100) {
                    clearInterval(interval);
                    setTimeout(() => {
                        capturePhoto();
                    }, 200);
                    return 100;
                }

                return newProgress;
            });
        }, 50); // Update every 50ms for smooth animation

        return () => clearInterval(interval);
    }, [isScanning]);

    // Handle face detection
    const handleFacesDetected = (result: any) => {
        if (result.faces && result.faces.length > 0) {
            const face = result.faces[0];
            const { bounds } = face;

            setFaceDetected(true);
            setFacePosition({
                x: bounds.origin.x,
                y: bounds.origin.y,
                width: bounds.size.width,
                height: bounds.size.height,
            });
        } else {
            setFaceDetected(false);
            setFacePosition(null);
        }
    };

    const capturePhoto = async () => {
        if (cameraRef.current) {
            try {
                const photo = await cameraRef.current.takePictureAsync({
                    quality: 0.8,
                    base64: true,
                });

                setIsScanning(false);

                console.log('Photo captured:', photo.uri);

                Alert.alert(
                    "Scan Complete! 🎉",
                    "Face image captured successfully",
                    [
                        {
                            text: "Scan Again",
                            onPress: () => {
                                setCircleProgress(0);
                                setIsScanning(true);
                            }
                        },
                        {
                            text: "Done",
                            style: "cancel"
                        }
                    ]
                );
            } catch (error) {
                console.error('Error taking picture:', error);
                Alert.alert("Error", "Failed to capture photo");
                setCircleProgress(0);
                setIsScanning(true);
            }
        }
    };

    if (!permission) {
        return <View style={styles.container} />;
    }

    if (!permission.granted) {
        return (
            <View style={styles.container}>
                <Text style={styles.permissionText}>
                    Camera permission is required for face scanning
                </Text>
                <View style={styles.permissionButton} onTouchStart={requestPermission}>
                    <Text style={styles.permissionButtonText}>Grant Permission</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <CameraView
                ref={cameraRef}
                style={styles.camera}
                facing="front"
            >
                <View style={styles.overlay}>
                    {/* Center alignment guide */}
                    <View style={styles.centerGuide}>
                        {/* Horizontal line */}
                        <View style={styles.centerLineHorizontal} />
                        {/* Vertical line */}
                        <View style={styles.centerLineVertical} />
                    </View>

                    {/* Face Oval Guide (circular) */}
                    <View style={styles.faceCircleContainer}>
                        <View style={styles.faceCircle} />
                    </View>

                    {/* Circular Progress Ring */}
                    <View style={styles.circleProgressContainer}>
                        {/* Progress segments (like in the image) */}
                        {Array.from({ length: 60 }).map((_, index) => {
                            const angle = (index * 6) - 90; // Start from top
                            const isActive = (index / 60) * 100 <= circleProgress;

                            return (
                                <View
                                    key={index}
                                    style={[
                                        styles.progressSegment,
                                        {
                                            transform: [
                                                { rotate: `${angle}deg` },
                                                { translateX: 170 },
                                            ],
                                            backgroundColor: isActive ? '#00FF00' : 'rgba(255,255,255,0.3)',
                                        }
                                    ]}
                                />
                            );
                        })}
                    </View>

                    {/* Instructions */}
                    <View style={styles.instructionContainer}>
                        <Text style={styles.instructionText}>
                            {circleProgress >= 100
                                ? '✓ Scan Complete!'
                                : 'Move your head slowly to complete the circle.'}
                        </Text>

                        {/* Progress indicator */}
                        <View style={styles.progressIndicator}>
                            <View style={[
                                styles.progressBar,
                                { width: `${circleProgress}%` }
                            ]} />
                        </View>

                        <Text style={styles.progressText}>
                            {Math.round(circleProgress)}%
                        </Text>
                    </View>
                </View>
            </CameraView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
    },
    camera: {
        flex: 1,
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    centerGuide: {
        position: 'absolute',
        width: width,
        height: height,
        justifyContent: 'center',
        alignItems: 'center',
    },
    centerLineHorizontal: {
        position: 'absolute',
        width: 40,
        height: 2,
        backgroundColor: 'rgba(255,255,255,0.3)',
    },
    centerLineVertical: {
        position: 'absolute',
        width: 2,
        height: 40,
        backgroundColor: 'rgba(255,255,255,0.3)',
    },
    faceCircleContainer: {
        width: 280,
        height: 280,
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
    },
    faceCircle: {
        width: 280,
        height: 280,
        borderRadius: 140,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.5)',
    },
    circleProgressContainer: {
        width: 360,
        height: 360,
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
    },
    progressSegment: {
        position: 'absolute',
        width: 20,
        height: 4,
        borderRadius: 2,
    },
    instructionContainer: {
        position: 'absolute',
        bottom: 100,
        alignItems: 'center',
        width: '90%',
        paddingHorizontal: 20,
    },
    instructionText: {
        color: 'white',
        fontSize: 20,
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: 20,
    },
    progressIndicator: {
        width: '100%',
        height: 6,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 3,
        overflow: 'hidden',
        marginBottom: 10,
    },
    progressBar: {
        height: '100%',
        backgroundColor: '#00FF00',
        borderRadius: 3,
    },
    progressText: {
        color: '#00FF00',
        fontSize: 24,
        fontWeight: 'bold',
    },
    permissionText: {
        color: 'white',
        fontSize: 18,
        textAlign: 'center',
        margin: 40,
    },
    permissionButton: {
        backgroundColor: '#00FF00',
        paddingHorizontal: 40,
        paddingVertical: 15,
        borderRadius: 30,
        alignSelf: 'center',
    },
    permissionButtonText: {
        color: 'black',
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default FaceCapture;