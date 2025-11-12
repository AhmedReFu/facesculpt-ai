import { Ionicons } from '@expo/vector-icons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native'; import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';


import tw from "twrnc";
import CustomButton from '../Components/CustomButton';


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
          <View style={tw`flex-row items-center gap-4`}>
            <MaterialIcons name="auto-awesome" size={28} color="#60A5FB" />
            <Text style={tw`text-[#9CA3AF] text-lg my-4 `}>Adaptive plans</Text>
          </View>
          <View style={tw`flex-row items-center gap-4`}>
            <MaterialCommunityIcons name="head-cog" size={28} color="#60A5FB" />
            <Text style={tw`text-[#9CA3AF] text-lg my-4 `}>Al FaceCoach</Text>
          </View>
          <View style={tw`flex-row items-center gap-4`}>
            <MaterialCommunityIcons name="chart-timeline-variant-shimmer" size={28} color="#60A5FB" />
            <Text style={tw`text-[#9CA3AF] text-lg my-4 `}>Private leaderboard</Text>
          </View>
          <View style={tw`flex-row items-center gap-4`}>
            <MaterialIcons name="bar-chart" size={28} color="#60A5FB" />
            <Text style={tw`text-[#9CA3AF] text-lg my-4 `}>Progress graph</Text>
          </View>

        </View>

        <View>
          <View>

          </View>
          <View>
            <Text>
              Monthly
            </Text>
            <Text>$14.99/mo</Text>
          </View>
        </View>

        <CustomButton name="Start Free 7-Day Trial" />
        <Text style={tw`text-white text-center text-lg `} >7-day free trial, cancel anytime.</Text>
      </View>
      <View style={tw`my-6 `}>
        <Text style={tw`text-[#60A5FBE5]  text-lg `}>Restore Purchases</Text>
        <Text style={tw`text-white text-lg `}>Cancel anytime. After trial, plan auto-renews. Terms & Privacy</Text>
      </View>
    </View>
  )
}

export default UnlockFacialGym