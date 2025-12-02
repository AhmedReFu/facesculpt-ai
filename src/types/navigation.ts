// types/navigation.ts
import { Image } from "react-native";
export type RootStackParamList = {
  Auth: undefined;
  ResetPassword: undefined;
  Otp: undefined;
  OtpAuth: undefined;
  CreateNewPassword: undefined;
  DailyTrack: undefined;
  Home: undefined;
  FaceScan: undefined;
  FaceMetrics: undefined;
  ChooseGoal: undefined;
  UnlockFacialGym: undefined;
  DailyRoutine: undefined;
  Exercise: {
    exerciseId: number; // Should match your context (number)
  };
  Sessions: {
    exerciseId: number; // Should match your context (number)
  };
  FaceCoach: { token: string };
};



// Declare global types for useNavigation
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
