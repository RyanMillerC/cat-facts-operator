import Crying from '../images/Crying.svg';
import Evil from '../images/Evil.svg';
import Grinning from '../images/Grinning.svg';
import Hearts from '../images/Hearts.svg';
import Joy from '../images/Joy.svg';
import Kissing from '../images/Kissing.svg';
import Pouting from '../images/Pouting.svg';
import Smiling from '../images/Smiling.svg';
import Weary from '../images/Weary.svg';

export default function getCatIcon(iconName) {
  if (iconName === 'Crying') {
    return Crying;
  }
  if (iconName === 'Evil') {
    return Evil;
  }
  if (iconName === 'Grinning') {
    return Grinning;
  }
  if (iconName === 'Hearts') {
    return Hearts;
  }
  if (iconName === 'Joy') {
    return Joy;
  }
  if (iconName === 'Kissing') {
    return Kissing;
  }
  if (iconName === 'Pouting') {
    return Pouting;
  }
  if (iconName === 'Smiling') {
    return Smiling;
  }
  if (iconName === 'Weary') {
    return Weary;
  }
}
