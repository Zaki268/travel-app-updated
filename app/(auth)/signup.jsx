import { View, Text, KeyboardAvoidingView, TextInput, Platform, TouchableOpacity, Alert, ActivityIndicator } from 'react-native'
import React, { useState } from 'react'
import styles from '../styles/signup.styles';
import { Ionicons } from '@expo/vector-icons';
import {useRouter} from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import COLORS from '../../constants/color';


export default Signup = () => {

    const [email, setEmail] = useState("");
    const [name, setName] = useState("");
    const [password, setPassword] = useState("");
    // const [phone, setPhone] = useState("");
        const [phone, setPhone] = useState("252"); // Initialize with 252 prefix
    const [displayPhone, setDisplayPhone] = useState("+252"); // Display value with +252
    const [showPassword, setShowPassword] = useState(false);
    const router = useRouter();

    // Zustand store for authentication
    const {user, isLoading, register, token} = useAuthStore();

const handleSignup = async () => {
        // Ensure phone has the 252 prefix
        const formattedPhone = phone.startsWith("252") ? phone : `252${phone}`;
        
        const result = await register(name, formattedPhone, email, password);
        if(!result.success) Alert.alert("Error", result.error);
    }

    const handlePhoneChange = (text) => {
        // Remove non-digit characters
        const cleaned = text.replace(/\D/g, '');
        
        // If user tries to delete the +252 prefix, prevent it
        if (cleaned.length < 3) {
            setDisplayPhone("+252");
            setPhone("252");
            return;
        }
        
        // If input starts with 252, use it as is
        if (cleaned.startsWith("252")) {
            setDisplayPhone(`+${cleaned}`);
            setPhone(cleaned);
        } 
        // If input starts with something else (like 0), prepend 252
        else {
            const fullNumber = `252${cleaned}`;
            setDisplayPhone(`+${fullNumber}`);
            setPhone(fullNumber);
        }
    };


    // console.log("user", user);
    // console.log("token", token);

  return (
     <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >

          <View style={styles.container}>
            <View style={styles.card}>

              {/* header */}
              <View style={styles.header}>
                <Text style={styles.title}>My Trip</Text>
                <Text style={styles.subtitle}>Connecting Travelers & Vehicles.</Text>
                </View>

                <View style={styles.formContainer}>
                  {/* name */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Full name</Text>
                    <View style={styles.inputContainer}>
                      <Ionicons
                        name="person-outline"
                        size={20}
                        color={COLORS.primary}
                        style={styles.inputIcon}
                      />
                      <TextInput
                        style={styles.input}
                        placeholder="Abdisalan Ibrahim Isack"
                        placeholderTextColor={COLORS.placeholderText}
                        value={name}
                        onChangeText={setName}
                        autoCapitalize='none'
                      />
                    </View>
                  </View>
                    {/* phone */}
                  <View style={styles.inputGroup}>
                        <Text style={styles.label}>Phone</Text>
                        <View style={styles.inputContainer}>
                            <Ionicons
                                name="call-outline"
                                size={20}
                                color={COLORS.primary}
                                style={styles.inputIcon}
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="+252613........"
                                placeholderTextColor={COLORS.placeholderText}
                                value={displayPhone}
                                onChangeText={handlePhoneChange}
                                keyboardType='phone-pad'
                                maxLength={13} // +252 + 9 digits = 13 characters
                            />
                        </View>
                    </View>

                    {/* email */}

                    <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputContainer}>
              <Ionicons
                name="mail-outline"
                size={20}
                color={COLORS.primary}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="example@gmail.com"
                placeholderTextColor={COLORS.placeholderText}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* password */}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputContainer}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={COLORS.primary}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor={COLORS.placeholderText}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={20}
                color={COLORS.primary}
                style={styles.inputIcon}
                onPress={() => setShowPassword(!showPassword)}
              />
            </View>
          </View>

           {/* login button */}
           <TouchableOpacity
            style={styles.button}
            onPress={handleSignup}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Sign up</Text>
            )}
          </TouchableOpacity>

            {/* footer */}
            <View style={styles.footer}>
            <Text style={styles.footerText}>
            Already have an account?</Text>
               <TouchableOpacity onPress={() => router.back()}>
                  <Text style={styles.link}>Login</Text>
               </TouchableOpacity>
               
            </View>

                </View>
            </View>
          </View>

        </KeyboardAvoidingView>
  )
}

