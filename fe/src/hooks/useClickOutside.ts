import { RefObject, useEffect } from 'react';

/**
 * Type representing an HTML element or null
 */
type Element = HTMLElement | null;

/**
 * Hook that handles clicks outside of a specified element
 * 
 * @param ref - React ref object pointing to the element to monitor
 * @param handler - Callback function to execute when a click outside occurs
 */
function useClickOutside(ref: RefObject<Element>, handler: () => void): void {
  useEffect(() => {
    /**
     * Event handler for detecting clicks outside the referenced element
     * 
     * @param event - Mouse or touch event that triggered the handler
     */
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
