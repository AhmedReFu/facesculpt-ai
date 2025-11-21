// types/navigation.ts
export type RootStackParamList = {
  DailyRoutine: undefined;
  DailyTrack: undefined;
  Exercise: { exerciseId: number };
  Sessions: { exerciseId: number };
};

// Declare global types for useNavigation
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
