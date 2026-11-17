// Web Worker for Purrfocus Pomodoro timer.
// Holds NO timer state; simply emits a 'tick' message every ~250ms when active.

let intervalId: ReturnType<typeof setInterval> | null = null;

self.onmessage = (event: MessageEvent<{ type: 'start' | 'stop' }>) => {
  const { type } = event.data;

  if (type === 'start') {
    if (intervalId !== null) {
      clearInterval(intervalId);
    }
    intervalId = setInterval(() => {
      self.postMessage({ type: 'tick' });
    }, 250);
  } else if (type === 'stop') {
    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }
};

export {};
