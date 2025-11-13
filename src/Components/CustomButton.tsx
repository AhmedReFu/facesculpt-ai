import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import tw from "twrnc";

const CustomButton = ({ name, route }: any) => {
    const navigator = useNavigation();
  return (
      <TouchableOpacity
          onPress={() =>
              (navigator as any).navigate(route)
          }
          activeOpacity={0.8}
          style={tw`bg-[#60A5FB] p-5 my-6 rounded-xl flex-row gap-2 items-center justify-center`}>
          <Text style={tw`text-center text-xl font-semibold`}>{name}</Text>
      </TouchableOpacity>
  )
}

export default CustomButton