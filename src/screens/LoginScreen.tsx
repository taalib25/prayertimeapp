import React from 'react';
import {View, Text, StyleSheet, TextInput} from 'react-native';
import CustomButton from '../components/CustomButton';

// Define props for LoginScreen
interface LoginScreenProps {
  onLogin: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({onLogin}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        keyboardType="email-address"
      />
      <TextInput style={styles.input} placeholder="Password" secureTextEntry />
      <CustomButton
        title="Login"
        onPress={onLogin} // Use the onLogin prop
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  input: {
    width: '100%',
    height: 50,
    backgroundColor: '#fff',
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 15,
    paddingHorizontal: 15,
    fontSize: 16,
  },
});

export default LoginScreen;
