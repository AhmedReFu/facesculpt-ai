import { Ionicons } from '@expo/vector-icons';
import EvilIcons from '@expo/vector-icons/EvilIcons';
import { useNavigation } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import tw from "twrnc";
import CustomButton from '../Components/CustomButton';


const FaceMetrics = ({ route }: any) => {
    const navigator = useNavigation();
    const { imageUri } = route.params;
  return (
      <View style={tw`flex-1 bg-[#000000] px-6`}>
          <StatusBar style='light' />
          <View style={tw`mt-14 flex-1`}>
              <View style={tw``}>
                  <View style={tw` flex-row justify-between`}>
                      <Text style={tw`text-white text-3xl font-bold`}>Face Metrics</Text>
                      <TouchableOpacity
                          onPress={() => navigator.goBack()}
                          
                      >
                          <Ionicons name="close" size={34} color="white" />
                      </TouchableOpacity>

                  </View>
                  <Text style={tw`text-[#9CA3AF] text-xl my-4`}>
                      From your latest scan
                  </Text>
              </View>

              <View style={tw``}>
                  <Image source={{ uri: imageUri }} style={tw`h-56 rounded-3xl`} resizeMode="contain" />
              </View>
              <View style={tw`bg-[#262a30] p-4 rounded-2xl`}>
                  <View style={tw`flex-row items-center`}>
                      <View style={tw`bg-[#60A5FB] rounded-md p-1 mr-4`}>
                          <EvilIcons name="chart" size={24} color="black" />
                      </View>
                      <Text style={tw`text-white text-2xl`}>Face Metrics</Text>
                  </View>
                  <View style={tw`flex-row items-center my-1 justify-between`}>
                      <View>
                          <Text style={tw`text-[#9CA3AF] text-xl my-2`}>Jawline Angle</Text>
                          <Text style={tw`text-[#9CA3AF] text-lg`}>Goal 118°</Text>
                      </View>
                      <View>
                          <Text style={tw`text-white text-2xl`}>130°</Text>
                      </View>
                  </View>
                  <View style={tw`flex-row items-center my-1 justify-between`}>
                      <View>
                          <Text style={tw`text-[#9CA3AF] text-xl my-2`}>Symmetry Score</Text>
                          <Text style={tw`text-[#9CA3AF] text-lg`}>Goal 97%</Text>
                      </View>
                      <View>
                          <Text style={tw`text-white text-2xl`}>89%</Text>
                      </View>
                  </View>
                  <View style={tw`flex-row items-center my-1 justify-between`}>
                      <View>
                          <Text style={tw`text-[#9CA3AF] text-xl my-2`}>Puffiness Index</Text>
                          <Text style={tw`text-[#9CA3AF] text-lg`}>Goal 0.30</Text>
                      </View>
                      <View>
                          <Text style={tw`text-white text-2xl`}>0.86</Text>
                      </View>
                  </View>
                  <Text style={tw`text-white text-[4]`}>Al suggests working on jawline and puffiness.</Text>
              </View>
              <Text style={tw`text-white text-xl mt-6`}>Next, choose your focus goal</Text>
              <Text style={tw`text-[#9CA3AF] text-[4] my-2`}>We'll tailor a 7-day routine around it. You can change anytime.</Text>
          </View>
          <View style={tw`my-6`}>
              <CustomButton name="Choose goals" route="ChooseGoal" />
          </View>
      </View>
    
  )
}

export default FaceMetrics