import { RefObject, useEffect } from 'react';

type Element = HTMLElement | null;

function useClickOutside(ref: RefObject<Element>, handler: () => void): void {
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      // If ref or target is null, or target is inside ref element, do nothing
      if (!ref.current || !event.target || ref.current.contains(event.target as Node)) {
        return;
      }
      handler();
    };

    // Add both mouse and touch listeners for better mobile support
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [ref, handler]);
}

export default useClickOutside;
