import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import {colors, spacing} from '../utils/theme';
import {
  EditProfileProvider,
  Header,
  ProfileHeader,
  FormFields,
  SaveButton,
  useEditProfile,
} from '../components/EditProfile';

// Content component that uses the context
const EditProfileContent: React.FC = () => {
  const {handleSave, isLoading} = useEditProfile();

  return (
    <>
      <Header />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <ProfileHeader />
        <FormFields />
        <SaveButton onPress={handleSave} isLoading={isLoading} />
        <View style={{height: spacing.xl}} />
      </ScrollView>
    </>
  );
};

// Main EditProfileScreen component
const EditProfileScreen: React.FC = () => {
  return (
    <EditProfileProvider>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
        <EditProfileContent />
      </SafeAreaView>
    </EditProfileProvider>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
  },
  container: {
    flex: 1,
    paddingTop: 30,
    backgroundColor: colors.white,
  },
});

export default EditProfileScreen;
