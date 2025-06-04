import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { IoClose } from 'react-icons/io5';

/**
 * @name useMountTransition
 * @description Custom React hook to manage the transition states for components that animate on mount and unmount.
 * It helps delay the unmounting of a component until its exit animation completes.
 * @param {boolean} isMounted - Whether the component is currently mounted or intended to be mounted.
 * @param {number} unmountDelay - The duration in milliseconds to delay unmounting, allowing for an exit animation.
 * @returns {boolean} isTransitioning - True if the component is currently in a transition phase (either mounting or unmounting animation is active).
 */
const useMountTransition = (isMounted, unmountDelay) => {
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    let timeoutId;

    if (isMounted && !isTransitioning) {
      setIsTransitioning(true);
    } else if (!isMounted && isTransitioning) {
      timeoutId = setTimeout(() => setIsTransitioning(false), unmountDelay);
    }
    return () => {
      clearTimeout(timeoutId);
    };
  }, [unmountDelay, isMounted, isTransitioning]);

  return isTransitioning;
};

/**
 * @name createPortalRoot
 * @description Creates and returns a new DIV element to serve as the root for a React portal.
 * This element is intended to be appended to the document body and used as a target for `createPortal`.
 * It is assigned the ID 'drawer-root'.
 * @returns {HTMLElement} The newly created portal root element.
 */
function createPortalRoot() {
  const drawerRoot = document.createElement('div');
  drawerRoot.setAttribute('id', 'drawer-root');
  return drawerRoot;
}

/**
 * @component Drawer
 * @description A slide-in panel component that can be positioned on any side of the screen.
 * It is rendered using a React portal and includes features like smooth transitions,
 * backdrop, and closing via Escape key or backdrop click.
 *
 * @param {object} props - The component's props.
 * @param {boolean} props.isOpen - Controls the visibility of the drawer. True to show, false to hide.
 * @param {React.ReactNode} props.children - The content to be displayed inside the drawer.
 * @param {function} props.onClose - Callback function invoked when the drawer requests to close (e.g., user clicks close button, backdrop, or presses Escape).
 * @param {string} [props.position='left'] - The position from which the drawer slides in. Valid options are 'left', 'right', 'top', 'bottom'.
 * @param {boolean} [props.removeWhenClosed=true] - If true, the drawer is removed from the DOM when closed and its exit animation completes. If false, it's hidden with CSS.
 */
const Drawer = ({
  isOpen,
  children,
  onClose,
  position = 'left',
  removeWhenClosed = true,
}) => {
  const bodyRef = useRef(document.querySelector('body'));
  const portalRootRef = useRef(
    document.getElementById('drawer-root') || createPortalRoot()
  );
  const isTransitioning = useMountTransition(isOpen, 300);

  // Append portal root on mount
  useEffect(() => {
    bodyRef.current.appendChild(portalRootRef.current);
    const portal = portalRootRef.current;
    const bodyEl = bodyRef.current;

    return () => {
      // Clean up the portal when drawer component unmounts
      if (portal.parentNode) {
        portal.remove();
      }
      // Ensure scroll overflow is removed
      bodyEl.style.overflow = '';
    };
  }, []);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    const updatePageScroll = () => {
      if (isOpen) {
        bodyRef.current.style.overflow = 'hidden';
      } else {
        bodyRef.current.style.overflow = '';
      }
    };

    updatePageScroll();
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const onKeyPress = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keyup', onKeyPress);
    }

    return () => {
      window.removeEventListener('keyup', onKeyPress);
    };
  }, [isOpen, onClose]);

  // Don't render if closed and should be removed
  if (!isTransitioning && removeWhenClosed && !isOpen) {
    return null;
  }

  /**
   * @function getDrawerClasses
   * @description Constructs the CSS class string for the drawer element based on its current state and position.
   * This includes base styling, positional classes, and transform classes for animations.
   * @returns {string} A string of CSS classes to be applied to the drawer's main div.
   */
  const getDrawerClasses = () => {
    const baseClasses = "fixed bg-base-200 shadow-xl transition-transform duration-300 ease-in-out z-50";
    const positionClasses = {
      left: "top-0 left-0 h-full w-80 transform",
      right: "top-0 right-0 h-full w-80 transform", 
      top: "top-0 left-0 right-0 w-full h-2/5 transform",
      bottom: "bottom-0 left-0 right-0 w-full h-2/5 transform"
    };
    
    const transformClasses = {
      left: isOpen ? "translate-x-0" : "-translate-x-full",
      right: isOpen ? "translate-x-0" : "translate-x-full",
      top: isOpen ? "translate-y-0" : "-translate-y-full", 
      bottom: isOpen ? "translate-y-0" : "translate-y-full"
    };

    return `${baseClasses} ${positionClasses[position]} ${transformClasses[position]}`;
  };

  return createPortal(
    <div
      aria-hidden={isOpen ? 'false' : 'true'}
      className={`fixed inset-0 z-40 ${isOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}
    >
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black transition-opacity duration-300 ${
          isOpen ? 'opacity-50' : 'opacity-0'
        }`}
        onClick={onClose} 
      />
      
      {/* Drawer */}
      <div
        className={getDrawerClasses()}
        role="dialog"
        aria-modal="true"
      >
        {/* Header with close button */}
        <div className="flex justify-end p-4 border-b border-base-300">
          <button 
            onClick={onClose}
            className="btn btn-circle btn-ghost btn-sm"
            aria-label="Close drawer"
          >
            <IoClose className="w-5 h-5" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {children}
        </div>
      </div>
    </div>,
    portalRootRef.current
  );
};

export default Drawer;