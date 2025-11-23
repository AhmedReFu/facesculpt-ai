import { CustomInputProps } from "../../type";
import { useState } from "react";
import { Text, TextInput, View } from 'react-native';
import tw from "twrnc";



const CustomInput = ({ placeholder, value, onChangeText, label, secureTextEntry = false, keyboardType = "default" }: CustomInputProps) => {
    const [isFocused, setIsFocused] = useState(false);


    return (
        <View style={tw`w-full`}>
            <Text style={tw`label`}>{label}</Text>
            <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                value={value}
                onChangeText={onChangeText}
                secureTextEntry={secureTextEntry}
                keyboardType={keyboardType}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder={placeholder}
                placeholderTextColor="#888"
                style={tw`'input', isFocused ? 'border-primary' : 'border-gray-300'`}
            />
        </View>
    )
}
export default CustomInput