import React from 'react';
import {ViewStyle} from 'react-native';

// Import your custom SVG icons
import FajrIcon from '../assets/icons/Fajr.svg';
import DhuhrIcon from '../assets/icons/Dhuhr.svg';
import AsrIcon from '../assets/icons/Asr.svg';
import MaghribIcon from '../assets/icons/Magrib.svg';
import IshaIcon from '../assets/icons/Isha.svg';
import MasjidIcon from '../assets/icons/Masjid.svg';
import MapIcon from '../assets/icons/map.svg';
import FajrLogo from '../assets/icons/fajr-logo.svg';
import HomeIcon from '../assets/icons/home.svg';
import PrayerBeadsIcon from '../assets/icons/prayer-beads.svg';
import UserIcon from '../assets/icons/user.svg';

export type IconName =
  | 'fajr'
  | 'dhuhr'
  | 'asr'
  | 'maghrib'
  | 'isha'
  | 'masjid'
  | 'map'
  | 'fajrlogo'
  | 'home'
  | 'prayer-beads'
  | 'user';

interface SvgIconProps {
  name: IconName;
  size?: number;
  color?: string;
  style?: ViewStyle;
}

const SvgIcon: React.FC<SvgIconProps> = ({name, size = 24, color, style}) => {
  const IconComponent = getIconComponent(name);

  if (!IconComponent) {
    return null;
  }

  return (
    <IconComponent width={size} height={size} fill={color} style={style} />
  );
};

const getIconComponent = (name: IconName) => {
  const icons = {
    fajr: FajrIcon,
    dhuhr: DhuhrIcon,
    asr: AsrIcon,
    maghrib: MaghribIcon,
    isha: IshaIcon,
    masjid: MasjidIcon,
    map: MapIcon,
    fajrlogo: FajrLogo,
    home: HomeIcon,
    'prayer-beads': PrayerBeadsIcon,
    user: UserIcon,
  };

  return icons[name];
};

export default SvgIcon;
