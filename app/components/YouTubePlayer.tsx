import React, { useState, useRef } from 'react';

export function YouTubePlayer() {
  const [isOpen, setIsOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [videoId, setVideoId] = useState('');
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; startPosX: number; startPosY: number } | null>(null);

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startPosX: position.x,
      startPosY: position.y
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setPosition({
      x: Math.max(0, dragRef.current.startPosX + dx),
      y: Math.max(0, dragRef.current.startPosY + dy)
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const extractVideoId = (input: string) => {
    try {
      if (!input) return '';
      const match = input.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/);
      return match ? match[1] : input;
    } catch (e) {
      return '';
    }
  };

  const handlePlay = () => {
    setVideoId(extractVideoId(url));
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-6 z-[9999] bg-red-600 text-white p-3 rounded-full shadow-[0_0_15px_rgba(220,38,38,0.5)] hover:bg-red-700 hover:scale-110 transition-all duration-300"
        title="Mở YouTube Player"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
        </svg>
      </button>
    );
  }

  return (
    <div
      style={{
        left: position.x,
        top: position.y,
        minWidth: '300px',
        minHeight: '200px',
        width: '400px',
        height: '300px',
        resize: 'both'
      }}
      className="fixed z-[9999] bg-slate-900 border border-slate-700 rounded-lg shadow-2xl flex flex-col overflow-hidden"
    >
      {/* Header / Drag Handle */}
      <div
        className="bg-slate-800 p-2 flex justify-between items-center cursor-move select-none border-b border-slate-700"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div className="flex items-center gap-2 text-slate-300 font-semibold text-sm">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-red-500">
            <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
          </svg>
          Mini YouTube
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-700 transition"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>

      {/* Input area */}
      <div className="p-2 bg-slate-900 flex gap-2 border-b border-slate-800">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Dán link YouTube..."
          className="flex-1 bg-slate-800 text-white text-sm px-2 py-1.5 rounded border border-slate-700 focus:outline-none focus:border-red-500"
          onKeyDown={(e) => e.key === 'Enter' && handlePlay()}
        />
        <button
          onClick={handlePlay}
          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded text-sm font-semibold transition"
        >
          Play
        </button>
      </div>

      {/* Video area */}
      <div className="flex-1 bg-black relative pointer-events-auto group">
        {videoId ? (
          <iframe
            className="absolute inset-0 w-full h-full"
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-slate-500 text-sm">
            Chưa có video
          </div>
        )}
      </div>
      
      {/* Resize handle icon indicator */}
      <div className="absolute bottom-0 right-0 w-4 h-4 pointer-events-none opacity-50 flex items-end justify-end p-0.5">
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M9 1L1 9M9 5L5 9M9 9L9 9" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </div>
    </div>
  );
}
