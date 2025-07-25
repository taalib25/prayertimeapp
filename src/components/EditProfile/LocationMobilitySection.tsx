import React from 'react';
import {View, StyleSheet, Text} from 'react-native';
import FormField from './FormField';
import DropdownField from './DropdownField';
import {useEditProfile} from '../../contexts/EditProfileContext';
import {spacing, colors} from '../../utils/theme';
import {typography} from '../../utils/typography';

// Import MOBILITY_OPTIONS from FormFields (make sure it uses the correct format)
import { MOBILITY_OPTIONS } from './FormFields';

const LocationMobilitySection: React.FC = () => {
  const {formData, errors, updateField} = useEditProfile();

  const handleMobilityChange = (value: string) => {
    updateField('mobility', value);
  };

  return (
    <View style={styles.container}>
      {/* Location & Mobility Section (always visible) */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Location & Mobility</Text>

        <View style={styles.sectionContent}>
          {/* Location/Address Field */}
          <FormField
            label="Location/Address"
            value={formData.address}
            onChangeText={value => updateField('address', value)}
            placeholder="Enter your location/address"
            multiline={true}
            numberOfLines={3}
            error={errors.address}
          />

          {/* Mobility Dropdown - FIXED: now uses handleMobilityChange */}
          <DropdownField
            label="How do you travel to mosque?"
            value={formData.mobility}
            onValueChange={handleMobilityChange}  // FIXED: was handleMosqueChange
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
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {},
  sectionContainer: {
    marginTop: spacing.sm,
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
    paddingBottom: spacing.xs,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
    alignSelf: 'flex-start',
  },
  sectionContent: {
    paddingTop: spacing.md,
  },
});

export default LocationMobilitySection;
