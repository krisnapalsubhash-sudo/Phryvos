'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { ProfileView } from '@/components/profile/ProfileView';

export default function UserProfilePage() {
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : (params?.id as string) || 'me';

  return <ProfileView userId={id} />;
}