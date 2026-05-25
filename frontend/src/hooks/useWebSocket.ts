import { useEffect, useRef } from 'react';
import { useAssessmentStore } from '@/store/assessmentStore';
import toast from 'react-hot-toast';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:5000/ws';
const MAX_RETRIES = 10000; // Practically infinite retries

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const retriesRef = useRef(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);
  
  // Keep track of intervals to prevent memory leaks on Fast Refresh
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);
  const pongTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { setJobStatus, setGeneratedPaper } = useAssessmentStore();

  const connect = () => {
    // Don't connect if component unmounted
    if (!mountedRef.current) return;

    // Don't connect if already open or connecting
    if (wsRef.current?.readyState === WebSocket.OPEN || wsRef.current?.readyState === WebSocket.CONNECTING) return;

    console.log('[WebSocket] Connecting...');
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    const handleDisconnect = () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      if (pongTimeoutRef.current) clearTimeout(pongTimeoutRef.current);
      
      console.log('[WebSocket] 🔌 Disconnected');
      wsRef.current = null;

      if (!mountedRef.current) return;

      if (retriesRef.current < MAX_RETRIES) {
        const delay = Math.min(1000 * 2 ** retriesRef.current, 10000);
        console.log(`[WebSocket] 🔄 Reconnecting in ${delay}ms... (attempt ${retriesRef.current + 1})`);

        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
          retriesRef.current++;
          connect();
        }, delay);
      } else {
        console.log('[WebSocket] ❌ Max retries reached');
      }
    };

    // If it gets stuck in CONNECTING state (e.g. server is down and OS is retrying SYN), force timeout
    const connectionTimeout = setTimeout(() => {
      if (ws.readyState === WebSocket.CONNECTING) {
        console.warn('[WebSocket] ⏱️ Connection attempt timed out');
        ws.onclose = null;
        ws.onerror = null;
        ws.close();
        handleDisconnect();
      }
    }, 5000);

    ws.onopen = () => {
      clearTimeout(connectionTimeout);
      console.log('[WebSocket] ✅ Connected');
      retriesRef.current = 0;

      // Send a ping every 5 seconds to detect dead connections fast
      heartbeatRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'ping' }));

          // If no pong received within 3 seconds, assume connection is dead
          pongTimeoutRef.current = setTimeout(() => {
            console.warn('[WebSocket] 💀 Connection dead (no pong received)');
            ws.onclose = null; // Prevent double trigger
            ws.onerror = null;
            ws.close();
            handleDisconnect();
          }, 3000);
        }
      }, 5000);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'pong') {
          if (pongTimeoutRef.current) clearTimeout(pongTimeoutRef.current);
          return;
        }

        console.log('[WebSocket] Message:', data.type);

        if (data.type === 'job:started') {
          const currentStatus = useAssessmentStore.getState().jobStatus;
          if (currentStatus === 'pending' || currentStatus === 'idle') {
            setJobStatus('processing');
            toast.loading('AI is generating your paper...', { id: 'job-toast' });
          }
        }

        if (data.type === 'job:completed') {
          const currentStatus = useAssessmentStore.getState().jobStatus;
          if (currentStatus === 'processing' || currentStatus === 'pending') {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
            fetch(`${apiUrl}/api/papers/${data.assignmentId}`)
              .then(r => r.json())
              .then(paper => {
                setGeneratedPaper(paper);
                setJobStatus('completed', { assignmentId: data.assignmentId });
                toast.success('Paper generated successfully!', { id: 'job-toast' });
              })
              .catch(e => console.error('[WebSocket] Failed to fetch paper:', e));
          }
        }

        if (data.type === 'job:failed') {
          setJobStatus('failed', { assignmentId: data.assignmentId });
          toast.error(data.error || 'Failed to generate paper', { id: 'job-toast' });
        }
      } catch (e) {
        console.error('[WebSocket] Parse error:', e);
      }
    };

    ws.onclose = () => {
      clearTimeout(connectionTimeout);
      handleDisconnect();
    };

    ws.onerror = () => {
      // browser will fire onclose right after this, so no need to call handleDisconnect here
      ws.close();
    };
  };

  useEffect(() => {
    mountedRef.current = true;
    connect();

    return () => {
      mountedRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      if (pongTimeoutRef.current) clearTimeout(pongTimeoutRef.current);
      
      if (wsRef.current) {
        wsRef.current.onclose = null; // prevent reconnect on intentional unmount
        wsRef.current.close();
      }
    };
  }, []);

  return { wsRef };
}
