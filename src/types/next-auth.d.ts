import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface User {
    id?: string;
    username?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    demoMode?: boolean;
  }

  interface Session {
    user: {
      id: string;
      username: string;
      email: string;
      name: string;
      image: string;
      demoMode?: boolean;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    username?: string;
    demoMode?: boolean;
  }
}

declare module '@auth/core/types' {
  interface User {
    id?: string;
    username?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    demoMode?: boolean;
  }

  interface Session {
    user: {
      id: string;
      username: string;
      email: string;
      name: string;
      image: string;
      demoMode?: boolean;
    };
  }
}

declare module '@auth/core/jwt' {
  interface JWT {
    id?: string;
    username?: string;
    demoMode?: boolean;
  }
}
