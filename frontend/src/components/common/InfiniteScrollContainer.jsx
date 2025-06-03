import { useRef, useEffect, useState } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';

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