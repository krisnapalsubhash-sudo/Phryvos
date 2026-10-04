'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Mic, Moon, Sparkles } from 'lucide-react';
import { useStoriesStore } from '@/store/stories';
import { useAuthStore } from '@/store/auth';
import { CURRENT_USER } from '@/lib/mock';
import type { Story } from '@/types';
import { Avatar } from '@/components/ui/avatar';
import { sound } from '@/lib/sound';
import { CreateStoryModal } from './CreateStoryModal';

export function StoriesBar() {
  const { stories, openStory } = useStoriesStore();
  const { user } = useAuthStore();
  const currentUser = user || CURRENT_USER;

  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const handleOpenStory = (storyId: string) => {
    sound.playPop(480);
    openStory(storyId);
  };

  const handleOpenCreate = () => {
    sound.playPop(560);
    setIsCreateOpen(true);
  };

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Stories & Voice Drops</h2>
        </div>
        <span className="text-[11px] text-muted-foreground/80">24h Fleeting</span>
      </div>

      <div className="flex items-center gap-3.5 overflow-x-auto pb-2 scrollbar-hide px-1">
        {/* Your Story Ring / Add Story Trigger */}
        <button
          onClick={handleOpenCreate}
          className="flex flex-col items-center gap-1.5 w-15 shrink-0 group focus:outline-none"
          aria-label="Add to your story"
        >
          <div className="relative w-15 h-15 rounded-full p-0.5 border-2 border-dashed border-primary/50 group-hover:border-primary transition-colors flex items-center justify-center bg-card">
            <Avatar size="lg" fallback={currentUser.avatar} />
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center shadow-md ring-2 ring-background group-hover:scale-110 transition-transform">
              <Plus className="w-3.5 h-3.5" />
            </div>
          </div>
          <span className="text-[10px] font-medium text-foreground truncate w-16 text-center">
            Your Story
          </span>
        </button>

        {/* Other Users' Stories */}
        {stories.map((story) => {
          const isUnseen = !story.hasSeen;
          return (
            <button
              key={story.id}
              onClick={() => handleOpenStory(story.id)}
              className="flex flex-col items-center gap-1.5 w-15 shrink-0 group focus:outline-none"
              aria-label={`${story.author.displayName}'s story`}
            >
              <div className="relative w-15 h-15">
                {isUnseen ? (
                  <>
                    {/* Animated glowing gradient ring */}
                    <motion.div
                      className="absolute inset-0 rounded-full"
                      style={{
                        background: story.isVoiceStory
                          ? 'linear-gradient(135deg, #06B6D4 0%, #3B82F6 50%, #8B5CF6 100%)'
                          : story.isMidnightDrop
                          ? 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 50%, #6366F1 100%)'
                          : 'linear-gradient(135deg, #F43F5E 0%, #FB923C 50%, #8B5CF6 100%)',
                        padding: '2.5px',
                      }}
                      animate={{ rotate: 360 }}
                      transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
                    >
                      <div className="w-full h-full rounded-full bg-background" />
                    </motion.div>

                    {/* Avatar inside */}
                    <div className="absolute inset-0.5 rounded-full bg-background flex items-center justify-center overflow-hidden group-hover:scale-95 transition-transform">
                      <Avatar size="lg" fallback={story.author.avatar} />
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full rounded-full p-0.5 border border-border/80 flex items-center justify-center overflow-hidden opacity-75 group-hover:opacity-100 group-hover:border-foreground/40 transition-all">
                    <Avatar size="lg" fallback={story.author.avatar} />
                  </div>
                )}

                {/* Badge Indicator: Voice Drop 🎙️ or Midnight Drop 🌙 */}
                {story.isVoiceStory && (
                  <div
                    className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-cyan-600 text-white flex items-center justify-center ring-2 ring-background shadow-xs text-[10px]"
                    title="Voice Drop Story"
                  >
                    <Mic className="w-3 h-3 animate-pulse" />
                  </div>
                )}
                {story.isMidnightDrop && (
                  <div
                    className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center ring-2 ring-background shadow-xs text-[10px]"
                    title="Midnight Drop"
                  >
                    <Moon className="w-3 h-3" />
                  </div>
                )}
              </div>

              <span className="text-[10px] text-muted-foreground truncate w-16 text-center group-hover:text-foreground transition-colors font-medium">
                {story.author.displayName.split(' ')[0]}
              </span>
            </button>
          );
        })}
      </div>

      <CreateStoryModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
    </div>
  );
}
