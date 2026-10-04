'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Sparkles, MapPin } from 'lucide-react';
import { sound } from '@/lib/sound';

export interface HighlightItem {
  id: string;
  title: string;
  emoji: string;
  coverImage: string;
  slides: {
    id: string;
    image: string;
    caption: string;
    tag?: string;
  }[];
}

interface HighlightsViewerModalProps {
  highlight: HighlightItem | null;
  onClose: () => void;
}

export function HighlightsViewerModal({ highlight, onClose }: HighlightsViewerModalProps) {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  useEffect(() => {
    setCurrentSlideIndex(0);
  }, [highlight?.id]);

  if (!highlight) return null;

  const slides = highlight.slides;
  const currentSlide = slides[currentSlideIndex] || slides[0];

  const handleNext = () => {
    if (currentSlideIndex < slides.length - 1) {
      setCurrentSlideIndex((s) => s + 1);
      sound.playPop(520);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex((s) => s - 1);
      sound.playPop(380);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl p-4">
        <div className="relative w-full max-w-sm h-[85vh] bg-zinc-950 rounded-3xl overflow-hidden border border-white/10 shadow-2xl flex flex-col justify-between select-none">
          {/* Top Progress Bars */}
          <div className="absolute top-0 inset-x-0 p-3 pt-4 z-30 bg-gradient-to-b from-black/80 to-transparent">
            <div className="flex gap-1.5 mb-2.5">
              {slides.map((_, idx) => (
                <div key={idx} className="h-1 flex-1 bg-white/25 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white rounded-full transition-all duration-150"
                    style={{
                      width: idx < currentSlideIndex ? '100%' : idx === currentSlideIndex ? '100%' : '0%',
                    }}
                  />
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <span className="text-xl">{highlight.emoji}</span>
                <span className="text-xs font-bold">{highlight.title}</span>
              </div>
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Touch Area for Left / Right Navigation */}
          <div className="absolute inset-0 z-20 flex">
            <div className="w-1/3 h-full cursor-pointer" onClick={handlePrev} />
            <div className="w-2/3 h-full cursor-pointer" onClick={handleNext} />
          </div>

          {/* Slide Media */}
          <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
            <img
              src={currentSlide.image}
              alt={currentSlide.caption}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

            {/* Caption */}
            <div className="absolute bottom-6 inset-x-0 p-4 text-center z-25 pointer-events-none">
              {currentSlide.tag && (
                <div className="inline-flex items-center gap-1 text-[11px] text-cyan-300 font-semibold mb-1.5 bg-black/50 px-2.5 py-0.5 rounded-full backdrop-blur-md">
                  <MapPin className="w-3 h-3" />
                  <span>{currentSlide.tag}</span>
                </div>
              )}
              <p className="text-white text-xs md:text-sm font-medium drop-shadow-md">
                {currentSlide.caption}
              </p>
            </div>
          </div>
        </div>
      </div>
    </AnimatePresence>
  );
}
