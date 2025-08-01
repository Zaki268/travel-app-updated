import { View, Text } from 'react-native'
import React from 'react'
import { useAuthStore } from '../../store/authStore';
import styles from '../styles/profile.styles';
import {Image} from 'expo-image';
import { formatMemberSince } from '../../lib/utils';


export default function ProfileHeader() {

    const {user} = useAuthStore();

    // breaks the app if user.profileImage is null
    if(!user) return null;

  return (
    <View style={styles.profileHeader}>
     <Image source={{uri: user.profileImage}} style={styles.profileImage}  />
        <View style={styles.profileInfo}>
        <Text style={styles.username}>{user.username}</Text>
     <Text style={styles.email}>{user.email}</Text>
     <Text style={styles.memberSince}>📅joined {formatMemberSince(user.createdAt)}</Text>


        </View>
    </View>
  )
}