import type { Post, Story } from '@/types';
import { MOCK_USERS } from './users';

export const MOCK_STORIES: Story[] = [
  {
    id: 's1',
    author: MOCK_USERS[1], // Sarah
    images: ['https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=1080&q=80'],
    views: 842,
    hasSeen: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 23).toISOString(),
    slides: [
      {
        id: 's1-1',
        type: 'image',
        mediaUrl: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=1080&q=80',
        caption: 'Santorini caldera at 6:45 PM. The Aegean wind smells like salt and wild thyme 🌅',
        tag: '🇬🇷 Oia, Greece',
      },
      {
        id: 's1-2',
        type: 'image',
        mediaUrl: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?w=1080&q=80',
        caption: 'Found this hidden alleyway bookshop where the owner makes Turkish coffee for anyone who sits down ☕',
        tag: '📚 Lost in Thira',
      },
    ],
  },
  {
    id: 's2',
    author: MOCK_USERS[2], // Kenji
    images: [],
    views: 619,
    hasSeen: false,
    isVoiceStory: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 22).toISOString(),
    slides: [
      {
        id: 's2-1',
        type: 'voice',
        audioDuration: 22,
        caption: 'Late night 3 AM keyboard clicks + lo-fi jazz from Shimokitazawa. Listen with earphones 🎧',
        content: '"Sometimes the cleanest code is the one you delete after staring at it for four hours."',
        tag: '🎙️ 3 AM Tokyo Voice Drop',
        gradient: 'from-cyan-950 via-slate-900 to-black',
      },
    ],
  },
  {
    id: 's3',
    author: MOCK_USERS[3], // Maya
    images: ['https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=1080&q=80'],
    views: 1204,
    hasSeen: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 21).toISOString(),
    slides: [
      {
        id: 's3-1',
        type: 'image',
        mediaUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=1080&q=80',
        caption: 'Character development process: 14 rough sketches before the silhouette finally breathed ✨',
        tag: '🎨 Studio Berlin',
      },
    ],
  },
  {
    id: 's4',
    author: MOCK_USERS[4], // Marcus
    images: [],
    views: 450,
    hasSeen: true,
    isMidnightDrop: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 20).toISOString(),
    slides: [
      {
        id: 's4-1',
        type: 'midnight',
        content: 'The loneliest thing about adulthood isn’t being alone. It’s realizing everyone around you is just improvising and hoping nobody notices.',
        tag: '🌙 Midnight Confession #419',
        gradient: 'from-purple-950 via-indigo-950 to-black',
      },
    ],
  },
  {
    id: 's5',
    author: MOCK_USERS[5], // Elena
    images: ['https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1080&q=80'],
    views: 890,
    hasSeen: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 19).toISOString(),
    slides: [
      {
        id: 's5-1',
        type: 'image',
        mediaUrl: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1080&q=80',
        caption: 'Zurich tech summit stage lights. Speaking on humane algorithms tomorrow morning 🧠',
        tag: '🇨🇭 Zurich, Switzerland',
      },
    ],
  },
  {
    id: 's6',
    author: MOCK_USERS[6], // Alex
    images: [],
    views: 320,
    hasSeen: true,
    isVoiceStory: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 18).toISOString(),
    slides: [
      {
        id: 's6-1',
        type: 'voice',
        audioDuration: 16,
        caption: 'Guitar riffs recorded on an acoustic in my dorm stairwell with natural reverb 🎸',
        content: '"Music sounds different when the rest of the building is asleep."',
        tag: '🎙️ Stairwell Acoustics',
        gradient: 'from-amber-950 via-slate-900 to-black',
      },
    ],
  },
];

