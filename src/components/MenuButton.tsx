import React from 'react';
import {TouchableOpacity, Text, StyleSheet, View} from 'react-native';
import SvgIcon, {IconName} from './SvgIcon';
import {typography} from '../utils/typography';

interface MenuButtonProps {
  title: string;
  icon?: IconName;
  onPress: () => void;
  showArrow?: boolean;
}

const MenuButton: React.FC<MenuButtonProps> = ({
  title,
  icon,
  onPress,
  showArrow = true,
}) => {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.leftContent}>
        {icon && (
          <SvgIcon
            name={icon}
            size={20}
            color="#666"
            style={{transform: [{rotateY: '180deg'}]}}
          />
        )}
        <Text style={styles.title}>{title}</Text>
      </View>

      {showArrow && (
        <SvgIcon
          name={'backBtn'}
          size={20}
          style={{transform: [{rotateY: '180deg'}]}}
        />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    padding: 16,
    marginVertical: 4,
    borderRadius: 12,
    shadowColor: '#000000',
    shadowOffset: {width: 2, height: 3},
    shadowOpacity: 0.078,
    shadowRadius: 4,
    elevation: 4,
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    ...typography.bodyMedium,
    color: '#333',
    marginLeft: 12,
  },
  arrow: {
    fontSize: 18,
    color: '#999',
  },
});

export default MenuButton;
