import React from 'react';
import {TouchableOpacity, Text, StyleSheet, View} from 'react-native';
import SvgIcon, {IconName} from './SvgIcon';

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
        {icon && <SvgIcon name={icon} size={20} color="#666" style={{ transform: [{ rotateY: '180deg' }] }} />}
        <Text style={styles.title}>{title}</Text>
      </View>

      {showArrow && <SvgIcon name={"backBtn"} size={20} />}
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
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  arrow: {
    fontSize: 18,
    color: '#999',
  },
});

export default MenuButton;
