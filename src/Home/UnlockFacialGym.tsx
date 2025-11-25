import { Ionicons } from '@expo/vector-icons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';


import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import tw from "twrnc";

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
    style={tw`bg-[#1D2229] ${isSelected
      ? ' border-2 border-[#60A5FA]'
      : ' border-2 border-transparent'
      } rounded-2xl p-3 my-3`}
    activeOpacity={0.8}
  >
    <View style={tw`flex-row items-center justify-between`}>
      <View style={tw`flex-row items-center flex-1`}>
        <View style={tw`w-6 h-6 rounded-full border-2 ${isSelected ? 'border-[#60A5FA]' : 'border-gray-500'
          } items-center justify-center mr-3`}>
          {isSelected && (
            <View style={tw`w-3 h-3 rounded-full bg-[#60A5FA]`} />
          )}
        </View>

        <View style={tw`flex-1`}>
          <View style={tw`flex-row items-center`}>
            <Text style={tw`text-white text-xl font-bold`}>
              {title}
            </Text>

          </View>
          <View style={tw`flex-row items-center mt-1`}>
            <Text style={tw`text-[#9CA3AF] text-base`}>
              {price}
            </Text>
            {discount && (
              <Text style={tw`text-[#9CA3AF] text-sm ml-2`}>
                ({discount})
              </Text>
            )}
          </View>

        </View>
        {badge && (
          <View style={tw`bg-[#60A5FB66] px-3 py-2 rounded-2xl ml-3`}>
            <Text style={tw`text-[white]  font-medium`}>
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
    <SafeAreaView style={tw`flex-1 bg-[#000000] px-4`}>
      <StatusBar style='light' />
      <View style={tw`mt-2 flex-1`}>
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
          <View style={tw`flex-row items-center gap-4 my-1`}>
            <MaterialIcons name="auto-awesome" size={28} color="#60A5FB" />
            <Text style={tw`text-[#9CA3AF] text-lg  `}>Adaptive plans</Text>
          </View>
          <View style={tw`flex-row items-center gap-4 my-1`}>
            <MaterialCommunityIcons name="head-cog" size={28} color="#60A5FB" />
            <Text style={tw`text-[#9CA3AF] text-lg  `}>Al FaceCoach</Text>
          </View>
          <View style={tw`flex-row items-center gap-4 my-1`}>
            <MaterialCommunityIcons name="chart-timeline-variant-shimmer" size={28} color="#60A5FB" />
            <Text style={tw`text-[#9CA3AF] text-lg `}>Private leaderboard</Text>
          </View>
          <View style={tw`flex-row items-center gap-4 my-1`}>
            <MaterialIcons name="bar-chart" size={28} color="#60A5FB" />
            <Text style={tw`text-[#9CA3AF] text-lg `}>Progress graph</Text>
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

        <View style={tw`my-4`}>
          {/* <CustomButton name="Start Free 7-Day Trial" route="DailyTrack" /> */}
          <TouchableOpacity
            onPress={handleSubscribe}
            activeOpacity={0.8}
            style={tw`bg-[#60A5FB] p-5 rounded-xl flex-row gap-2 items-center justify-center`}>
            <Text style={tw`text-center text-white text-xl font-semibold`}>Start Free 7-Day Trial</Text>
          </TouchableOpacity>
        </View>
        <Text style={tw`text-white text-center text-lg `} >7-day free trial, cancel anytime.</Text>
        <View style={tw`my-6 `}>
          <Text style={tw`text-[#60A5FBE5]  text-lg `}>Restore Purchases</Text>
          <Text style={tw`text-white text-lg `}>Cancel anytime. After trial, plan auto-renews. Terms & Privacy</Text>
        </View>
      </View>

    </SafeAreaView>
  )
}

export default UnlockFacialGym