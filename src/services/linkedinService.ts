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

interface LinkedInConnection {
  id: string;
  firstName: string;
  lastName: string;
  headline: string;
  profilePicture: string;
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

class LinkedInService {
  private readonly API_BASE = 'https://api.linkedin.com/v2';

  /**
   * Obtiene el perfil básico del usuario
   */
  async getBasicProfile(accessToken: string): Promise<LinkedInProfile> {
    const response = await fetch(
      `${this.API_BASE}/people/~:(id,firstName,lastName,profilePicture(displayImage~:playableStreams),headline,summary)`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`LinkedIn API error: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Obtiene la experiencia laboral
   */
  async getWorkExperience(accessToken: string): Promise<LinkedInExperience[]> {
    const response = await fetch(
      `${this.API_BASE}/people/~:(experience)`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`LinkedIn API error: ${response.status}`);
    }

    const data = await response.json();
    return data.experience?.elements || [];
  }

  /**
   * Obtiene las habilidades principales
   */
  async getSkills(accessToken: string): Promise<LinkedInSkill[]> {
    const response = await fetch(
      `${this.API_BASE}/people/~:(skills)`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`LinkedIn API error: ${response.status}`);
    }

    const data = await response.json();
    return data.skills?.elements || [];
  }

  /**
   * Obtiene las conexiones (limitado por permisos de LinkedIn)
   */
  async getConnections(accessToken: string): Promise<LinkedInConnection[]> {
    // Nota: LinkedIn limita el acceso a conexiones
    // Este es un ejemplo de cómo se haría si se tuviera el permiso
    try {
      const response = await fetch(
        `${this.API_BASE}/people/~:(connections)`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json',
          },
        }
      );

      if (!response.ok) {
        // Si no tenemos permisos, devolver array vacío
        return [];
      }

      const data = await response.json();
      return data.connections?.elements || [];
    } catch (error) {
      console.warn('No se pudieron obtener las conexiones de LinkedIn:', error);
      return [];
    }
  }

  /**
   * Obtiene posts recientes (simulado, ya que LinkedIn limita esto)
   */
  async getRecentPosts(accessToken: string): Promise<LinkedInPost[]> {
    // Nota: LinkedIn no permite obtener posts de otros usuarios fácilmente
    // Esto es una simulación de cómo se verían los datos
    return [
      {
        id: '1',
        text: 'Excited to share my latest project! 🚀',
        created: { time: Date.now() - 86400000 }, // 1 día atrás
        author: 'Usuario',
        socialDetail: {
          totalSocialActivityCounts: {
            numLikes: 15,
            numComments: 3,
            numShares: 2,
          },
        },
      },
      {
        id: '2',
        text: 'Great insights from today\'s tech conference! 💡',
        created: { time: Date.now() - 172800000 }, // 2 días atrás
        author: 'Usuario',
        socialDetail: {
          totalSocialActivityCounts: {
            numLikes: 8,
            numComments: 1,
            numShares: 0,
          },
        },
      },
    ];
  }

  /**
   * Obtiene estadísticas del perfil
   */
  async getProfileStats(accessToken: string): Promise<{
    connectionsCount: number;
    skillsCount: number;
    experienceCount: number;
    postsCount: number;
  }> {
    try {
      const [connections, skills, experience, posts] = await Promise.all([
        this.getConnections(accessToken),
        this.getSkills(accessToken),
        this.getWorkExperience(accessToken),
        this.getRecentPosts(accessToken),
      ]);

      return {
        connectionsCount: connections.length,
        skillsCount: skills.length,
        experienceCount: experience.length,
        postsCount: posts.length,
      };
    } catch (error) {
      console.error('Error getting LinkedIn profile stats:', error);
      return {
        connectionsCount: 0,
        skillsCount: 0,
        experienceCount: 0,
        postsCount: 0,
      };
    }
  }

  /**
   * Verifica si el token es válido
   */
  async validateToken(accessToken: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.API_BASE}/people/~`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
        },
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * Obtiene información completa del perfil
   */
  async getFullProfile(accessToken: string): Promise<{
    profile: LinkedInProfile;
    experience: LinkedInExperience[];
    skills: LinkedInSkill[];
    stats: {
      connectionsCount: number;
      skillsCount: number;
      experienceCount: number;
      postsCount: number;
    };
  }> {
    const [profile, experience, skills, stats] = await Promise.all([
      this.getBasicProfile(accessToken),
      this.getWorkExperience(accessToken),
      this.getSkills(accessToken),
      this.getProfileStats(accessToken),
    ]);

    return {
      profile,
      experience,
      skills,
      stats,
    };
  }
}

export const linkedinService = new LinkedInService();
export default linkedinService;
