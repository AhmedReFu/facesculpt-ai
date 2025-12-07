import { Ionicons } from '@expo/vector-icons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { Alert, Text, TouchableOpacity, View } from 'react-native';
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
              <Text className="text-[#9CA3AF] text-sm ml-2 line-through">
                {discount}
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
  const [selectedPlan, setSelectedPlan] = useState<string>('monthly')


  const plans = [
    {
      id: 'monthly',
      title: 'Monthly',
      price: '$9.99/month',
      discount: '$14.99',
      badge: ''
    },
    {
      id: 'sixmonthly',
      title: '6 Month Plan',
      price: '$69.99/6 months',
      discount: '$89.99',
      badge: 'Popular'
    },
    {
      id: 'yearly',
      title: 'Yearly',
      price: '$119.99/year',
      discount: '$179.99',
      badge: ''
    }
  ]

  const handleSelectPlan = (planId: string) => {
    setSelectedPlan(planId)
    console.log('Selected plan:', planId)
  }

  const handleSubscribe = async () => {
    try {
      // Demo: Simulate successful subscription
      await AsyncStorage.setItem("subscribe", "true")

      Alert.alert(
        'Success!',
        'Your 7-day free trial has started. Welcome to FaceSculpt AI Premium!',
        [{ text: 'Get Started', onPress: () => navigator.navigate("DailyTrack") }]
      )
    } catch (error) {
      console.error('Error:', error)
      Alert.alert('Error', 'Something went wrong. Please try again.')
    }
  }

  const handleRestorePurchases = async () => {
    try {
      // Demo: Check if subscription exists in AsyncStorage
      const subscribed = await AsyncStorage.getItem("subscribe")

      if (subscribed === "true") {
        Alert.alert(
          'Success',
          'Your purchases have been restored!',
          [{ text: 'OK', onPress: () => navigator.navigate("DailyTrack") }]
        )
      } else {
        Alert.alert('No Active Subscription', 'No active subscription found to restore.')
      }
    } catch (error) {
      console.error('Restore error:', error)
      Alert.alert('Error', 'Failed to restore purchases. Please try again.')
    }
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
            Train your face with personalized workouts, AI coaching, and measurable progress.
          </Text>
        </View>

        <View>
          <View className="flex-row items-center gap-4 my-1">
            <MaterialIcons name="auto-awesome" size={28} color="#60A5FB" />
            <Text className="text-[#9CA3AF] text-lg">Adaptive workout plans</Text>
          </View>
          <View className="flex-row items-center gap-4 my-1">
            <MaterialCommunityIcons name="head-cog" size={28} color="#60A5FB" />
            <Text className="text-[#9CA3AF] text-lg">AI FaceCoach guidance</Text>
          </View>
          <View className="flex-row items-center gap-4 my-1">
            <MaterialCommunityIcons name="chart-timeline-variant-shimmer" size={28} color="#60A5FB" />
            <Text className="text-[#9CA3AF] text-lg">Progress analytics</Text>
          </View>
          <View className="flex-row items-center gap-4 my-1">
            <MaterialIcons name="bar-chart" size={28} color="#60A5FB" />
            <Text className="text-[#9CA3AF] text-lg">Advanced tracking</Text>
          </View>
        </View>

        <View className="mt-6">
          <Text className="text-white text-lg font-bold mb-2">Choose Your Plan:</Text>
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
            className="bg-[#60A5FA] p-5 rounded-xl flex-row gap-2 items-center justify-center"
          >
            <Text className="text-center text-white text-xl font-semibold">
              Start Free 7-Day Trial
            </Text>
          </TouchableOpacity>
        </View>

        <Text className="text-white text-center text-base mb-4">
          Try free for 7 days, then {plans.find(p => p.id === selectedPlan)?.price || '$9.99/month'}. Cancel anytime.
        </Text>

        <View className="my-4">
          <TouchableOpacity
            onPress={handleRestorePurchases}
            className="py-3"
          >
            <Text className="text-[#60A5FA] text-lg font-medium">
              Restore Purchases
            </Text>
          </TouchableOpacity>
          <Text className="text-gray-400 text-sm">
            By continuing, you agree to our Terms of Service and Privacy Policy. Subscription automatically renews unless canceled at least 24 hours before the end of the current period.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  )
}

export default UnlockFacialGym