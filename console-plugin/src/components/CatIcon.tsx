import * as React from 'react';
import Crying from '../images/Crying.svg';
import Evil from '../images/Evil.svg';
import Grinning from '../images/Grinning.svg';
import Hearts from '../images/Hearts.svg';
import Joy from '../images/Joy.svg';
import Kissing from '../images/Kissing.svg';
import Pouting from '../images/Pouting.svg';
import Smiling from '../images/Smiling.svg';
import Weary from '../images/Weary.svg';

const icons: Record<string, string> = {
  Crying,
  Evil,
  Grinning,
  Hearts,
  Joy,
  Kissing,
  Pouting,
  Smiling,
  Weary,
};

const DEFAULT_ICON = Smiling;

type CatIconProps = {
  iconName?: string;
  size?: number;
};

const CatIcon: React.FC<CatIconProps> = ({ iconName, size = 32 }) => (
  <img src={(iconName && icons[iconName]) || DEFAULT_ICON} height={size} width={size} alt={iconName ?? 'cat'} />
);

export default CatIcon;
