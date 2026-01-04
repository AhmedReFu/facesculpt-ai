// hooks/useNavigationReset.ts
import { CommonActions, useNavigation } from "@react-navigation/native";

export const useNavigationReset = () => {
  const navigation = useNavigation();

  const resetToDailyRoutine = () => {
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: "DailyRoutine" as never }],
      })
    );
  };

  const resetToExercise = (exerciseId: number) => {
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: "Exercise" as never, params: { exerciseId } }],
      })
    );
  };

  const resetToFacescan = (exerciseId: number) => {
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: "FaceScanWithDetection" as never }],
      })
    );
  };

  return {
    resetToFacescan,
    resetToDailyRoutine,
    resetToExercise,
  };
};

// Usage in your component:
// const { resetToDailyRoutine } = useNavigationReset();
// onPress={resetToDailyRoutine}
