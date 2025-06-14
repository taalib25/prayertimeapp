import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SvgIcon from './SvgIcon';

interface CallWidgetProps {
    onCallPreferenceSet: (needsCall: boolean) => void;
}

const STORAGE_KEY = 'prayer_app_call_preference';

const CallWidget: React.FC<CallWidgetProps> = ({ onCallPreferenceSet }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        checkIfFirstTimeUser();
    }, []);

    const checkIfFirstTimeUser = async () => {
        try {
            const value = await AsyncStorage.getItem(STORAGE_KEY);
            if (value === null) {
                // First time user, show the widget
                setIsVisible(true);
            }
        } catch (error) {
            console.error('Error checking first time user status:', error);
        }
    };

    const handlePreference = async (needsCall: boolean) => {
        try {
            // Save the user's preference
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ needsCall }));
            // Hide the widget
            setIsVisible(false);
            // Call the callback function
            onCallPreferenceSet(needsCall);
        } catch (error) {
            console.error('Error saving call preference:', error);
        }
    };

    if (!isVisible) {
        return null;
    }

    return (
        <View style={styles.overlay}>
            <View style={styles.container}>
                <View style={styles.starContainer}>
                    <SvgIcon name="callMoon" size={20}style={styles.star} />
                </View>
                <Text style={styles.title}>
                    Do you want a wake-up call for daily Fajr prayer?
                </Text>
                <TouchableOpacity
                    style={styles.yesButton}
                    onPress={() => handlePreference(true)}
                >
                    <Text style={styles.yesButtonText}>Yes, I need a call</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.noButton}
                    onPress={() => handlePreference(false)}
                >
                    <Text style={styles.noButtonText}>No, I'll wake up myself</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const { width } = Dimensions.get('window');
const styles = StyleSheet.create({
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    container: {
        width: width * 0.85,
        maxWidth: 400,
        backgroundColor: '#1F2554',
        borderRadius: 15,
        padding: 20,
        alignItems: 'center',
        overflow: 'hidden',
    },
    starContainer: {
        position: 'absolute',
        top: 10,
        right: 10,
    },
    star: {
        opacity: 0.8,
    },
    iconContainer: {
        marginBottom: 15,
    },
    title: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 20,
    },
    yesButton: {
        width: '100%',
        backgroundColor: '#4CAF50',
        borderRadius: 8,
        padding: 12,
        marginBottom: 10,
    },
    yesButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    noButton: {
        width: '100%',
        backgroundColor: '#3498db',
        borderRadius: 8,
        padding: 12,
    },
    noButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
    },
});

export default CallWidget;