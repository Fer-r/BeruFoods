import { Outlet } from 'react-router';

/**
 * @component MinimalLayout
 * Provides a minimal layout structure with no header, footer, or navigation elements.
 * This layout is useful for pages that need a clean, distraction-free interface or
 * for special pages that have their own unique layout requirements.
 * 
 * The content for pages using this layout is rendered via the `<Outlet />` component
 * from react-router-dom.
 * 
 * This component does not accept any props.
 * 
 * @returns {JSX.Element} The rendered minimal layout with an Outlet for page content.
 */
const MinimalLayout = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Outlet />
    </div>
  );
};

export default MinimalLayout;