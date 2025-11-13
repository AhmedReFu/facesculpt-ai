import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import tw from "twrnc";
import CustomButton from '../Components/CustomButton';



const DailyRoutine = () => {
    const navigator = useNavigation();
  return (
      <View style={tw`flex-1 bg-[#000000] px-6`}>
          <StatusBar style='light' />
          <View style={tw`mt-14 flex-1`}>
              <View style={tw`mb-6`}>
                  <View style={tw`flex-row items-center justify-center py-4 relative`}>
                      <TouchableOpacity
                          onPress={() => navigator.goBack()}
                          style={tw`right-28`}
                      >
                          <Ionicons name="arrow-back" size={28} color="white" />
                      </TouchableOpacity>

                      <Text style={tw`text-white text-xl font-semibold`}>
                          Today's Routine
                      </Text>
                  </View>
                  <Text style={tw`text-[#9CA3AF] text-lg mt-4 leading-6`}>
                      Personalized from your latest scan.
                  </Text>
              </View>
              <View>
                  <View style={tw`flex-row  bg-[#1D2229] rounded-xl p-4 my-4`}>
                      <MaterialIcons name="auto-awesome" size={28} color="#60A5FB" />
                      <Text style={tw`text-white text-lg  px-4 `}>Based on your facial scan, these workouts were created to strengthen and balance your features.</Text>
                  </View>
                  <View style={tw`flex-row justify-between items-center  bg-[#1D2229] rounded-xl p-4 my-2`}> <View style={tw`flex-row items-center`}>
                      <View style={tw`bg-[#202F41] p-3 rounded-xl mr-4`}>
                          <MaterialCommunityIcons name="meditation" size={28} color="#60A5FB" />
                      </View>
                      <View>
                          <Text style={tw`text-white text-lg `}>Jaw Clench Hold</Text>
                          <Text style={tw`text-white`}>8s</Text>
                      </View>
                  </View>
                      <MaterialIcons name="keyboard-arrow-right" size={30} color="white" />
                  </View>
                  <View style={tw`flex-row justify-between items-center  bg-[#1D2229] rounded-xl p-4 my-2`}> <View style={tw`flex-row items-center`}>
                      <View style={tw`bg-[#202F41] p-3 rounded-xl mr-4`}>
                          <MaterialCommunityIcons name="meditation" size={28} color="#60A5FB" />
                      </View>
                      <View>
                          <Text style={tw`text-white text-lg `}>Jaw Clench Hold</Text>
                          <Text style={tw`text-white`}>8s</Text>
                      </View>
                  </View>
                      <MaterialIcons name="keyboard-arrow-right" size={30} color="white" />
                  </View>
                  <View style={tw`flex-row justify-between items-center  bg-[#1D2229] rounded-xl p-4 my-2`}> <View style={tw`flex-row items-center`}>
                      <View style={tw`bg-[#202F41] p-3 rounded-xl mr-4`}>
                          <MaterialCommunityIcons name="meditation" size={28} color="#60A5FB" />
                      </View>
                      <View>
                          <Text style={tw`text-white text-lg `}>Jaw Clench Hold</Text>
                          <Text style={tw`text-white`}>8s</Text>
                      </View>
                  </View>
                      <MaterialIcons name="keyboard-arrow-right" size={30} color="white" />
                  </View>
                  <View style={tw`flex-row justify-between items-center  bg-[#1D2229] rounded-xl p-4 my-2`}> <View style={tw`flex-row items-center`}>
                      <View style={tw`bg-[#202F41] p-3 rounded-xl mr-4`}>
                          <MaterialCommunityIcons name="meditation" size={28} color="#60A5FB" />
                      </View>
                      <View>
                          <Text style={tw`text-white text-lg `}>Jaw Clench Hold</Text>
                          <Text style={tw`text-white`}>8s</Text>
                      </View>
                  </View>
                      <MaterialIcons name="keyboard-arrow-right" size={30} color="white" />
                  </View>
              </View>
              <View> 
              </View>
          </View>
          <View style={tw`my-4`}>
              <CustomButton name="Start Workout" route="DailyRoutine" />
        </View>
      </View>
  )
}

export default DailyRoutine