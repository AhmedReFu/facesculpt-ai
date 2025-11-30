import { Ionicons } from '@expo/vector-icons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Text, TouchableOpacity, View } from 'react-native';
import Purchases from 'react-native-purchases';
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

interface RevenueCatPackage {
  identifier: string;
  product: {
    title: string;
    description: string;
    price: number;
    priceString: string;
    currencyCode: string;
  };
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
  const [selectedPlan, setSelectedPlan] = useState<string>('$rc_monthly')
  const [packages, setPackages] = useState<RevenueCatPackage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isPurchasing, setIsPurchasing] = useState(false)
  const [customerInfo, setCustomerInfo] = useState<any>(null)

  // Fetch available packages and customer info
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)

        // Get customer info first
        const customerInfo = await Purchases.getCustomerInfo()
        setCustomerInfo(customerInfo)

        console.log('Customer Info:', JSON.stringify(customerInfo, null, 2))

        // Check if user already has active subscription - FIXED
        const activeEntitlements = customerInfo.entitlements.active
        console.log('Active entitlements:', Object.keys(activeEntitlements))

        // Check for your specific entitlement name
        if (activeEntitlements['FaceSclup․AI Pro'] || activeEntitlements['six_month'] || activeEntitlements['Pro']) {
          console.log('User already has active subscription')
          await AsyncStorage.setItem("subscribe", "true")
          navigator.navigate("DailyTrack")
          return
        }

        // Fetch available packages
        const offerings = await Purchases.getOfferings()
        console.log('Available Offerings:', JSON.stringify(offerings, null, 2))

        if (offerings.current) {
          const availablePackages = offerings.current.availablePackages
          setPackages(availablePackages)

          // Set default selected plan to first available package
          if (availablePackages.length > 0) {
            setSelectedPlan(availablePackages[1].identifier)
          }
        }

      } catch (error) {
        console.error('Error fetching RevenueCat data:', error)
        // Don't show alert here as it might be due to test mode
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleSelectPlan = (planId: string) => {
    setSelectedPlan(planId)
    console.log('Selected plan:', planId)
  }

  const handleSubscribe = async () => {
    try {
      setIsPurchasing(true)

      // Find the selected package
      const selectedPackage = packages.find(pkg => pkg.identifier === selectedPlan)

      if (!selectedPackage) {
        Alert.alert('Error', 'Selected plan not found. Using test purchase flow.')
        // Even if package not found, proceed with test flow
        await simulateTestPurchase()
        return
      }

      console.log('Purchasing package:', selectedPackage.identifier)

      // Make the purchase - this will trigger RevenueCat's test purchase screen
      const { customerInfo } = await Purchases.purchasePackage(selectedPackage as any)

      console.log('Purchase response:', JSON.stringify(customerInfo, null, 2))

      // Check if purchase was successful - FIXED
      await handlePurchaseResult(customerInfo)

    } catch (error: any) {
      console.error('Purchase error:', error)
      await handlePurchaseError(error)
    } finally {
      setIsPurchasing(false)
    }
  }

  const simulateTestPurchase = async () => {
    // For testing when packages aren't loaded
    console.log('Simulating test purchase flow')
    await AsyncStorage.setItem("subscribe", "true")
    navigator.navigate("DailyTrack")
    Alert.alert(
      'Test Mode',
      'Purchase simulated successfully! In production, this would connect to RevenueCat.',
      [{ text: 'OK', onPress: () => navigator.navigate("DailyTrack") }]
    )
  }

  const handlePurchaseResult = async (customerInfo: any) => {
    // Check if user now has premium entitlement - FIXED
    const activeEntitlements = customerInfo.entitlements.active

    if (activeEntitlements['FaceSclup․AI Pro'] || activeEntitlements['six_month'] || activeEntitlements['Pro']) {
      await AsyncStorage.setItem("subscribe", "true")
      Alert.alert(
        'Success!',
        'Your subscription has been activated. Welcome to FaceSculpt AI Premium!',
        [{ text: 'Get Started', onPress: () => navigator.navigate("DailyTrack") }]
      )
    } else {
      // Check for specific product identifier
      const activeSubscriptions = customerInfo.activeSubscriptions
      if (activeSubscriptions && activeSubscriptions.length > 0) {
        await AsyncStorage.setItem("subscribe", "true")
        Alert.alert(
          'Success!',
          'Your subscription has been activated!',
          [{ text: 'Get Started', onPress: () => navigator.navigate("DailyTrack") }]
        )
      } else {
        Alert.alert(
          'Purchase Completed',
          'Thank you for your purchase! Setting up your subscription...',
          [{ text: 'OK', onPress: () => checkSubscriptionStatus() }]
        )
      }
    }
  }

  const handlePurchaseError = async (error: any) => {
    // User cancelled purchase
    if (error.userCancelled) {
      console.log('User cancelled purchase')
      return
    }

    // Purchase failed
    Alert.alert(
      'Purchase Failed',
      error.message || 'An error occurred during purchase. Please try again.'
    )
  }

  const checkSubscriptionStatus = async () => {
    try {
      const currentCustomerInfo = await Purchases.getCustomerInfo()
      console.log('Checking subscription status:', JSON.stringify(currentCustomerInfo, null, 2))

      const activeEntitlements = currentCustomerInfo.entitlements.active

      // Check all possible entitlement names
      if (activeEntitlements['FaceSclup․AI Pro'] || activeEntitlements['premium'] || activeEntitlements['Pro']) {
        console.log("Subscription active - navigating to DailyTrack")
        await AsyncStorage.setItem("subscribe", "true")
        navigator.navigate("DailyTrack")
      } else if (currentCustomerInfo.activeSubscriptions && currentCustomerInfo.activeSubscriptions.length > 0) {
        console.log("Active subscriptions found:", currentCustomerInfo.activeSubscriptions)
        await AsyncStorage.setItem("subscribe", "true")
        navigator.navigate("DailyTrack")
      } else {
        Alert.alert('Subscription Pending', 'Your subscription is being processed. Please wait a moment and try again.')
      }
    } catch (error) {
      console.error('Error checking subscription status:', error)
    }
  }

  const handleRestorePurchases = async () => {
    try {
      setIsLoading(true)
      const restoreInfo = await Purchases.restorePurchases()
      console.log('Restore info:', JSON.stringify(restoreInfo, null, 2))

      const activeEntitlements = restoreInfo.entitlements.active

      if (activeEntitlements['FaceSclup․AI Pro'] || activeEntitlements['premium'] || activeEntitlements['Pro']) {
        await AsyncStorage.setItem("subscribe", "true")
        Alert.alert('Success', 'Your purchases have been restored!')
        navigator.navigate("DailyTrack")
      } else if (restoreInfo.activeSubscriptions && restoreInfo.activeSubscriptions.length > 0) {
        await AsyncStorage.setItem("subscribe", "true")
        Alert.alert('Success', 'Your purchases have been restored!')
        navigator.navigate("DailyTrack")
      } else {
        Alert.alert('No Active Subscription', 'No active subscription found to restore.')
      }
    } catch (error) {
      console.error('Restore error:', error)
      Alert.alert('Error', 'Failed to restore purchases. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Default plans for testing (matches your test purchase screen)
  const defaultPlans = [
    {
      id: '$rc_monthly',
      title: 'Monthly',
      price: '$9.99/month',
      discount: '$14.99',
      badge: ''
    },
    {
      id: 'sixmonthly',
      title: '6 Month Plan',
      price: '$49.99/6 months',
      discount: '$89.99',
      badge: 'Popular'
    },
    {
      id: '$rc_annual',
      title: 'Yearly',
      price: '$79.99/year',
      discount: '$119.99',
      badge: ''
    }
  ]

  // Use RevenueCat packages if available, otherwise use default test plans
  const displayPlans = packages.length > 0
    ? packages.map(pkg => ({
      id: pkg.identifier,
      title: pkg.product.title,
      price: pkg.product.priceString,
      discount: pkg.identifier.includes('MONTHLY') ? '' : '',
      badge: pkg.identifier.includes('six_month') ? 'Most Popular' :
        pkg.identifier.includes('annual') ? '' : ''
    }))
    : defaultPlans

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-[#000000] justify-center items-center">
        <StatusBar style='light' />
        <ActivityIndicator size="large" color="#60A5FA" />
        <Text className="text-white text-lg mt-4">Loading subscription plans...</Text>
      </SafeAreaView>
    )
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
          {displayPlans.map((plan) => (
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
            disabled={isPurchasing}
            activeOpacity={0.8}
            className="bg-[#60A5FA] p-5 rounded-xl flex-row gap-2 items-center justify-center"
          >
            {isPurchasing ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-center text-white text-xl font-semibold">
                Start Free 7-Day Trial
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <Text className="text-white text-center text-base mb-4">
          Try free for 7 days, then {displayPlans.find(p => p.id === selectedPlan)?.price || '$9.99/month'}. Cancel anytime.
        </Text>

        <View className="my-4">
          <TouchableOpacity
            onPress={handleRestorePurchases}
            disabled={isLoading}
            className="py-3"
          >
            <Text className="text-[#60A5FA] text-lg font-medium">
              Restore Purchases
            </Text>
          </TouchableOpacity>
          <Text className="text-gray-400 text-sm ">
            By continuing, you agree to our Terms of Service and Privacy Policy. Subscription automatically renews unless canceled at least 24 hours before the end of the current period.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  )
}

export default UnlockFacialGym