export const MOCK_POSTS: Post[] = [
  {
    id: 'p-raw-1',
    author: MOCK_USERS[1], // Sarah
    format: 'raw',
    vibe: '🚅 Stranger Encounter',
    readingTime: '2 min read',
    tags: ['#RawStory', '#Japan', '#Mindfulness'],
    content: `I sat next to an 82-year-old retired watchmaker on the train from Kyoto to Kanazawa. He noticed me staring at my phone screen with anxious furrowed brows. Without asking a word, he reached into his tweed coat and laid a tiny brass balance spring on the wooden armrest.

"Look closely," he whispered in gentle, raspy Japanese. "If this spring carries even 0.01mm of tension off-center, the entire 200-piece clockwork freezes. Humans are identical. You are carrying tension today from things that have not even arrived yet."

We spent the next three hours talking about second chances, lost love in Osaka during the summer of 1968, and why modern people are terrified of sitting in silence with their own thoughts. 

When the train pulled into Kanazawa, he tipped his cap and blended into the snow. I never asked for his name. If you are anywhere in Ishikawa prefecture, old stranger — thank you. You saved my heart today.`,
    likes: 642,
    comments: 89,
    shares: 114,
    isLiked: true,
    isSaved: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
  },
  {
    id: 'p-voice-1',
    author: MOCK_USERS[2], // Kenji
    format: 'voice',
    vibe: '🌧️ Rooftop Rain & Distant Jazz',
    audioDuration: 28,
    voiceWaveform: [25, 45, 80, 60, 95, 40, 70, 85, 50, 90, 65, 40, 75, 100, 80, 55, 30, 65, 85, 40, 70, 90, 60, 45, 25, 50, 70, 40],
    tags: ['#VoiceDrop', '#RainyNight', '#AudioMemoir'],
    content: 'Recorded this on my rooftop balcony in Shibuya right as the midnight summer thunderstorm rolled in. You can hear the heavy drops hitting the tin awning and the faint saxophone leaking from the basement bar downstairs. Put on headphones and just close your eyes for 28 seconds.',
    likes: 384,
    comments: 52,
    shares: 41,
    isLiked: false,
    isSaved: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
  },
  {
    id: 'p-midnight-1',
    author: {
      id: 'ghost-midnight-9',
      username: 'stranger_3am',
      displayName: 'Anonymous Stranger',
      bio: 'Just passing through your timeline',
      avatar: '🎭',
      interests: ['Philosophy', 'Midnight'],
      location: 'Somewhere in the dark',
      followers: 0,
      following: 0,
      postsCount: 1,
      isConnected: false,
      isOnline: true,
      createdAt: '2025-01-01T00:00:00Z',
    },
    format: 'midnight',
    vibe: '🌙 3:42 AM Epiphany',
    isAnonymous: true,
    midnightGradient: 'from-purple-950 via-slate-900 to-indigo-950',
    tags: ['#MidnightDrop', '#Unfiltered', '#SoulTalk'],
    content: 'We are all just strangers carrying entire undiscovered universes inside our chests, secretly hoping someone looks closely enough to notice the constellations.',
    likes: 1209,
    comments: 174,
    shares: 280,
    isLiked: true,
    isSaved: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
  },
  {
    id: 'p-standard-1',
    author: MOCK_USERS[3], // Maya
    format: 'standard',
    vibe: '🎨 Creative Journal',
    tags: ['#Illustration', '#DigitalArt'],
    content: 'After 3 weeks of sleepless iterations, the spirit fox character design is finally alive. The golden hues were inspired by Japanese autumn maples in Nikko. Would love feedback from fellow artists!',
    image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=1080&q=80',
    likes: 418,
    comments: 63,
    shares: 29,
    isLiked: false,
    isSaved: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 210).toISOString(),
  },
  {
    id: 'p-voice-2',
    author: MOCK_USERS[4], // Marcus
    format: 'voice',
    vibe: '🎹 Piano Chord Improv',
    audioDuration: 19,
    voiceWaveform: [30, 60, 40, 75, 90, 85, 60, 40, 70, 95, 100, 80, 50, 35, 65, 90, 85, 45, 30],
    tags: ['#VoiceDrop', '#LoFi', '#Beats'],
    content: 'Woke up at 2 AM with this chord progression stuck in my skull. Hummed the melody directly into the mic before I could forget it. Should I build a full track around this?',
    likes: 192,
    comments: 38,
    shares: 14,
    isLiked: false,
    isSaved: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 320).toISOString(),
  },
  {
    id: 'p-raw-2',
    author: MOCK_USERS[5], // Elena
    format: 'raw',
    vibe: '☕ Cafe Notes',
    readingTime: '1 min read',
    tags: ['#RawStory', '#Reflections', '#Zurich'],
    content: `I ordered a double espresso at a small table by the window. An older woman with silver rings sat opposite me without a word. For 40 minutes, neither of us looked at a screen. We just watched raindrops trace paths down the glass.

When she stood up to leave, she pushed a fresh paper napkin across to me. In fountain pen blue ink, she wrote:

"Don't rush to figure it all out. The parts of your life that hurt the most right now will turn into your greatest compassion later."

She walked out into the rain with her red umbrella. I keep that napkin folded in my passport sleeve now.`,
    likes: 915,
    comments: 112,
    shares: 167,
    isLiked: true,
    isSaved: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 450).toISOString(),
  },
];

export function getPosts(): Post[] {
  return MOCK_POSTS;
}

export function getStories(): Story[] {
  return MOCK_STORIES;
}

export function getPostsByUserId(userId: string): Post[] {
  return MOCK_POSTS.filter((p) => p.author.id === userId);
}

