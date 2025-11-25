// hooks/useBackHandler.ts
import { useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";
import { Alert, BackHandler } from "react-native";

export const useBackHandler = (options?: {
  onBackPress?: () => boolean;
  message?: string;
  title?: string;
}) => {
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (options?.onBackPress) {
          return options.onBackPress();
        }

        // Default behavior - exit app with confirmation
        Alert.alert(
          options?.title || "Exit App",
          options?.message || "Are you sure you want to exit?",
          [
            {
              text: "Cancel",
              style: "cancel",
              onPress: () => null,
            },
            {
              text: "Exit",
              style: "destructive",
              onPress: () => BackHandler.exitApp(),
            },
          ]
        );
        return true;
      };

      // Add event listener - returns the subscription
      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress
      );

      // Cleanup - remove the subscription
      return () => backHandler.remove();
    }, [options])
  );
};
