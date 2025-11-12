import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { CameraType, CameraView, useCameraPermissions } from 'expo-camera';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { Button, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Ellipse } from 'react-native-svg';
import tw from "twrnc";

const FaceScan = () => {
    const navigator = useNavigation()
    const [facing, setFacing] = useState<CameraType>('front');
    const [permission, requestPermission] = useCameraPermissions();

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

    const toggleCameraFacing =()=> {
        setFacing(current => (current === 'back' ? 'front' : 'back'));
    }

    return (
        <View style={styles.fullScreen}>
            <StatusBar style='light' />
            
                <View style={styles.overlay}>
                    <View style={tw`bg-black`}>
                        <View style={styles.header}>
                        <Text style={tw`text-white text-2xl font-bold`}>Face Scan</Text>
                            <TouchableOpacity
                            onPress={() => navigator.goBack() }
                                style={styles.closeButton}
                            >
                                <Ionicons name="close" size={28} color="white" />
                        </TouchableOpacity>
                        
                        </View>
                        <Text style={styles.instructions}>
                            Position your face within the outline{'\n'}and hold still
                        </Text>
                </View>
                <CameraView style={styles.camera} facing={facing}>
                    <View style={styles.faceOutlineContainer}>
                        <Svg height="400" width="280" style={styles.svg}>
                            <Ellipse
                                cx="140"
                                cy="200"
                                rx="130"
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
                            style={styles.captureButton}
                            onPress={() => {
                                (navigator as any).navigate("FaceMetrics")
                            }}
                        >
                            <View style={styles.captureButtonInner}>
                                <MaterialIcons name="camera-alt" size={32} color="white" />
                            </View>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.flipButton}
                            onPress={toggleCameraFacing}
                        >
                            <Ionicons name="camera-reverse" size={32} color="white" />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.homeIndicator} />
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
    title: {
        fontSize: 20,
        fontWeight: '600',
        color: 'white',
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
        marginVertical:60,
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
        paddingVertical: 60,
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
    homeIndicator: {
        width: 134,
        height: 5,
        backgroundColor: 'white',
        borderRadius: 100,
        alignSelf: 'center',
        marginBottom: 8,
    },
});

export default FaceScan;