import { useState } from 'react';

export function useDropdown() {
  const [menuVisible, setMenuVisible] = useState(false);

  const toggleMenu = () => {
    setMenuVisible(!menuVisible);
  };

  const closeMenu = () => {
    setMenuVisible(false);
  };

  return { menuVisible, toggleMenu, closeMenu };
}
