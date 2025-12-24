// FaceVisionScreen.tsx

import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Frame, useCameraDevice } from "react-native-vision-camera";
import {
  Face,
  Camera as FaceCamera,
} from "react-native-vision-camera-face-detector";

const MIN_FACE_RATIO = 0.2;  // minimum distance ratio
const MAX_FACE_RATIO = 0.35; // maximum distance ratio

type FaceStatus =
  | "NO_FACE"
  | "MULTIPLE_FACES"
  | "TOO_FAR"
  | "TOO_CLOSE"
  | "FACE_NOT_CLEAR"
  | "OK";

const FaceFindDetect: React.FC = () => {
  const device = useCameraDevice("front");
  const cameraRef = useRef<any>(null);

  const [faces, setFaces] = useState<Face[]>([]);
  const [faceStatus, setFaceStatus] = useState<FaceStatus>("NO_FACE");

  const faceDetectionOptions = useRef<any>({
    performanceMode: "fast",
    landmarkMode: "all",      // sob landmark chai (eye, nose, mouth, ear)
    contourMode: "none",
    classificationMode: "all", // eye open probability er jonno
    minFaceSize: 0.2,
    trackingEnabled: true,
  }).current;

  useEffect(() => {
    (async () => {
      const status: any = await (FaceCamera as any).requestCameraPermission();
      console.log("permission:", status);
    })();
  }, [device]);

  // helper: probability jodi null/undefined hoy -> false
  const probOk = (value: number | null | undefined, min = 0.3) => {
    if (value == null) return false;
    return value >= min;
  };

  // 1) full face clear kina check (eye + nose + lip + ear)
  const isFaceClear = (face: Face) => {
    const lm: any = face.landmarks;
    if (!lm) return false;

    const hasEyes = lm.LEFT_EYE && lm.RIGHT_EYE;
    const hasNose = lm.NOSE_BASE;
    const hasMouth = lm.MOUTH_LEFT && lm.MOUTH_RIGHT;
    const hasEars = lm.LEFT_EAR && lm.RIGHT_EAR;

    // jodi kono ekta nai -> face clear na
    if (!hasEyes || !hasNose || !hasMouth || !hasEars) {
      return false;
    }

    // optional: eye open probability diye aro ekto strict kora
    const leftEyeOpen = (face as any).leftEyeOpenProbability;
    const rightEyeOpen = (face as any).rightEyeOpenProbability;

    // chaile niche 2 line comment kore dileo cholbe
    if (!probOk(leftEyeOpen, 0.3)) return false;
    if (!probOk(rightEyeOpen, 0.3)) return false;

    // smilingProbability ke ekdom use korchi na
    return true;
  };

  // 2) distance check
  const evaluateFaceDistance = (face: Face, frame: Frame): FaceStatus => {
    const { width, height } = face.bounds;
    const faceArea = width * height;
    const frameArea = frame.width * frame.height;
    const ratio = faceArea / frameArea;

    // debug korte chaile:
    // console.log("face ratio:", ratio.toFixed(2));

    if (ratio < MIN_FACE_RATIO) return "TOO_FAR";
    if (ratio > MAX_FACE_RATIO) return "TOO_CLOSE";
    return "OK";
  };

  const handleFacesDetection = (facesDetected: Face[], frame: Frame) => {
    try {
      setFaces(facesDetected);

      // 0) kono face nai
      if (!facesDetected || facesDetected.length === 0) {
        setFaceStatus("NO_FACE");
        return;
      }

      // 1) ekdom 1 ta face chara onno face thakle fail
      if (facesDetected.length !== 1) {
        setFaceStatus("MULTIPLE_FACES");
        return;
      }

      const face = facesDetected[0];

      // 2) face clear kina (eye + nose + lip + ear + eye prob)
      if (!isFaceClear(face)) {
        setFaceStatus("FACE_NOT_CLEAR");
        return;
      }

      // 3) distance check
      const distanceStatus = evaluateFaceDistance(face, frame);
      setFaceStatus(distanceStatus);
    } catch (e) {
      console.error("face detection error:", e);
      setFaceStatus("FACE_NOT_CLEAR");
    }
  };

  if (!device) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>Loading camera...</Text>
      </View>
    );
  }

  const statusTextMap: Record<FaceStatus, string> = {
    NO_FACE: "Face dekha jacche na",
    MULTIPLE_FACES: "Shudhu tomar ekta face rekho (onno ke dure rakho)",
    TOO_FAR: "Ar ektu kache asho",
    TOO_CLOSE: "Ektu dure giye thako",
    FACE_NOT_CLEAR:
      "Full face clear rakho: chokh, naak, lips, duita ear visible, light valo rakho",
    OK: "Perfect! Face scan ready ✅",
  };

  return (
    <View style={styles.container}>
      <FaceCamera
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
        faceDetectionCallback={handleFacesDetection}
        faceDetectionOptions={faceDetectionOptions}
      />

      <View style={styles.overlay}>
        <Text style={styles.text}>Faces detected: {faces.length}</Text>
        <Text style={styles.textSmall}>{statusTextMap[faceStatus]}</Text>
      </View>
    </View>
  );
};

export default FaceFindDetect;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "black" },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "black",
  },
  text: { color: "white", fontSize: 16 },
  textSmall: { color: "white", fontSize: 14, marginTop: 4 },
  overlay: {
    position: "absolute",
    bottom: 40,
    alignSelf: "center",
    padding: 12,
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
  },
});
