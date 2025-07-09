import React from 'react';
import {ViewStyle} from 'react-native';
import {colors} from '../utils/theme';

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
import SalahIcon from '../assets/icons/salah.svg';
import UserIcon from '../assets/icons/profile.svg';
import callMoon from '../assets/icons/callMoon.svg';
import CameraIcon from '../assets/icons/camera.svg';
import CalendarIcon from '../assets/icons/calender.svg';
import BackBtnIcon from '../assets/icons/backBtn.svg';
import MosqueIcon from '../assets/icons/mosque.svg';
import QuranIcon from '../assets/icons/quran.svg';
import SearchIcon from '../assets/icons/search.svg';
// Meeting status icons
import AssignedIcon from '../assets/icons/assigned.svg';
import AttendedIcon from '../assets/icons/attended.svg';
import AbsentIcon from '../assets/icons/absent.svg';
// Eye icons (you'll need to add these SVG files to your assets/icons folder)
import EyeIcon from '../assets/icons/eye_open.svg';
import EyeOffIcon from '../assets/icons/eye-off.svg';
// Fire icon for streak counter
import FireIcon from '../assets/icons/fire.svg';

export type IconName =
  | 'fajr'
  | 'dhuhr'
  | 'asr'
  | 'maghrib'
  | 'isha'
  | 'masjid'
  | 'mosque'
  | 'quran'
  | 'map'
  | 'fajrlogo'
  | 'home'
  | 'prayer-beads'
  | 'salah'
  | 'profile'
  | 'callMoon'
  | 'camera'
  | 'calendar'
  | 'backBtn'
  | 'search'
  | 'assigned'
  | 'attended'
  | 'absent'
  | 'eye'
  | 'eye-off'
  | 'fire';

interface SvgIconProps {
  name: IconName;
  size?: number;
  color?: string;
  stroke?: string;
  style?: ViewStyle;
}

const SvgIcon: React.FC<SvgIconProps> = ({
  name,
  size = 24,
  color,
  stroke,
  style,
}) => {
  const IconComponent = getIconComponent(name);

  if (!IconComponent) {
    return null;
  }

  const iconProps: any = {
    width: size,
    height: size,
    style: style,
  };

  // Since SVGs use currentColor, pass color directly
  if (color) {
    iconProps.color = color;
  }

  // Allow explicit stroke override if needed
  if (stroke) {
    iconProps.stroke = stroke;
  }

  return <IconComponent {...iconProps} />;
};

const getIconComponent = (name: IconName) => {
  const icons = {
    fajr: FajrIcon,
    dhuhr: DhuhrIcon,
    asr: AsrIcon,
    maghrib: MaghribIcon,
    isha: IshaIcon,
    masjid: MasjidIcon,
    mosque: MosqueIcon,
    quran: QuranIcon,
    map: MapIcon,
    fajrlogo: FajrLogo,
    home: HomeIcon,
    salah: SalahIcon,
    'prayer-beads': PrayerBeadsIcon,
    profile: UserIcon,
    callMoon: callMoon,
    camera: CameraIcon,
    calendar: CalendarIcon,
    backBtn: BackBtnIcon,
    search: SearchIcon,
    assigned: AssignedIcon,
    attended: AttendedIcon,
    absent: AbsentIcon,
    eye: EyeIcon,
    'eye-off': EyeOffIcon,
    fire: FireIcon,
  };

  return icons[name];
};

export default SvgIcon;
