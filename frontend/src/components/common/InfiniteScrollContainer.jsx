import { useRef, useEffect, useState } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';

/**
 * InfiniteScrollContainer is a component that provides infinite scrolling capabilities.
 * It wraps the 'react-infinite-scroll-component' to offer a flexible way to load and display data
 * as the user scrolls, with support for list and grid layouts.
 *
 * @param {object} props - The component's props.
 * @param {Array<any>} props.data - The array of items to be rendered.
 * @param {function} props.fetchMoreData - Callback function to fetch more data when the scroll threshold is reached.
 * @param {boolean} props.hasMore - Boolean indicating if there is more data to be fetched.
 * @param {function} props.renderItem - Function that takes an item and its index and returns a React element to render.
 * @param {React.ReactNode} [props.loader=<p className="text-center py-4">Loading...</p>] - The loader component to display while fetching more data.
 * @param {React.ReactNode} [props.endMessage=<p className="text-center py-4"><b>You have seen it all!</b></p>] - Message to display when all data has been loaded.
 * @param {string} [props.layout='list'] - The layout of the items ('list' or 'grid').
 * @param {string} [props.className=''] - Custom CSS classes for the main scrollable div.
 * @param {string} [props.gridItemClassName=''] - CSS classes applied to each item's wrapper when layout is 'grid'.
 * @param {string} [props.scrollableTarget] - Optional: ID of an element to attach the scroll listener to. If not provided, the window is used.
 * @param {number | string} [props.height] - Optional: The height of the scrollable component. Can be a number (pixels) or a string (e.g., '500px', '100vh').
 * @param {number | string} [props.scrollThreshold='0.8'] - Optional: A number between 0 and 1 (e.g., 0.9 meaning 90%) or a pixel value (e.g., "200px") that defines how close the user must be to the bottom of the content for the `fetchMoreData` function to be triggered.
 * @param {boolean} [props.isLoadingMore] - Optional: Boolean indicating if the parent component is currently in the process of loading more data. This helps prevent multiple fetch calls.
 */
const InfiniteScrollContainer = ({
  data,
  fetchMoreData,
  hasMore,
  renderItem,
  loader = <p className="text-center py-4">Loading...</p>,
  endMessage = <p className="text-center py-4"><b>You have seen it all!</b></p>,
  layout = 'list', // 'list' or 'grid'
  className = '',    // Custom classes for the main scrollable div
  gridItemClassName = '', // Applied to each item's wrapper when layout is 'grid'
  scrollableTarget, // Optional: ID of an element to attach the scroll listener to
  height, // Added height prop
  scrollThreshold, // Added scrollThreshold prop
  isLoadingMore, // isLoading state from the parent hook
}) => {
  const scrollableNodeRef = useRef(null);
  const [initialLoadAttempted, setInitialLoadAttempted] = useState(false);

  const containerClasses = [
    layout === 'grid' ? 'flex flex-wrap' : '',
    className,
  ].join(' ').trim();

  useEffect(() => {
    // This effect now primarily tracks if the initial load (driven by the parent hook) has happened.
    if (!isLoadingMore) {
      setInitialLoadAttempted(true);
    }
  }, [isLoadingMore]);

  useEffect(() => {
    // Only attempt to auto-fetch if the initial load has been processed and we are not currently loading.
    if (!initialLoadAttempted || !hasMore || isLoadingMore) {
      return;
    }

    let isContentShort = false;
    if (height) { 
      const scrollComponent = scrollableNodeRef.current;
      const scrollableElement = scrollComponent?.el; 
      if (scrollableElement) {
        isContentShort = scrollableElement.scrollHeight <= scrollableElement.clientHeight;
      }
    } else if (scrollableTarget) { 
        const targetElement = document.getElementById(scrollableTarget);
        if (targetElement) {
            isContentShort = targetElement.scrollHeight <= targetElement.clientHeight;
        }
    } else { 
      if (document.documentElement.scrollHeight <= window.innerHeight && window.scrollY === 0) {
         isContentShort = true;
      }
    }

    if (isContentShort) {
      fetchMoreData();
    }
  }, [data.length, hasMore, fetchMoreData, isLoadingMore, height, scrollableTarget, initialLoadAttempted]);

  return (
    <>
      <InfiniteScroll
        ref={scrollableNodeRef} 
        dataLength={data.length}
        next={fetchMoreData}
        hasMore={hasMore}
        loader={loader}
        endMessage={null} 
        className={containerClasses}
        scrollableTarget={scrollableTarget}
        height={height}
        scrollThreshold={scrollThreshold}
      >
        {data.map((item, index) => {
          const itemContent = renderItem(item, index);
          if (layout === 'grid') {
            return (
              <div key={index} className={gridItemClassName}>
                {itemContent}
              </div>
            );
          }
          return itemContent; 
        })}
      </InfiniteScroll>
      {!hasMore && endMessage}
    </>
  );
};

export default InfiniteScrollContainer; 