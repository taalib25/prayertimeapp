import React from 'react';
import {View, StyleSheet, Text} from 'react-native';
import FormField from './FormField';
import DateField from './DateField';
import CheckboxField from './CheckboxField';
import LocationMobilitySection from './LocationMobilitySection';
import {useEditProfile} from '../../contexts/EditProfileContext';
import {spacing, colors, borderRadius} from '../../utils/theme';
import {typography} from '../../utils/typography';

// Configuration for basic form fields
const BASIC_FIELDS_CONFIG = [
  {
    key: 'firstName' as const,
    label: 'First Name',
    placeholder: 'Enter first name',
    type: 'text',
  },
  {
    key: 'lastName' as const,
    label: 'Last Name',
    placeholder: 'Enter last name',
    type: 'text',
  },
  {
    key: 'email' as const,
    label: 'Email Address',
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
    key: 'dateOfBirth' as const,
    label: 'Date Of Birth',
    type: 'date',
  },
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

  // Set required field status for basic fields
  const renderBasicField = (fieldConfig: (typeof BASIC_FIELDS_CONFIG)[0]) => {
    const {key, type, ...props} = fieldConfig;
    const isRequired = props.label.includes('*');

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
        required={isRequired}
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

  // Helper to determine if there are any errors in the form
  const hasErrors = Object.keys(errors).length > 0;

  return (
    <View style={styles.container}>
      {/* Display validation errors summary only when save button is pressed */}
      {hasErrors && (
        <View style={styles.errorsContainer}>
          <Text style={styles.errorsSummary}>
            Please fix the highlighted fields to continue
          </Text>
        </View>
      )}

      {/* Basic Information Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Basic Information</Text>
        {BASIC_FIELDS_CONFIG.map(renderBasicField)}
      </View>

      {/* Location & Mobility Section - Includes pickup widget */}
      <LocationMobilitySection />

      {/* Additional Information Section (always visible) */}
      <View style={styles.additionalInfoSection}>
        <Text style={styles.sectionTitle}>Additional Information</Text>
        <View style={styles.checkboxContainer}>
          {ADDITIONAL_INFO_CONFIG.map(renderCheckboxField)}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  errorsContainer: {
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    borderRadius: borderRadius.sm,
    borderLeftWidth: 4,
    borderLeftColor: colors.error || '#FF6B6B',
  },
  errorsSummary: {
    ...typography.bodyMedium,
    color: colors.error || '#FF6B6B',
    fontWeight: '600',
  },
  section: {
    marginBottom: spacing.xl,
  },
  additionalInfoSection: {
    marginTop: spacing.md,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.h3,
    fontSize: 18,
    color: colors.primary,
    marginBottom: spacing.md,
    fontWeight: '600',
    paddingBottom: spacing.xs,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
    alignSelf: 'flex-start',
  },
  checkboxContainer: {
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.md,
  },
});

export default FormFields;
