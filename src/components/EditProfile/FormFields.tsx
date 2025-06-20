import React, {useState} from 'react';
import {View, StyleSheet, Text, TouchableOpacity} from 'react-native';
import FormField from './FormField';
import DateField from './DateField';
import DropdownField from './DropdownField';
import CheckboxField from './CheckboxField';
import {useEditProfile} from '../../contexts/EditProfileContext';
import {spacing} from '../../utils/theme';
import {typography} from '../../utils/typography';

// Configuration for basic form fields (removed age)
const BASIC_FIELDS_CONFIG = [
  {
    key: 'name' as const,
    label: 'Username *',
    placeholder: 'Enter username',
    type: 'text',
  },
  {
    key: 'email' as const,
    label: 'Email Address *',
    placeholder: 'Enter email address',
    type: 'text',
    keyboardType: 'email-address',
    autoCapitalize: 'none' as const,
  },
  {
    key: 'mobile' as const,
    label: 'Phone Number',
    placeholder: 'Enter phone number',
    type: 'text',
    keyboardType: 'phone-pad',
  },
  {
    key: 'address' as const,
    label: 'Location',
    placeholder: 'Enter location/address',
    type: 'text',
    multiline: true,
    numberOfLines: 3,
  },
];

// Mobility options with key-value format for SelectList
const MOBILITY_OPTIONS = [
  {key: 'walking', value: 'Walking'},
  {key: 'bicycle', value: 'Bicycle'},
  {key: 'motorcycle', value: 'Motorcycle'},
  {key: 'car', value: 'Car'},
  {key: 'public_transport', value: 'Public Transport'},
  {key: 'other', value: 'Other'},
];

// Additional info configuration
const ADDITIONAL_INFO_CONFIG = [
  {
    key: 'livingOnRent' as const,
    label: 'Living on Rent',
  },
  {
    key: 'zakatEligible' as const,
    label: 'Zakat Eligible',
  },
  {
    key: 'differentlyAbled' as const,
    label: 'Differently Abled',
  },
  {
    key: 'muallafathiQuloob' as const,
    label: 'Muallafathi Quloob (Convert)',
  },
];

const FormFields: React.FC = () => {
  const {formData, errors, updateField} = useEditProfile();
  const [showAdditionalInfo, setShowAdditionalInfo] = useState(false);

  const renderBasicField = (fieldConfig: (typeof BASIC_FIELDS_CONFIG)[0]) => {
    const {key, type, ...props} = fieldConfig;

    if (type === 'date') {
      return (
        <DateField
          key={key}
          label={props.label}
          value={formData[key] as string}
          onDateChange={value => updateField(key, value)}
          error={errors[key]}
        />
      );
    }

    return (
      <FormField
        key={key}
        {...props}
        value={formData[key] as string}
        onChangeText={value => updateField(key, value)}
        error={errors[key]}
      />
    );
  };

  const renderCheckboxField = (
    fieldConfig: (typeof ADDITIONAL_INFO_CONFIG)[0],
  ) => {
    const {key, label} = fieldConfig;
    return (
      <CheckboxField
        key={key}
        label={label}
        value={formData[key] as boolean}
        onValueChange={value => updateField(key, value)}
      />
    );
  };

  return (
    <View style={styles.container}>
      {/* Basic Information Section */}
      <View style={styles.section}>
        {BASIC_FIELDS_CONFIG.map(renderBasicField)}
      </View>

      {/* Mobility Section */}
      <View style={styles.section}>
        <DropdownField
          label="Mobility (How they travel to mosque)"
          value={formData.mobility}
          onValueChange={value => updateField('mobility', value)}
          options={MOBILITY_OPTIONS}
          placeholder="Select mobility option"
          error={errors.mobility}
        />

        {/* Conditional "Other" field for mobility */}
        {formData.mobility === 'other' && (
          <FormField
            label="If Other, please specify"
            value={formData.mobilityOther}
            onChangeText={value => updateField('mobilityOther', value)}
            placeholder="Please specify"
            error={errors.mobilityOther}
          />
        )}
      </View>

      {/* Date and Masjid Section */}
      <View style={styles.section}>
        <DateField
          label="Date Of Birth"
          value={formData.dateOfBirth}
          onDateChange={value => updateField('dateOfBirth', value)}
          error={errors.dateOfBirth}
        />

        <FormField
          label="Nearest Masjid"
          value={formData.nearestMasjid}
          onChangeText={value => updateField('nearestMasjid', value)}
          placeholder="Enter nearest masjid name"
          error={errors.nearestMasjid}
        />
      </View>

      {/* Expandable Additional Information Section */}
      <View style={styles.additionalInfoSection}>
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => setShowAdditionalInfo(!showAdditionalInfo)}
          activeOpacity={0.7}>
          <Text style={styles.sectionTitle}>Additional Information</Text>
          <Text
            style={[
              styles.expandIcon,
              showAdditionalInfo && styles.expandIconRotated,
            ]}>
            ▼
          </Text>
        </TouchableOpacity>

        {showAdditionalInfo && (
          <View style={styles.checkboxContainer}>
            {ADDITIONAL_INFO_CONFIG.map(renderCheckboxField)}
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  section: {
    marginBottom: spacing.md,
  },
  additionalInfoSection: {
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  sectionTitle: {
    ...typography.h3,
    fontSize: 18,
    color: '#333',
  },
  expandIcon: {
    fontSize: 16,
    color: '#666',
    transform: [{rotate: '0deg'}],
  },
  expandIconRotated: {
    transform: [{rotate: '180deg'}],
  },
  checkboxContainer: {
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.md,
  },
});

export default FormFields;
