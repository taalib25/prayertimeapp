import React from 'react';
import {View, StyleSheet} from 'react-native';
import FormField from './FormField';
import DateField from './DateField';
import {useEditProfile} from '../../contexts/EditProfileContext';
import {spacing} from '../../utils/theme';

// Configuration for form fields - makes it easy to add new fields
const FORM_FIELDS_CONFIG = [
  {
    key: 'name' as const,
    label: 'Name',
    placeholder: 'Enter your full name',
    type: 'text',
  },
  {
    key: 'email' as const,
    label: 'E-mail',
    placeholder: 'Enter your email address',
    type: 'text',
    keyboardType: 'email-address',
    autoCapitalize: 'none' as const,
  },
  {
    key: 'mobile' as const,
    label: 'Mobile',
    placeholder: 'Enter your mobile number',
    type: 'text',
    keyboardType: 'phone-pad',
  },
  {
    key: 'address' as const,
    label: 'Address',
    placeholder: 'Enter your address',
    type: 'text',
    multiline: true,
    numberOfLines: 3,
  },
  {
    key: 'dateOfBirth' as const,
    label: 'Date Of Birth',
    type: 'date',
  },
  {
    key: 'nearestMasjid' as const,
    label: 'Nearest Masjid',
    placeholder: 'Enter nearest masjid name',
    type: 'text',
  },
];

const FormFields: React.FC = () => {
  const {formData, errors, updateField} = useEditProfile();

  const renderField = (fieldConfig: (typeof FORM_FIELDS_CONFIG)[0]) => {
    const {key, type, ...props} = fieldConfig;

    if (type === 'date') {
      return (
        <DateField
          key={key}
          label={props.label}
          value={formData[key]}
          onDateChange={value => updateField(key, value)}
          error={errors[key]}
        />
      );
    }

    return (
      <FormField
        key={key}
        {...props}
        value={formData[key]}
        onChangeText={value => updateField(key, value)}
        error={errors[key]}
      />
    );
  };

  return (
    <View style={styles.container}>{FORM_FIELDS_CONFIG.map(renderField)}</View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
});

export default FormFields;
