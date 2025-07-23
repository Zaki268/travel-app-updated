import { View, Text } from 'react-native'
import React from 'react'
import {Stack} from 'expo-router'
export default AuthLayout = () => {
  return(
    <Stack>
      <Stack.Screen name='index' options={{headerShown: false}}/>
      <Stack.Screen name='signup' options={{headerShown: false}}/>
      <Stack.Screen name='reset-password' options={{headerShown: false}}/>
      <Stack.Screen name='verify-code' options={{headerShown: false}}/>
      <Stack.Screen name='forgot-password' />
    </Stack>
  )  
 
}

