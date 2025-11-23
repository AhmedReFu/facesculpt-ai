import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { CameraType, CameraView, useCameraPermissions } from 'expo-camera';
import { StatusBar } from 'expo-status-bar';
import React, { useRef, useState } from 'react';
import { Alert, Button, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Ellipse } from 'react-native-svg';
import tw from "twrnc";

const FaceScan = () => {
    const navigation = useNavigation();
    const cameraRef = useRef<CameraView>(null);

    const [facing, setFacing] = useState<CameraType>('front');
    const [permission, requestPermission] = useCameraPermissions();
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
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

    // Capture photo from camera
    const takePicture = async () => {
        if (cameraRef.current) {
            try {
                const photo = await cameraRef.current.takePictureAsync({
                    quality: 0.8,
                    shutterSound: false,
                    base64: true,
                    exif: false,
                });

                if (photo) {
                    console.log('Photo captured:', photo.uri);
                    setCapturedImage(photo.uri);
                    (navigation as any).navigate('FaceMetrics', {
                        imageUri: photo.uri,
                        photoBase64: photo.base64
                    });
                }
            } catch (error) {
                console.error('Error taking picture:', error);
                Alert.alert('Error', 'Failed to capture photo');
            }
        }
    };

    // Upload image to API
    const uploadImage = async () => {
        if (!capturedImage) {
            Alert.alert('Error', 'No image to upload');
            return;
        }

        setUploading(true);

        try {
            // Create FormData for file upload
            const formData = new FormData();

            // Add image file
            formData.append('image', {
                uri: capturedImage,
                type: 'image/jpeg',
                name: 'face-scan.jpg',
            } as any);

            // Add additional data if needed
            formData.append('userId', 'user123');
            formData.append('timestamp', new Date().toISOString());

            // Send to your API
            const response = await fetch('https://your-api.com/upload', {
                method: 'POST',
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                body: formData,
            });

            const result = await response.json();

            if (response.ok) {
                console.log('Upload successful:', result);
                Alert.alert('Success', 'Image uploaded successfully!');

                // Navigate to results with data
                (navigation as any).navigate('FaceMetrics', {
                    imageUri: capturedImage,
                    analysisData: result,
                });
            } else {
                throw new Error(result.message || 'Upload failed');
            }
        } catch (error) {
            console.error('Upload error:', error);
            Alert.alert('Error', 'Failed to upload image. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    // Reset and retake photo
    const retakePhoto = () => {
        setCapturedImage(null);
    };

    // If photo captured, show preview
    // if (capturedImage) {
    //     return (
    //         <View style={styles.fullScreen}>
    //             <StatusBar style='light' />

    //             {/* Preview Header */}
    //             <View style={tw`bg-black px-4 pt-14 pb-4`}>
    //                 <View style={tw`flex-row items-center justify-between`}>
    //                     <Text style={tw`text-white text-2xl font-bold`}>Preview</Text>
    //                     <TouchableOpacity onPress={() => navigation.goBack()}>
    //                         <Ionicons name="close" size={28} color="white" />
    //                     </TouchableOpacity>
    //                 </View>
    //                 <Text style={tw`text-gray-400 text-base mt-2`}>
    //                     Review your photo before continuing
    //                 </Text>
    //             </View>

    //             {/* Image Preview */}
    //             <View style={tw`flex-1 bg-black items-center justify-center`}>
    //                 <Image
    //                     source={{ uri: capturedImage }}
    //                     style={tw`w-full h-[70%]`}
    //                     resizeMode="contain"
    //                 />
    //             </View> 

    //             {/* Action Buttons */}
    //             <View style={tw`bg-black px-6 pb-8 pt-4`}>
    //                 <View style={tw`flex-row gap-3 mb-3`}>
    //                     <TouchableOpacity
    //                         onPress={retakePhoto}
    //                         style={tw`flex-1 bg-gray-700 py-4 rounded-2xl`}
    //                         activeOpacity={0.7}
    //                     >
    //                         <Text style={tw`text-white text-center font-semibold text-base`}>
    //                             Retake
    //                         </Text>
    //                     </TouchableOpacity>

    //                     <TouchableOpacity
    //                         onPress={uploadImage}
    //                         style={tw`flex-1 bg-blue-500 py-4 rounded-2xl flex-row items-center justify-center`}
    //                         activeOpacity={0.7}
    //                         disabled={uploading}
    //                     >
    //                         {uploading ? (
    //                             <ActivityIndicator color="white" />
    //                         ) : (
    //                             <>
    //                                 <MaterialIcons name="check" size={20} color="white" style={tw`mr-2`} />
    //                                 <Text style={tw`text-white font-semibold text-base`}>
    //                                     Analyze
    //                                 </Text>
    //                             </>
    //                         )}
    //                     </TouchableOpacity>
    //                 </View>
    //             </View>
    //         </View>
    //     );
    // }

    // Camera View
    return (
        <View style={styles.fullScreen}>
            <StatusBar style='light' />

            <View style={styles.overlay}>
                <View style={tw`bg-black`}>
                    <View style={styles.header}>
                        <Text style={tw`text-white text-2xl font-bold`}>Face Scan</Text>
                        <TouchableOpacity
                            onPress={() => navigation.goBack()}
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
                        style={styles.captureButton}
                        onPress={takePicture}
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