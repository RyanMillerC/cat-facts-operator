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

const icons = {
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

export function getCatIconSVG(iconName) {
  return icons[iconName];
}

interface CatIconProps {
  iconName: string;
}

export const CatIcon: React.FC<CatIconProps> = (props) => {
  return (
    <>
      <img src={getCatIconSVG(props.iconName)} height={80} width={80} />
    </>
  );
};
