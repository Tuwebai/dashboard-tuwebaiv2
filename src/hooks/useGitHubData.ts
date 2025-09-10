import { useState, useCallback, useEffect } from 'react';
import { githubService } from '@/services/githubService';
import { tokenStorage } from '@/services/tokenStorage';

interface GitHubUser {
  id: number;
  login: string;
  name: string;
  email: string;
  bio: string;
  avatar_url: string;
  followers: number;
  following: number;
  public_repos: number;
  created_at: string;
  updated_at: string;
}

interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string;
  html_url: string;
  language: string;
  stargazers_count: number;
  forks_count: number;
  updated_at: string;
  created_at: string;
  private: boolean;
  fork: boolean;
}

interface GitHubStats {
  totalCommits: number;
  commitsThisYear: number;
  commitsThisMonth: number;
  commitsThisWeek: number;
  streak: number;
  longestStreak: number;
}

interface GitHubLanguage {
  [key: string]: number;
}

interface UseGitHubDataReturn {
  user: GitHubUser | null;
  repos: GitHubRepo[];
  featuredRepos: GitHubRepo[];
  stats: GitHubStats | null;
  languages: GitHubLanguage;
  contributionGraph: { date: string; count: number }[];
  isLoading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
}

export const useGitHubData = (): UseGitHubDataReturn => {
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [featuredRepos, setFeaturedRepos] = useState<GitHubRepo[]>([]);
  const [stats, setStats] = useState<GitHubStats | null>(null);
  const [languages, setLanguages] = useState<GitHubLanguage>({});
  const [contributionGraph, setContributionGraph] = useState<{ date: string; count: number }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const token = tokenStorage.getToken('github');
      if (!token) {
        throw new Error('No hay token de GitHub disponible');
      }

      setIsLoading(true);
      setError(null);

      // Obtener datos en paralelo
      const [
        userData,
        reposData,
        featuredReposData,
        statsData,
        languagesData,
        contributionData,
      ] = await Promise.all([
        githubService.getUserProfile(token.accessToken),
        githubService.getUserRepos(token.accessToken),
        githubService.getFeaturedRepos(token.accessToken),
        githubService.getContributionStats(token.accessToken, userData?.login || ''),
        githubService.getLanguageStats(token.accessToken),
        githubService.getContributionGraph(token.accessToken, userData?.login || ''),
      ]);

      setUser(userData);
      setRepos(reposData);
      setFeaturedRepos(featuredReposData);
      setStats(statsData);
      setLanguages(languagesData);
      setContributionGraph(contributionData);
    } catch (error: any) {
      console.error('Error fetching GitHub data:', error);
      setError(error.message || 'Error obteniendo datos de GitHub');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshData = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  // Cargar datos al montar el hook
  useEffect(() => {
    const token = tokenStorage.getToken('github');
    if (token) {
      fetchData();
    }
  }, [fetchData]);

  return {
    user,
    repos,
    featuredRepos,
    stats,
    languages,
    contributionGraph,
    isLoading,
    error,
    refreshData,
  };
};
