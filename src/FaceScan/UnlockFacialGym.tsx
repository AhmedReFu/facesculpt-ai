import { Ionicons } from '@expo/vector-icons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import Purchases, { PurchasesPackage } from 'react-native-purchases';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Toast, useToast } from '../hooks/useToost';

interface PlanProps {
  id: string
  title: string
  price: string
  badge?: string
  isSelected: boolean
  onSelect: () => void
}

interface FormattedPackage {
  id: string;
  title: string;
  price: string; // Display price in USD
  localPrice?: string; // Local price for reference
  badge: string;
  package: PurchasesPackage; // Store the actual RevenueCat package
  isTrialAvailable: boolean;
}

const PlanItem = ({ title, price, badge, isSelected, onSelect }: PlanProps) => (
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
          <Text className="text-[#9CA3AF] text-base mt-1">
            {price}
          </Text>
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
  const [selectedPlan, setSelectedPlan] = useState<string>('')
  const [plans, setPlans] = useState<FormattedPackage[]>([])
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState(false)

  // Fixed USD prices for display - these should match your RevenueCat USD prices
  const displayPricesUSD = {
    monthly: {
      price: "$14.99/month",
      title: "Monthly",
      badge: ""
    },
    sixmonthly: {
      price: "$69.99/6 months",
      title: "6 Month Plan",
      badge: "Popular"
    },
    yearly: {
      price: "$119.99/year",
      title: "Yearly",
      badge: ""
    }
  };

  // Helper function to check if trial is available
  const checkIfTrialAvailable = (product: any): boolean => {
    // Method 1: Check introPrice directly
    if (product.introPrice && product.introPrice.price === 0) {
      return true;
    }

    // Method 2: Check subscription options
    if (product.subscriptionOptions && Array.isArray(product.subscriptionOptions)) {
      for (const option of product.subscriptionOptions) {
        // Check if option has any property that indicates free trial
        // Look for common patterns in RevenueCat data
        const optionStr = JSON.stringify(option).toLowerCase();
        if (optionStr.includes('free') || optionStr.includes('trial')) {
          return true;
        }

        // Check for specific properties that might indicate trial
        if (option.introPrice && option.introPrice.price === 0) {
          return true;
        }

        // Check for pricing phases if they exist
        if ((option as any).phases && Array.isArray((option as any).phases)) {
          const freePhase = (option as any).phases.find((phase: any) => phase.price === 0);
          if (freePhase) {
            return true;
          }
        }
      }
    }

    // Method 3: Check product description
    if (product.description && product.description.toLowerCase().includes('free trial')) {
      return true;
    }

    return false;
  };

  // Get RevenueCat data and format it for UI
  const getRevenueCatData = async () => {
    try {
      setLoading(true)

      // Get user from storage for RevenueCat identification
      const stored = await AsyncStorage.getItem('user');
      const user = stored ? JSON.parse(stored) : null;

      if (user && user.phone_number) {
        try {
          await Purchases.logIn(user.phone_number);
          console.log("RevenueCat User Identified:", user.phone_number);
        } catch (loginError) {
          console.log("RevenueCat login error:", loginError);
          // Continue without login if it fails
        }
      }

      // Fetch offerings from RevenueCat
      const offerings = await Purchases.getOfferings();
      const premium = offerings?.current || offerings?.all?.premium;

      // console.log("Premium offering:", JSON.stringify(premium, null, 2));

      if (!premium || !premium.availablePackages || premium.availablePackages.length === 0) {
        console.log("No premium offering or packages found - using demo data");

        // Use demo data with USD prices
        const demoPlans: FormattedPackage[] = [
          {
            id: 'monthly',
            title: displayPricesUSD.monthly.title,
            price: displayPricesUSD.monthly.price,
            badge: displayPricesUSD.monthly.badge,
            package: null as any,
            isTrialAvailable: true
          },
          {
            id: 'sixmonthly',
            title: displayPricesUSD.sixmonthly.title,
            price: displayPricesUSD.sixmonthly.price,
            badge: displayPricesUSD.sixmonthly.badge,
            package: null as any,
            isTrialAvailable: true
          },
          {
            id: 'yearly',
            title: displayPricesUSD.yearly.title,
            price: displayPricesUSD.yearly.price,
            badge: displayPricesUSD.yearly.badge,
            package: null as any,
            isTrialAvailable: true
          }
        ];
        setPlans(demoPlans);
        setSelectedPlan('sixmonthly'); // Default to popular plan
        setLoading(false);
        return;
      }

      // Mapping RevenueCat packageType → our IDs
      const idMap: Record<string, string> = {
        MONTHLY: "monthly",
        SIX_MONTH: "sixmonthly",
        ANNUAL: "yearly",
        WEEKLY: "weekly",
        THREE_MONTH: "threemonthly",
        TWO_MONTH: "twomonthly"
      };

      // Format packages for UI
      const formatted: FormattedPackage[] = [];

      for (const pkg of premium.availablePackages) {
        const rcType = pkg.packageType;
        const id = idMap[rcType];

        if (!id || !displayPricesUSD[id as keyof typeof displayPricesUSD]) {
          console.warn(`Unknown or unsupported package type: ${rcType}`);
          continue;
        }

        const product = pkg.product;
        const displayPrice = displayPricesUSD[id as keyof typeof displayPricesUSD];

        // Check if free trial is available using helper function
        const isTrialAvailable = checkIfTrialAvailable(product);

        formatted.push({
          id,
          title: displayPrice.title,
          price: displayPrice.price, // Always show USD price
          localPrice: product.priceString, // Store local price for debugging
          badge: displayPrice.badge,
          package: pkg,
          isTrialAvailable
        });

        console.log(`Package ${id}:`, {
          displayPrice: displayPrice.price,
          localPrice: product.priceString,
          hasTrial: isTrialAvailable,
          productId: product.identifier,
          introPrice: product.introPrice,
          subscriptionOptions: product.subscriptionOptions
        });
      }

      // Sort plans: Popular first, then by order (monthly, sixmonthly, yearly)
      const sortOrder = { monthly: 1, sixmonthly: 2, yearly: 3 };
      formatted.sort((a, b) => {
        // Popular badge first
        if (a.badge === "Popular" && b.badge !== "Popular") return 1;
        if (b.badge === "Popular" && a.badge !== "Popular") return 1;

        // Then by predefined order
        return sortOrder[a.id as keyof typeof sortOrder] - sortOrder[b.id as keyof typeof sortOrder];
      });

      // console.log("FINAL PLANS DATA:", formatted);

      setPlans(formatted);

      // Set default selected plan
      const popularPlan = formatted.find(p => p.badge === "Popular");
      setSelectedPlan(popularPlan?.id || formatted[0]?.id || "");

    } catch (error: any) {
      console.error("RevenueCat Error:", error);

      // Fallback to USD demo data on error
      const demoPlans: FormattedPackage[] = [
        {
          id: 'monthly',
          title: displayPricesUSD.monthly.title,
          price: displayPricesUSD.monthly.price,
          badge: displayPricesUSD.monthly.badge,
          package: null as any,
          isTrialAvailable: true
        },
        {
          id: 'sixmonthly',
          title: displayPricesUSD.sixmonthly.title,
          price: displayPricesUSD.sixmonthly.price,
          badge: displayPricesUSD.sixmonthly.badge,
          package: null as any,
          isTrialAvailable: true
        },
        {
          id: 'yearly',
          title: displayPricesUSD.yearly.title,
          price: displayPricesUSD.yearly.price,
          badge: displayPricesUSD.yearly.badge,
          package: null as any,
          isTrialAvailable: true
        }
      ];

      setPlans(demoPlans);
      setSelectedPlan('sixmonthly');

      // Show error toast if needed
      toast.show({
        message: 'Unable to load subscription plans. Please check your internet connection.',
        type: 'warning',
        style: 'center',
        buttons: [{ text: 'OK', action: 'dismiss' }]
      });

    } finally {
      setLoading(false);
    }
  };

  // Load RevenueCat data on component mount
  useEffect(() => {
    getRevenueCatData();

    // Optional: Add listener for purchases restored from outside the app
    const setupPurchaseListeners = () => {
      Purchases.addCustomerInfoUpdateListener((customerInfo) => {
        console.log("Customer info updated:", customerInfo);
        if (customerInfo.entitlements.active?.premium) {
          console.log("User has active premium subscription");
        }
      });
    };

    setupPurchaseListeners();

    return () => {
      // Clean up listeners if needed
    };
  }, []);

  const handleSelectPlan = (planId: string) => {
    setSelectedPlan(planId)
    console.log('Selected plan:', planId)
  }

  const handleSubscribe = async () => {
    if (purchasing) return;

    try {
      setPurchasing(true);

      // Find the selected plan
      const selectedPlanData = plans.find(p => p.id === selectedPlan);

      if (!selectedPlanData) {
        toast.show({
          message: 'Please select a plan first',
          type: 'error',
          style: 'center',
          buttons: [{ text: 'OK', action: 'dismiss' }]
        });
        return;
      }

      // Check if we have a real RevenueCat package
      if (!selectedPlanData.package) {
        // Demo mode - simulate purchase
        console.log('Demo mode: Simulating purchase for', selectedPlan);

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        await AsyncStorage.setItem("subscribe", "true");
        await AsyncStorage.setItem("current_plan", selectedPlan);

        toast.show({
          message: '🎉 Your 7-day free trial has started. Welcome to FaceSculpt AI Premium!',
          type: 'success',
          style: 'center',
          buttons: [
            {
              text: 'Get Started',
              action: 'custom',
              onPress: () => navigator.navigate("DailyTrack" as never)
            }
          ]
        });
        return;
      }

      // Real purchase with RevenueCat
      console.log('Purchasing package:', selectedPlanData.package.identifier);
      console.log('Product details:', JSON.stringify({
        id: selectedPlanData.package.product.identifier,
        price: selectedPlanData.package.product.price,
        currency: selectedPlanData.package.product.currencyCode,
        priceString: selectedPlanData.package.product.priceString,
        title: selectedPlanData.package.product.title,
        introPrice: selectedPlanData.package.product.introPrice,
        subscriptionOptions: selectedPlanData.package.product.subscriptionOptions
      }, null, 2));

      // Make the purchase
      const makePurchaseResult = await Purchases.purchasePackage(
        selectedPlanData.package,
        null, // upgradeInfo (optional)
        null, // googleProductChangeInfo (optional)
        null  // googleIsPersonalizedPrice (optional)
      );

      // Check if purchase was successful
      if (makePurchaseResult.customerInfo.entitlements.active?.premium) {
        console.log('Purchase successful!', makePurchaseResult.customerInfo);

        // Store subscription info
        await AsyncStorage.setItem("subscribe", "true");
        await AsyncStorage.setItem("current_plan", selectedPlan);
        await AsyncStorage.setItem("revenuecat_customer_info", JSON.stringify(makePurchaseResult.customerInfo));

        toast.show({
          message: '🎉 Purchase successful! Welcome to FaceSculpt AI Premium!',
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
      } else {
        // This shouldn't happen if purchase is successful, but handle it anyway
        console.log('Purchase completed but no active entitlement');
        await AsyncStorage.setItem("subscribe", "true");
        await AsyncStorage.setItem("current_plan", selectedPlan);
        await AsyncStorage.setItem("revenuecat_customer_info", JSON.stringify(makePurchaseResult.customerInfo));

        toast.show({
          message: '🎉 Purchase successful! Welcome to FaceSculpt AI Premium!',
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
        // throw new Error('Purchase was not successful');
      }

    } catch (error: any) {
      // console.error('Purchase Error:',);
      console.log(error.code)
      if (error.code === "ProductAlreadyPurchasedError") {
        await AsyncStorage.setItem("subscribe", "true")
        toast.show({
          message: error,
          type: "success",
          style: 'top',
          buttons: [{
            text: 'OK',
            action: 'custom',
            onPress: () => navigator.navigate('DailyTrack')
          }]
        });
      }

      // Check error codes
      const errorCode = Purchases.PURCHASES_ERROR_CODE;

      if (error.code === errorCode.PURCHASE_CANCELLED_ERROR) {
        console.log('User cancelled purchase');
        // Don't show error for cancellation
      } else if (error.message === 'This product is already active for the user.') {
        await AsyncStorage.setItem("subscribe", "true")
        toast.show({
          message: error.message,
          type: 'success',
          style: 'center',
          buttons: [
            {
              text: 'OK',
              action: 'custom',
              onPress: () => navigator.navigate('FaceScan')
            }
          ]
        });
      }
      else if (error.code === errorCode.NETWORK_ERROR) {
        toast.show({
          message: 'Network error. Please check your internet connection and try again.',
          type: 'error',
          style: 'center',
          buttons: [{ text: 'OK', action: 'dismiss' }]
        });
      } else {
        toast.show({
          message: error.message || 'Something went wrong. Please try again.',
          type: 'error',
          style: 'center',
          buttons: [{ text: 'OK', action: 'dismiss' }]
        });
      }
    } finally {
      setPurchasing(false);
    }
  }

  const handleRestorePurchases = async () => {
    try {
      setLoading(true);
      const stored = await AsyncStorage.getItem('user');
      const user = stored ? JSON.parse(stored) : null;

      await Purchases.logIn(user.phone_number);
      // console.log("RevenueCat User Identified:", user.phone_number);

      // Restore purchases through RevenueCat
      const customerInfo = await Purchases.restorePurchases();

      // Get the facesclupt_ai subscription data
      const facesculptSubscription = customerInfo.subscriptionsByProductIdentifier?.facesclupt_ai;

      if (facesculptSubscription) {
        // Validate the subscription
        const isActive = facesculptSubscription.isActive === true;
        const isSandbox = facesculptSubscription.isSandbox === true;

        console.log("📱 Facesculpt AI Subscription Details:", {
          productIdentifier: facesculptSubscription.productIdentifier,
          isActive,
          isSandbox,
          expiresDate: facesculptSubscription.expiresDate,
          purchaseDate: facesculptSubscription.purchaseDate,
          willRenew: facesculptSubscription.willRenew,
          store: facesculptSubscription.store
        });

        // Validate if subscription is valid (active and not expired)
        if (isActive) {
          console.log("✅ Valid subscription - Grant access to premium features");
          // Grant access to premium features
          toast.show({
            message: 'Your purchases have been restored successfully!',
            type: 'success',
            style: 'center',
            buttons: [
              {
                text: 'OK',
                action: 'custom',
                onPress: () => navigator.navigate("DailyTrack" as never)
              }
            ]
          });
        } else {
          console.log("❌ Subscription invalid - Restrict access");
          if (!isActive) console.log("   Reason: Subscription is not active");
        }

        // Check if it's a sandbox purchase (testing)
        if (isSandbox) {
          console.log("🔧 Note: This is a SANDBOX purchase (testing environment)");
          toast.show({
            message: 'Your purchases have been restored successfully!',
            type: 'success',
            style: 'center',
            buttons: [
              {
                text: 'OK',
                action: 'custom',
                onPress: () => navigator.navigate("DailyTrack" as never)
              }
            ]
          });
        }
      } else {
        console.log("❌ No facesclupt_ai subscription found in subscriptionsByProductIdentifier");
      }


      if (customerInfo.entitlements.active?.premium) {
        console.log('Restore successful:', customerInfo);

        // Store updated customer info
        await AsyncStorage.setItem("subscribe", "true");
        await AsyncStorage.setItem("revenuecat_customer_info", JSON.stringify(customerInfo));

        toast.show({
          message: 'Your purchases have been restored successfully!',
          type: 'success',
          style: 'center',
          buttons: [
            {
              text: 'OK',
              action: 'custom',
              onPress: () => navigator.navigate("DailyTrack" as never)
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
      console.error('Restore error:', error);
      toast.show({
        message: 'Failed to restore purchases. Please try again.',
        type: 'error',
        style: 'center',
        buttons: [{ text: 'OK', action: 'dismiss' }]
      });
    } finally {
      setLoading(false);
    }
  }

  // Get trial text based on selected plan
  const getTrialText = () => {
    if (!selectedPlan) return '';

    const selectedPlanData = plans.find(p => p.id === selectedPlan);
    if (!selectedPlanData) return '';

    const hasTrial = selectedPlanData.isTrialAvailable;
    const priceText = selectedPlanData.price;

    if (hasTrial) {
      return `Try free for 7 days, then ${priceText}. Cancel anytime.`;
    } else {
      return `Subscribe for ${priceText}. Cancel anytime.`;
    }
  }

  // Get button text based on trial availability
  const getButtonText = () => {
    if (!selectedPlan) return "Subscribe Now";

    const selectedPlanData = plans.find(p => p.id === selectedPlan);
    if (!selectedPlanData) return "Subscribe Now";

    return selectedPlanData.isTrialAvailable
      ? "Start Free 7-Day Trial"
      : "Subscribe Now";
  }

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-[#000000] items-center justify-center">
        <ActivityIndicator size="large" color="#60A5FA" />
        <Text className="text-white mt-4">Loading plans...</Text>
      </SafeAreaView>
    );
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
            disabled={purchasing || !selectedPlan}
            className={`p-5 rounded-xl flex-row gap-2 items-center justify-center ${purchasing || !selectedPlan ? 'bg-gray-600' : 'bg-[#60A5FA]'
              }`}
          >
            {purchasing ? (
              <>
                <ActivityIndicator size="small" color="white" />
                <Text className="text-center text-white text-xl font-semibold ml-2">
                  Processing...
                </Text>
              </>
            ) : (
                <Text className="text-center text-white text-xl font-semibold">
                  {getButtonText()}
                </Text>
            )}
          </TouchableOpacity>
        </View>

        {selectedPlan && (
          <Text className="text-white text-center text-base mb-4">
            {getTrialText()}
          </Text>
        )}

        {/* Optional: Add a note about currency conversion */}


        <View className="my-4">
          <TouchableOpacity
            onPress={handleRestorePurchases}
            className="py-3"
            disabled={loading}
          >
            <Text className={`text-lg font-medium ${loading ? 'text-gray-500' : 'text-[#60A5FB]'}`}>
              Restore Purchases
            </Text>
          </TouchableOpacity>
          <Text className="text-gray-400 text-sm">
            By continuing, you agree to our Terms of Service and Privacy Policy.
            Subscription automatically renews unless canceled at least 24 hours before the end of the current period.
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