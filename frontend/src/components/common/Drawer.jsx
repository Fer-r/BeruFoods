import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { IoClose } from 'react-icons/io5';

// Hook to handle mount transitions for smooth animations
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

// Portal root creation function
function createPortalRoot() {
  const drawerRoot = document.createElement('div');
  drawerRoot.setAttribute('id', 'drawer-root');
  return drawerRoot;
}

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