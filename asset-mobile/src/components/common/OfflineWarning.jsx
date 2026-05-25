import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNetwork } from '../../hooks/useNetwork';

export default function OfflineWarning({ message = 'คุณกำลังใช้งานในโหมดออฟไลน์ บางฟังก์ชันอาจไม่สามารถใช้งาน' }) {
    const { isConnected } = useNetwork();

    if (isConnected) return null;

    return (
        <View style={styles.container}>
            <Ionicons name="cloud-offline-outline" size={20} color="#B45309" />
            <Text style={styles.text}>{message}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        backgroundColor: '#FEF3C7',
        padding: 12,
        alignItems: 'center',
        marginHorizontal: 16,
        marginTop: 10,
        marginBottom: 5,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#FDE68A',
        gap: 8},
    text: {
        flex: 1,
        color: '#B45309',
        fontSize: 13,
        lineHeight: 18}});

