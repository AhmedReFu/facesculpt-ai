import { Ionicons } from '@expo/vector-icons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface PlanProps {
  id: string
  title: string
  price: string
  discount?: string
  badge?: string
  isSelected: boolean
  onSelect: () => void
}

const PlanItem = ({ title, price, discount, badge, isSelected, onSelect }: PlanProps) => (
  <TouchableOpacity
    onPress={onSelect}
    className={`
      bg-[#1D2229] rounded-2xl p-3 my-3
      ${isSelected ? 'border-2 border-[#60A5FA]' : 'border-2 border-transparent'}
    `}
    activeOpacity={0.8}
  >
    <View className="flex-row items-center justify-between">
      <View className="flex-row items-center flex-1">
        <View className={`
          w-6 h-6 rounded-full border-2 items-center justify-center mr-3
          ${isSelected ? 'border-[#60A5FA]' : 'border-gray-500'}
        `}>
          {isSelected && (
            <View className="w-3 h-3 rounded-full bg-[#60A5FA]" />
          )}
        </View>

        <View className="flex-1">
          <View className="flex-row items-center">
            <Text className="text-white text-xl font-bold">
              {title}
            </Text>
          </View>
          <View className="flex-row items-center mt-1">
            <Text className="text-[#9CA3AF] text-base">
              {price}
            </Text>
            {discount && (
              <Text className="text-[#9CA3AF] text-sm ml-2">
                ({discount})
              </Text>
            )}
          </View>
        </View>
        {badge && (
          <View className="bg-[#60A5FB66] px-3 py-2 rounded-2xl ml-3">
            <Text className="text-white font-medium">
              {badge}
            </Text>
          </View>
        )}
      </View>
    </View>
  </TouchableOpacity>
)

const UnlockFacialGym = () => {
  const navigator = useNavigation()

  const [selectedPlan, setSelectedPlan] = useState<string>('6-monthly')

  const plans = [
    {
      id: 'monthly',
      title: 'Monthly',
      price: '$14.99/mo',
      discount: '',
      badge: ''
    },
    {
      id: '6-monthly',
      title: '6 Month Plan',
      price: '$69.99/mo',
      discount: 'save 22%',
      badge: 'Most Popular'
    },
    {
      id: 'yearly',
      title: 'Yearly',
      price: '$99.99/mo',
      discount: 'Save 44%',
      badge: ''
    }
  ]

  const handleSelectPlan = async (planId: string) => {
    setSelectedPlan(planId)
    console.log('Selected plan:', planId)
  }

  const handleSubscribe = async () => {
    await AsyncStorage.setItem("subscribe", "true");
    navigator.navigate("DailyTrack")
  }

  return (
    <SafeAreaView className="flex-1 bg-[#000000] px-4">
      <StatusBar style='light' />
      <View className="mt-2 flex-1">
        <View className="mb-6">
          <View className="flex-row justify-between items-start">
            <Text className="text-white text-2xl font-bold flex-1 mr-4">
              Unlock Your Facial Gym
            </Text>
            <TouchableOpacity
              onPress={() => navigator.goBack()}
              className="mt-1"
            >
              <Ionicons name="close" size={32} color="white" />
            </TouchableOpacity>
          </View>
          <Text className="text-[#9CA3AF] text-lg mt-4 leading-6">
            Train your face with personalized workouts, Al coaching, and measurable progress.
          </Text>
        </View>
        <View>
          <View className="flex-row items-center gap-4 my-1">
            <MaterialIcons name="auto-awesome" size={28} color="#60A5FB" />
            <Text className="text-[#9CA3AF] text-lg">Adaptive plans</Text>
          </View>
          <View className="flex-row items-center gap-4 my-1">
            <MaterialCommunityIcons name="head-cog" size={28} color="#60A5FB" />
            <Text className="text-[#9CA3AF] text-lg">Al FaceCoach</Text>
          </View>
          <View className="flex-row items-center gap-4 my-1">
            <MaterialCommunityIcons name="chart-timeline-variant-shimmer" size={28} color="#60A5FB" />
            <Text className="text-[#9CA3AF] text-lg">Private leaderboard</Text>
          </View>
          <View className="flex-row items-center gap-4 my-1">
            <MaterialIcons name="bar-chart" size={28} color="#60A5FB" />
            <Text className="text-[#9CA3AF] text-lg">Progress graph</Text>
          </View>
        </View>

        <View>
          {plans.map((plan) => (
            <PlanItem
              key={plan.id}
              id={plan.id}
              title={plan.title}
              price={plan.price}
              discount={plan.discount}
              badge={plan.badge}
              isSelected={selectedPlan === plan.id}
              onSelect={() => handleSelectPlan(plan.id)}
            />
          ))}
        </View>

        <View className="my-4">
          <TouchableOpacity
            onPress={handleSubscribe}
            activeOpacity={0.8}
            className="bg-[#60A5FB] p-5 rounded-xl flex-row gap-2 items-center justify-center"
          >
            <Text className="text-center text-white text-xl font-semibold">Start Free 7-Day Trial</Text>
          </TouchableOpacity>
        </View>
        <Text className="text-white text-center text-lg">7-day free trial, cancel anytime.</Text>
        <View className="my-6">
          <Text className="text-[#60A5FBE5] text-lg">Restore Purchases</Text>
          <Text className="text-white text-lg">Cancel anytime. After trial, plan auto-renews. Terms & Privacy</Text>
        </View>
      </View>
    </SafeAreaView>
  )
}

export default UnlockFacialGym