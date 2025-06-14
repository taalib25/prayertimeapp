import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
} from 'react-native';

interface InputWithLabelProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: any;
  editable?: boolean;
  isDate?: boolean;
  setShowDatePicker?: (visible: boolean) => void;
}

const InputWithLabel: React.FC<InputWithLabelProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
  editable = true,
  isDate,
  setShowDatePicker,
}) => {
  return (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          editable={editable && !isDate} // Ensure editable prop is handled correctly
        />
        {isDate && setShowDatePicker && (
          <TouchableOpacity
            onPress={() => setShowDatePicker(true)}
            style={styles.dateIcon}>
            {/* <Icon name="calendar-today" size={24} color="#007bff" /> */}
            {/* <SvgIcon name="calendar" size={24} color="#007bff" /> */}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

interface CustomButtonProps {
  onPress: () => void;
  title: string;
}

const CustomButton: React.FC<CustomButtonProps> = ({onPress, title}) => {
  return (
    <TouchableOpacity style={styles.button} onPress={onPress}>
      <Text style={styles.buttonText}>{title}</Text>
    </TouchableOpacity>
  );
};

// Assuming EditProfileScreen is the main component in this file
const EditProfileScreen: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [address, setAddress] = useState('');
  const [birthday, setBirthday] = useState('');
  const [nearestMasjid, setNearestMasjid] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [profileImage, setProfileImage] = useState(
    'https://example.com/default-profile.jpg',
  );

  // Mock data loading - replace with actual API calls
  useEffect(() => {
    // Simulate loading user data
    setName('Mohamed Hijaz');
    setEmail('user@example.com');
    setMobile('1234567890');
    setAddress('123 Main St');
    setBirthday('01/01/1990');
    setNearestMasjid('Central Masjid');
    setProfileImage('https://example.com/profile.jpg');
  }, []);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setBirthday(selectedDate.toLocaleDateString());
    }
  };

  const handleSaveChanges = () => {
    // Handle saving profile changes
    console.log('Saving changes:', {
      name,
      email,
      mobile,
      address,
      birthday,
      nearestMasjid,
    });
    // API call would go here
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.profileHeader}>
        <TouchableOpacity onPress={() => {}}>
          <View style={styles.profileImageContainer}>
            <Image
              source={
                profileImage
                  ? {uri: profileImage}
                  : require('./assets/default-avatar.png')
              } // Provide a fallback default avatar
              style={styles.profileImage}
            />
            <View style={styles.cameraIconContainer}>
              {/* <Icon name="photo-camera" size={20} color="#007bff" /> */}
              {/* <SvgIcon name="camera" size={20} color="#007bff" /> */}
            </View>
          </View>
        </TouchableOpacity>
      </View>

      <InputWithLabel
        label="Full Name"
        value={name}
        onChangeText={setName}
        placeholder="Enter your full name"
      />
      <InputWithLabel
        label="Email Address"
        value={email}
        onChangeText={setEmail}
        placeholder="Enter your email"
        keyboardType="email-address"
      />
      <InputWithLabel
        label="Date of Birth"
        value={birthday}
        onChangeText={setBirthday} // This might be read-only and set via date picker
        placeholder="YYYY-MM-DD"
        isDate={true}
        setShowDatePicker={setShowDatePicker}
        editable={false} // Make date field non-editable directly
      />

      {/* Example of DateTimePickerModal, ensure it's correctly integrated if used
            {showDatePicker && (
                <DateTimePickerModal
                    isVisible={showDatePicker}
                    mode="date"
                    onConfirm={onDateConfirm}
                    onCancel={() => setShowDatePicker(false)}
                    // date={dob ? new Date(dob) : new Date()} // Set initial date
                />
            )}
            */}

      <CustomButton title="Save Changes" onPress={handleSaveChanges} />
    </ScrollView>
  );
};


const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  profileHeader: {
    alignItems: 'center',
    marginVertical: 20,
  },
  profileImageContainer: {
    marginBottom: 10,
    position: 'relative',
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: '#007bff',
  },
  cameraIconContainer: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 5,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    color: '#495057',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 15,
    fontSize: 16,
    color: '#495057',
  },
  dateIcon: {
    padding: 10,
  },
  button: {
    backgroundColor: '#007bff',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  // Add any other styles your component uses
});

export default EditProfileScreen;
