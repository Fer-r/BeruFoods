import { useState, useEffect, useCallback } from 'react';

const useMercure = (topic, token) => {
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState(null);

  const addMessage = useCallback((message) => {
    setMessages(prev => [...prev, message]);
  }, []);

  useEffect(() => {
    if (!topic || !token) return;

    const url = new URL('/.well-known/mercure', window.location.origin);
    url.searchParams.append('topic', topic);

    const eventSource = new EventSource(url, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        addMessage(data);
      } catch (err) {
        console.error('Error parsing Mercure message:', err);
      }
    };

    eventSource.onerror = (err) => {
      console.error('Mercure EventSource error:', err);
      setError('Connection to notification service failed');
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [topic, token, addMessage]);

  return { messages, error };
};

export default useMercure;