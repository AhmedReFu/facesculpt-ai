import { Ionicons } from '@expo/vector-icons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Purchases from 'react-native-purchases';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Toast, useToast } from '../hooks/useToost';

interface PlanProps {
  id: string
  title: string
  price: string
  discount?: string
  badge?: string
  isSelected: boolean
  onSelect: () => void
}
type PackageID = "monthly" | "sixmonthly" | "yearly";

interface FormattedPackage {
  id: PackageID;
  title: string;
  price: string;
  discount: string;
  badge: string;
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
  const toast = useToast();
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

  type PackageID = "monthly" | "sixmonthly" | "yearly";

  interface FormattedPackage {
    id: PackageID;
    title: string;
    price: string;
    discount: string;
    badge: string;
  }

  const getRevenueCatData = async () => {
    try {

      const stored = await AsyncStorage.getItem('user');

      if (!stored) {
        console.log("No stored user found");
        return;
      }

      const user = JSON.parse(stored);

      const offerings = await Purchases.getOfferings();
      const premium = offerings?.all?.premium;

      console.log(premium);

      if (!premium) {
        console.log("No premium offering found");
        return;
      }

      // Mapping RevenueCat packageType → our IDs
      const idMap: Record<string, PackageID> = {
        MONTHLY: "monthly",
        SIX_MONTH: "sixmonthly",
        ANNUAL: "yearly",
      };

      // UI Titles
      const titleMap: Record<PackageID, string> = {
        monthly: "Monthly",
        sixmonthly: "6 Month Plan",
        yearly: "Yearly",
      };

      // Discount (custom)
      const discountMap: Record<PackageID, string> = {
        monthly: "BDT 2,500.00",
        sixmonthly: "BDT 12,000.00",
        yearly: "BDT 18,000.00",
      };

      // Badge
      const badgeMap: Record<PackageID, string> = {
        monthly: "",
        sixmonthly: "Popular",
        yearly: "",
      };

      const formatted: FormattedPackage[] = premium.availablePackages.map(pkg => {
        const rcType = pkg.packageType; // MONTHLY | SIX_MONTH | ANNUAL
        const id = idMap[rcType];      // monthly | sixmonthly | yearly

        const product = pkg.product;

        // Price period
        const period =
          id === "monthly"
            ? "/month"
            : id === "sixmonthly"
              ? "/6 months"
              : "/year";

        return {
          id,
          title: titleMap[id],
          price: `${product.priceString}${period}`,
          discount: discountMap[id],
          badge: badgeMap[id],
        };
      });

      console.log("FINAL DATA:", formatted);

      if (user) {
        await Purchases.logIn(user.phone_number);
        console.log("RevenueCat User Identified:", user.phone_number);
      }
      return formatted;
    } catch (error) {
      console.error("RevenueCat Error:", error);
    }
  };



  getRevenueCatData();

  const handleSelectPlan = (planId: string) => {
    setSelectedPlan(planId)
    console.log('Selected plan:', planId)
  }

  const handleSubscribe = async () => {
    try {
      // Demo: Simulate successful subscription
      await AsyncStorage.setItem("subscribe", "true")

      toast.show({
        message: '🎉 Your 7-day free trial has started. Welcome to FaceSculpt AI Premium!',
        type: 'success',
        style: 'center',
        buttons: [
          {
            text: 'Get Started',
            action: 'custom',
            onPress: () => navigator.navigate("DailyTrack")
          }
        ]
      });
    } catch (error) {
      console.error('Error:', error)
      toast.show({
        message: 'Something went wrong. Please try again.',
        type: 'error',
        style: 'center',
        buttons: [{ text: 'OK', action: 'dismiss' }]
      });
    }
  }

  const handleRestorePurchases = async () => {
    try {
      // Demo: Check if subscription exists in AsyncStorage
      const subscribed = await AsyncStorage.getItem("subscribe")

      if (subscribed === "true") {
        toast.show({
          message: 'Your purchases have been restored successfully!',
          type: 'success',
          style: 'center',
          buttons: [
            {
              text: 'OK',
              action: 'custom',
              onPress: () => navigator.navigate("DailyTrack")
            }
          ]
        });
      } else {
        toast.show({
          message: 'No active subscription found to restore.',
          type: 'warning',
          style: 'center',
          buttons: [{ text: 'OK', action: 'dismiss' }]
        });
      }
    } catch (error) {
      console.error('Restore error:', error)
      toast.show({
        message: 'Failed to restore purchases. Please try again.',
        type: 'error',
        style: 'center',
        buttons: [{ text: 'OK', action: 'dismiss' }]
      });
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
            <Text className="text-[#60A5FB] text-lg font-medium">
              Restore Purchases
            </Text>
          </TouchableOpacity>
          <Text className="text-gray-400 text-sm">
            By continuing, you agree to our Terms of Service and Privacy Policy. Subscription automatically renews unless canceled at least 24 hours before the end of the current period.
          </Text>
        </View>
      </View>

      {/* Toast Component */}
      <Toast
        style={toast.style}
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        fadeAnim={toast.fadeAnim}
        buttons={toast.buttons}
        onHide={toast.hide}
      />
    </SafeAreaView>
  )
}

export default UnlockFacialGym