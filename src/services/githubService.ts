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
  owner: {
    login: string;
  };
}

interface GitHubCommit {
  sha: string;
  commit: {
    message: string;
    author: {
      name: string;
      email: string;
      date: string;
    };
  };
  html_url: string;
}

interface GitHubLanguage {
  [key: string]: number;
}

interface GitHubStats {
  totalCommits: number;
  commitsThisYear: number;
  commitsThisMonth: number;
  commitsThisWeek: number;
  streak: number;
  longestStreak: number;
}

class GitHubService {
  private readonly API_BASE = 'https://api.github.com';
  private readonly GITHUB_TOKEN = import.meta.env.VITE_GITHUB_TOKEN;
  private readonly RATE_LIMIT_RETRY_DELAY = 60000; // 1 minuto
  private readonly MAX_RETRIES = 3;

  /**
   * Realiza una petición a la API de GitHub con manejo de rate limiting
   */
  private async makeGitHubRequest(url: string, accessToken: string, retryCount = 0): Promise<Response> {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'TuWebAI-Dashboard/1.0',
      },
    });

    // Manejar rate limiting
    if (response.status === 403) {
      const rateLimitRemaining = response.headers.get('X-RateLimit-Remaining');
      const rateLimitReset = response.headers.get('X-RateLimit-Reset');
      
      if (rateLimitRemaining === '0' && retryCount < this.MAX_RETRIES) {
        const resetTime = rateLimitReset ? parseInt(rateLimitReset) * 1000 : Date.now() + this.RATE_LIMIT_RETRY_DELAY;
        const waitTime = Math.max(resetTime - Date.now(), this.RATE_LIMIT_RETRY_DELAY);
        
        console.warn(`GitHub API rate limit exceeded. Waiting ${Math.ceil(waitTime / 1000)} seconds before retry ${retryCount + 1}/${this.MAX_RETRIES}`);
        
        await new Promise(resolve => setTimeout(resolve, waitTime));
        return this.makeGitHubRequest(url, accessToken, retryCount + 1);
      }
    }

    return response;
  }

  /**
   * Obtiene información del usuario autenticado
   */
  async getUserProfile(accessToken: string): Promise<GitHubUser> {
    const response = await this.makeGitHubRequest(`${this.API_BASE}/user`, accessToken);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`GitHub API error: ${response.status} - ${errorData.message || response.statusText}`);
    }

    return response.json();
  }

  /**
   * Obtiene repositorios del usuario
   */
  async getUserRepos(accessToken: string, page = 1, perPage = 30): Promise<GitHubRepo[]> {
    const response = await this.makeGitHubRequest(
      `${this.API_BASE}/user/repos?sort=updated&page=${page}&per_page=${perPage}`,
      accessToken
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`GitHub API error: ${response.status} - ${errorData.message || response.statusText}`);
    }

    return response.json();
  }

  /**
   * Obtiene repositorios destacados (con más estrellas)
   */
  async getFeaturedRepos(accessToken: string, limit = 6): Promise<GitHubRepo[]> {
    const repos = await this.getUserRepos(accessToken, 1, 100);
    return repos
      .filter(repo => !repo.fork && !repo.private)
      .sort((a, b) => b.stargazers_count - a.stargazers_count)
      .slice(0, limit);
  }

  /**
   * Obtiene commits recientes de un repositorio
   */
  async getRecentCommits(accessToken: string, owner: string, repo: string, limit = 10): Promise<GitHubCommit[]> {
    const response = await this.makeGitHubRequest(
      `${this.API_BASE}/repos/${owner}/${repo}/commits?per_page=${limit}`,
      accessToken
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`GitHub API error: ${response.status} - ${errorData.message || response.statusText}`);
    }

    return response.json();
  }

  /**
   * Obtiene estadísticas de lenguajes de programación
   */
  async getLanguageStats(accessToken: string): Promise<GitHubLanguage> {
    const repos = await this.getUserRepos(accessToken, 1, 100);
    const languageStats: GitHubLanguage = {};

    // Obtener estadísticas de cada repositorio
    const repoStatsPromises = repos
      .filter(repo => !repo.fork && !repo.private)
      .map(async (repo) => {
        try {
          const response = await this.makeGitHubRequest(
            `${this.API_BASE}/repos/${repo.full_name}/languages`,
            accessToken
          );

          if (response.ok) {
            return response.json();
          }
          return {};
        } catch (error) {
          console.warn(`Error getting language stats for ${repo.name}:`, error);
          return {};
        }
      });

    const repoStats = await Promise.all(repoStatsPromises);

    // Consolidar estadísticas
    repoStats.forEach(stats => {
      Object.entries(stats).forEach(([language, bytes]) => {
        languageStats[language] = (languageStats[language] || 0) + (bytes as number);
      });
    });

    return languageStats;
  }

  /**
   * Obtiene estadísticas de contribuciones reales
   */
  async getContributionStats(accessToken: string, username: string): Promise<GitHubStats> {
    try {
      // Obtener commits reales de los repositorios del usuario
      const repos = await this.getUserRepos(accessToken, 1, 100);
      const now = new Date();
      const thisYear = new Date(now.getFullYear(), 0, 1);
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      let totalCommits = 0;
      let commitsThisYear = 0;
      let commitsThisMonth = 0;
      let commitsThisWeek = 0;
      let commitDates: Date[] = [];

      // Obtener commits de cada repositorio
      for (const repo of repos.filter(r => !r.fork && !r.private)) {
        try {
          const commits = await this.getRecentCommits(accessToken, repo.owner?.login || username, repo.name, 100);
          
          commits.forEach(commit => {
            const commitDate = new Date(commit.commit.author.date);
            commitDates.push(commitDate);
            totalCommits++;

            if (commitDate >= thisYear) commitsThisYear++;
            if (commitDate >= thisMonth) commitsThisMonth++;
            if (commitDate >= thisWeek) commitsThisWeek++;
          });
        } catch (error) {
          console.warn(`Error getting commits for ${repo.name}:`, error);
        }
      }

      // Calcular racha actual
      const streak = this.calculateStreak(commitDates);
      const longestStreak = this.calculateLongestStreak(commitDates);

      return {
        totalCommits,
        commitsThisYear,
        commitsThisMonth,
        commitsThisWeek,
        streak,
        longestStreak,
      };
    } catch (error) {
      console.error('Error getting contribution stats:', error);
      // Fallback a datos básicos si hay error
      return {
        totalCommits: 0,
        commitsThisYear: 0,
        commitsThisMonth: 0,
        commitsThisWeek: 0,
        streak: 0,
        longestStreak: 0,
      };
    }
  }

  /**
   * Calcula la racha actual de commits
   */
  private calculateStreak(commitDates: Date[]): number {
    if (commitDates.length === 0) return 0;

    const sortedDates = commitDates
      .map(date => new Date(date.getFullYear(), date.getMonth(), date.getDate()))
      .sort((a, b) => b.getTime() - a.getTime());

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let streak = 0;
    let currentDate = new Date(today);

    for (const commitDate of sortedDates) {
      const diffTime = currentDate.getTime() - commitDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0 || diffDays === 1) {
        streak++;
        currentDate = new Date(commitDate);
      } else if (diffDays > 1) {
        break;
      }
    }

    return streak;
  }

  /**
   * Calcula la racha más larga de commits
   */
  private calculateLongestStreak(commitDates: Date[]): number {
    if (commitDates.length === 0) return 0;

    const sortedDates = commitDates
      .map(date => new Date(date.getFullYear(), date.getMonth(), date.getDate()))
      .sort((a, b) => a.getTime() - b.getTime());

    let longestStreak = 0;
    let currentStreak = 1;

    for (let i = 1; i < sortedDates.length; i++) {
      const prevDate = sortedDates[i - 1];
      const currentDate = sortedDates[i];
      const diffTime = currentDate.getTime() - prevDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        currentStreak++;
      } else {
        longestStreak = Math.max(longestStreak, currentStreak);
        currentStreak = 1;
      }
    }

    return Math.max(longestStreak, currentStreak);
  }

  /**
   * Obtiene el gráfico de contribuciones real
   */
  async getContributionGraph(accessToken: string, username: string): Promise<{ date: string; count: number }[]> {
    try {
      // Obtener commits reales de los repositorios del usuario
      const repos = await this.getUserRepos(accessToken, 1, 100);
      const commitDates: Date[] = [];

      // Obtener commits de cada repositorio
      for (const repo of repos.filter(r => !r.fork && !r.private)) {
        try {
          const commits = await this.getRecentCommits(accessToken, repo.owner?.login || username, repo.name, 100);
          
          commits.forEach(commit => {
            const commitDate = new Date(commit.commit.author.date);
            commitDates.push(commitDate);
          });
        } catch (error) {
          console.warn(`Error getting commits for ${repo.name}:`, error);
        }
      }

      // Crear mapa de contribuciones por fecha
      const contributionsMap = new Map<string, number>();
      
      commitDates.forEach(date => {
        const dateStr = date.toISOString().split('T')[0];
        contributionsMap.set(dateStr, (contributionsMap.get(dateStr) || 0) + 1);
      });

      // Generar datos para los últimos 365 días
      const contributions = [];
      const today = new Date();
      
      for (let i = 364; i >= 0; i--) {
        const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
        const dateStr = date.toISOString().split('T')[0];
        contributions.push({
          date: dateStr,
          count: contributionsMap.get(dateStr) || 0,
        });
      }

      return contributions;
    } catch (error) {
      console.error('Error getting contribution graph:', error);
      // Fallback a datos vacíos si hay error
      const contributions = [];
      const today = new Date();
      
      for (let i = 364; i >= 0; i--) {
        const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
        contributions.push({
          date: date.toISOString().split('T')[0],
          count: 0,
        });
      }

      return contributions;
    }
  }

  /**
   * Verifica si el token es válido
   */
  async validateToken(accessToken: string): Promise<boolean> {
    try {
      const response = await this.makeGitHubRequest(`${this.API_BASE}/user`, accessToken);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.warn('GitHub token validation failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData.message || 'Unknown error',
          rateLimitRemaining: response.headers.get('X-RateLimit-Remaining'),
          rateLimitReset: response.headers.get('X-RateLimit-Reset')
        });
        return false;
      }
      
      // Verificar que la respuesta contiene datos válidos de usuario
      const userData = await response.json();
      if (!userData.login || !userData.id) {
        console.warn('GitHub token validation: Invalid user data received');
        return false;
      }
      
      console.log('GitHub token validation successful for user:', userData.login);
      return true;
    } catch (error) {
      console.warn('GitHub token validation error:', error);
      return false;
    }
  }
}

export const githubService = new GitHubService();
export default githubService;
