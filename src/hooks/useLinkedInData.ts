import { useState, useCallback, useEffect } from 'react';
import { linkedinService } from '@/services/linkedinService';
import { tokenStorage } from '@/services/tokenStorage';

interface LinkedInProfile {
  id: string;
  firstName: {
    localized: { [key: string]: string };
    preferredLocale: { country: string; language: string };
  };
  lastName: {
    localized: { [key: string]: string };
    preferredLocale: { country: string; language: string };
  };
  profilePicture: {
    displayImage: string;
  };
  headline: {
    localized: { [key: string]: string };
    preferredLocale: { country: string; language: string };
  };
  summary: {
    localized: { [key: string]: string };
    preferredLocale: { country: string; language: string };
  };
}

interface LinkedInExperience {
  id: string;
  title: string;
  companyName: string;
  location: {
    country: string;
    geographicArea: string;
  };
  timePeriod: {
    startDate: {
      year: number;
      month: number;
    };
    endDate?: {
      year: number;
      month: number;
    };
  };
  description: string;
  company: {
    id: string;
    name: string;
    logo: string;
  };
}

interface LinkedInSkill {
  id: string;
  name: string;
  category: string;
}

interface LinkedInPost {
  id: string;
  text: string;
  created: {
    time: number;
  };
  author: string;
  socialDetail: {
    totalSocialActivityCounts: {
      numLikes: number;
      numComments: number;
      numShares: number;
    };
  };
}

interface LinkedInStats {
  connectionsCount: number;
  skillsCount: number;
  experienceCount: number;
  postsCount: number;
}

interface UseLinkedInDataReturn {
  profile: LinkedInProfile | null;
  experience: LinkedInExperience[];
  skills: LinkedInSkill[];
  posts: LinkedInPost[];
  stats: LinkedInStats | null;
  isLoading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
}

export const useLinkedInData = (): UseLinkedInDataReturn => {
  const [profile, setProfile] = useState<LinkedInProfile | null>(null);
  const [experience, setExperience] = useState<LinkedInExperience[]>([]);
  const [skills, setSkills] = useState<LinkedInSkill[]>([]);
  const [posts, setPosts] = useState<LinkedInPost[]>([]);
  const [stats, setStats] = useState<LinkedInStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const token = tokenStorage.getToken('linkedin');
      if (!token) {
        throw new Error('No hay token de LinkedIn disponible');
      }

      setIsLoading(true);
      setError(null);

      // Obtener datos completos del perfil
      const fullProfile = await linkedinService.getFullProfile(token.accessToken);
      
      setProfile(fullProfile.profile);
      setExperience(fullProfile.experience);
      setSkills(fullProfile.skills);
      setStats(fullProfile.stats);

      // Obtener posts recientes
      const postsData = await linkedinService.getRecentPosts(token.accessToken);
      setPosts(postsData);
    } catch (error: any) {
      console.error('Error fetching LinkedIn data:', error);
      setError(error.message || 'Error obteniendo datos de LinkedIn');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshData = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  // Cargar datos al montar el hook
  useEffect(() => {
    const token = tokenStorage.getToken('linkedin');
    if (token) {
      fetchData();
    }
  }, [fetchData]);

  return {
    profile,
    experience,
    skills,
    posts,
    stats,
    isLoading,
    error,
    refreshData,
  };
};
