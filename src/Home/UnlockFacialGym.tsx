import { Ionicons } from '@expo/vector-icons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import tw from "twrnc";


const UnlockFacialGym = () => {
  const navigator = useNavigation()
  return (
    <View style={tw`flex-1 bg-[#0f1418] px-6`}>
      <StatusBar style='light' />
      <View style={tw`mt-14 flex-1`}>
        <View style={tw`mb-6`}>
          <View style={tw`flex-row justify-between items-start`}>
            <Text style={tw`text-white text-2xl font-bold flex-1 mr-4`}>
              Unlock Your Facial Gym
            </Text>
            <TouchableOpacity
              onPress={() => navigator.goBack()}
              style={tw`mt-1`}
            >
              <Ionicons name="close" size={32} color="white" />
            </TouchableOpacity>
          </View>
          <Text style={tw`text-[#9CA3AF] text-lg mt-4 leading-6`}>
            Train your face with personalized workouts, Al coaching, and measurable progress.
          </Text>
        </View>
        <View>
          <View>
            <MaterialIcons name="auto-awesome" size={24} color="#60A5FB" />
            <Text>Adaptive plans</Text>
</View>
        </View>
      </View>
      
    </View>
  )
}

export default UnlockFacialGym