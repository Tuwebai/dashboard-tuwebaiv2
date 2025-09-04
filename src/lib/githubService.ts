// =====================================================
// INTERFACES Y TIPOS AVANZADOS
// =====================================================

interface GitHubFile {
  name: string;
  path: string;
  type: 'file' | 'dir';
  content?: string;
  encoding?: string;
  size?: number;
  sha: string;
  url: string;
  git_url: string;
  html_url: string;
  download_url?: string;
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
  author?: {
    login: string;
    avatar_url: string;
  };
}

interface GitHubBranch {
  name: string;
  commit: {
    sha: string;
    url: string;
  };
  protected?: boolean;
}

interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  private: boolean;
  fork: boolean;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  language: string | null;
  default_branch: string;
  stargazers_count: number;
  watchers_count: number;
  forks_count: number;
  open_issues_count: number;
  topics: string[];
  homepage: string | null;
  has_issues: boolean;
  has_projects: boolean;
  has_wiki: boolean;
  has_downloads: boolean;
  archived: boolean;
  disabled: boolean;
  license: {
    key: string;
    name: string;
    spdx_id: string;
    url: string;
  } | null;
}

interface GitHubLanguage {
  [key: string]: number;
}

interface GitHubRelease {
  id: number;
  tag_name: string;
  name: string;
  body: string;
  draft: boolean;
  prerelease: boolean;
  created_at: string;
  published_at: string;
}

interface GitHubWorkflow {
  id: number;
  name: string;
  path: string;
  state: string;
  created_at: string;
  updated_at: string;
}

interface PackageJson {
  name?: string;
  displayName?: string;
  description?: string;
  version?: string;
  private?: boolean;
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  engines?: Record<string, string>;
  type?: 'module' | 'commonjs';
  workspaces?: string[] | { packages: string[] };
}

interface RequirementsTxt {
  packages: string[];
}

interface DockerCompose {
  services: Record<string, any>;
  version?: string;
}

interface EnvironmentFile {
  variables: Record<string, string>;
  confidence: number;
}

// Interfaz para la información detectada desde GitHub
export interface DetectedInfo {
  name: string;
  description: string;
  technologies: string[];
  github_repository_url: string;
  status: 'development' | 'production' | 'maintenance';
  is_active: boolean;
  environment_variables: Record<string, string>;
  confidence: number;
  analysis: {
    hasReadme: boolean;
    hasPackageJson: boolean;
    hasDocker: boolean;
    hasCI: boolean;
    lastCommitDate: string;
    hasReleases: boolean;
    isMonorepo: boolean;
    detectedFrameworks: string[];
    detectedDatabases: string[];
    detectedCloudServices: string[];
    detectedCITools: string[];
  };
}

// =====================================================
// CONSTANTES Y CONFIGURACIÓN
// =====================================================

const GITHUB_API_BASE = 'https://api.github.com';
const GITHUB_RAW_BASE = 'https://raw.githubusercontent.com';

// Tecnologías conocidas para detección inteligente
const KNOWN_FRAMEWORKS = {
  // Frontend
  'react': ['React', 'react', 'react-dom', '@types/react'],
  'vue': ['Vue', 'vue', 'vue-router', 'vuex'],
  'angular': ['Angular', '@angular/core', '@angular/common'],
  'svelte': ['Svelte', 'svelte'],
  'next': ['Next.js', 'next', 'next-auth'],
  'nuxt': ['Nuxt', 'nuxt'],
  'gatsby': ['Gatsby', 'gatsby'],
  
  // Backend
  'express': ['Express', 'express'],
  'fastify': ['Fastify', 'fastify'],
  'koa': ['Koa', 'koa'],
  'nest': ['NestJS', '@nestjs/core', '@nestjs/common'],
  'django': ['Django', 'django'],
  'flask': ['Flask', 'flask'],
  'spring': ['Spring Boot', 'spring-boot-starter'],
  'laravel': ['Laravel', 'laravel/framework'],
  
  // Mobile
  'react-native': ['React Native', 'react-native'],
  'flutter': ['Flutter', 'flutter'],
  'ionic': ['Ionic', '@ionic/core'],
  
  // Full-stack
  't3': ['T3 Stack', '@trpc/server', '@trpc/client'],
  'remix': ['Remix', '@remix-run/react'],
  'sveltekit': ['SvelteKit', '@sveltejs/kit'],
};

const KNOWN_DATABASES = {
  'postgresql': ['postgres', 'pg', 'postgresql', 'postgresql-client'],
  'mysql': ['mysql', 'mysql2', 'mariadb'],
  'mongodb': ['mongodb', 'mongoose', 'mongo'],
  'redis': ['redis', 'ioredis', 'node-redis'],
  'sqlite': ['sqlite3', 'better-sqlite3'],
  'supabase': ['@supabase/supabase-js', 'supabase'],
  'firebase': ['firebase', '@firebase/app'],
};

const KNOWN_CLOUD_SERVICES = {
  'vercel': ['vercel.json', 'vercel'],
  'netlify': ['netlify.toml', 'netlify'],
  'aws': ['aws-sdk', 'serverless', 'aws'],
  'azure': ['azure', '@azure/identity'],
  'gcp': ['google-cloud', '@google-cloud'],
  'heroku': ['heroku', 'procfile'],
  'railway': ['railway'],
  'render': ['render'],
};

const KNOWN_CI_TOOLS = {
  'github-actions': ['.github/workflows'],
  'gitlab-ci': ['.gitlab-ci.yml'],
  'jenkins': ['Jenkinsfile', 'jenkins'],
  'circleci': ['.circleci'],
  'travis': ['.travis.yml'],
  'azure-devops': ['azure-pipelines.yml'],
};

// Patrones para detección de variables de entorno
const ENV_PATTERNS = [
  /^([A-Z_][A-Z0-9_]*)\s*=\s*(.+)$/gm, // .env
  /^([A-Z_][A-Z0-9_]*):\s*(.+)$/gm,    // docker-compose
  /process\.env\.([A-Z_][A-Z0-9_]*)/g,  // JavaScript
  /\$([A-Z_][A-Z0-9_]*)/g,              // Shell
];

class GitHubService {
  private baseUrl = GITHUB_API_BASE;
  private token: string | null = null;
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutos

  constructor() {
    // Obtener token desde variables de entorno
    this.token = import.meta.env.VITE_GITHUB_TOKEN || null;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    
    const headers: HeadersInit = {
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `token ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `GitHub API error: ${response.status}`);
    }

    return response.json();
  }

  // Extraer información del repositorio desde la URL
  parseRepositoryUrl(repoUrl: string): { owner: string; repo: string } | null {
    try {
      const url = new URL(repoUrl);
      const pathParts = url.pathname.split('/').filter(Boolean);
      
      if (pathParts.length >= 2) {
      return {
        owner: pathParts[0],
          repo: pathParts[1].replace('.git', ''),
      };
      }
    } catch (error) {
      console.error('Error parsing repository URL:', error);
    }
    
      return null;
    }

  // =====================================================
  // MÉTODOS DE OBTENCIÓN DE DATOS
  // =====================================================

  /**
   * Obtener información completa del repositorio
   */
  async getRepositoryInfo(repoUrl: string): Promise<GitHubRepository> {
    const repoInfo = this.parseRepositoryUrl(repoUrl);
    if (!repoInfo) {
      throw new Error('URL de repositorio inválida');
    }

    return this.request(`/repos/${repoInfo.owner}/${repoInfo.repo}`);
  }

  /**
   * Obtener lenguajes del repositorio
   */
  async getRepositoryLanguages(repoUrl: string): Promise<GitHubLanguage> {
    const repoInfo = this.parseRepositoryUrl(repoUrl);
    if (!repoInfo) {
      throw new Error('URL de repositorio inválida');
    }

    return this.request(`/repos/${repoInfo.owner}/${repoInfo.repo}/languages`);
  }

  /**
   * Obtener contenido del README
   */
  async getReadmeContent(repoUrl: string): Promise<any> {
    const repoInfo = this.parseRepositoryUrl(repoUrl);
    if (!repoInfo) {
      throw new Error('URL de repositorio inválida');
    }

    return this.request(`/repos/${repoInfo.owner}/${repoInfo.repo}/readme`);
  }

  /**
   * Obtener releases del repositorio
   */
  async getReleases(repoUrl: string): Promise<GitHubRelease[]> {
    const repoInfo = this.parseRepositoryUrl(repoUrl);
    if (!repoInfo) {
      throw new Error('URL de repositorio inválida');
    }

    return this.request(`/repos/${repoInfo.owner}/${repoInfo.repo}/releases`);
  }

  /**
   * Obtener workflows de GitHub Actions
   */
  async getWorkflows(repoUrl: string): Promise<GitHubWorkflow[]> {
    const repoInfo = this.parseRepositoryUrl(repoUrl);
    if (!repoInfo) {
      throw new Error('URL de repositorio inválida');
    }

    try {
      const workflows = await this.request(`/repos/${repoInfo.owner}/${repoInfo.repo}/actions/workflows`);
      return workflows.workflows || [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Obtener package.json del repositorio
   */
  async getPackageJson(repoUrl: string): Promise<PackageJson | null> {
    try {
      const content = await this.getFileContent(repoUrl, 'package.json');
      if (content && content.content) {
        return JSON.parse(content.content);
      }
    } catch (error) {
      // package.json no encontrado o error de parsing
    }
    return null;
  }

  /**
   * Obtener docker-compose.yml del repositorio
   */
  async getDockerCompose(repoUrl: string): Promise<DockerCompose | null> {
    try {
      const content = await this.getFileContent(repoUrl, 'docker-compose.yml');
      if (content && content.content) {
        return JSON.parse(content.content);
      }
    } catch (error) {
      // docker-compose.yml no encontrado o error de parsing
    }
    return null;
  }

  /**
   * Obtener archivos de variables de entorno
   */
  async getEnvironmentFiles(repoUrl: string): Promise<EnvironmentFile[]> {
    const envFiles: EnvironmentFile[] = [];
    const envFileNames = ['.env.example', '.env.sample', '.env.template', '.env.local'];
    
    for (const fileName of envFileNames) {
      try {
        const content = await this.getFileContent(repoUrl, fileName);
        if (content && content.content) {
          const variables = this.parseEnvironmentFile(content.content);
          envFiles.push({
            variables,
            confidence: 0.9
          });
        }
      } catch (error) {
        // Archivo no encontrado
      }
    }

    return envFiles;
  }

  // =====================================================
  // MÉTODOS DE ANÁLISIS INTELIGENTE
  // =====================================================

  /**
   * Determinar el estado del proyecto basado en actividad y configuración
   */
  private determineProjectStatus(
    repository: GitHubRepository,
    commits: GitHubCommit[],
    releases: GitHubRelease[],
    workflows: GitHubWorkflow[]
  ): 'development' | 'production' | 'maintenance' {
    const now = new Date();
    const lastCommitDate = commits.length > 0 ? new Date(commits[0].commit.author.date) : new Date(repository.pushed_at);
    const daysSinceLastCommit = (now.getTime() - lastCommitDate.getTime()) / (1000 * 60 * 60 * 24);
    
    // Factores para determinar el estado
    const hasRecentCommits = daysSinceLastCommit < 7;
    const hasOpenIssues = repository.open_issues_count > 0;
    const hasReleases = releases.length > 0;
    const hasCI = workflows.length > 0;
    const hasDocumentation = repository.has_wiki || repository.description;
    const isStable = repository.stargazers_count > 10 && repository.forks_count > 5;
    
    // Lógica de decisión
    if (hasRecentCommits && hasOpenIssues && !hasReleases) {
      return 'development';
    } else if (hasReleases && hasCI && hasDocumentation && isStable) {
      return 'production';
    } else if (daysSinceLastCommit > 180 && !hasOpenIssues && hasReleases) {
      return 'maintenance';
    } else if (hasRecentCommits && hasCI) {
      return 'development';
    } else {
      return 'development'; // Por defecto
    }
  }

  /**
   * Extraer tecnologías de forma inteligente
   */
  private extractTechnologies(
    languages: GitHubLanguage,
    packageJson: PackageJson | null,
    workflows: GitHubWorkflow[],
    dockerCompose: DockerCompose | null,
    topics: string[]
  ): string[] {
    const technologies = new Set<string>();
    
    // Agregar lenguajes principales
    Object.keys(languages).forEach(lang => {
      technologies.add(this.normalizeTechnologyName(lang));
    });
    
    // Agregar frameworks del package.json
    if (packageJson) {
      const allDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies
      };
      
      Object.keys(allDeps).forEach(dep => {
        const framework = this.detectFramework(dep);
        if (framework) {
          technologies.add(framework);
        }
      });
    }
    
    // Agregar tecnologías de CI/CD
    if (workflows.length > 0) {
      technologies.add('GitHub Actions');
    }
    
    // Agregar tecnologías de Docker
    if (dockerCompose) {
      technologies.add('Docker');
      technologies.add('Docker Compose');
    }
    
    // Agregar topics del repositorio
    topics.forEach(topic => {
      if (topic.length > 2) {
        technologies.add(this.normalizeTechnologyName(topic));
      }
    });
    
    return Array.from(technologies).slice(0, 15); // Máximo 15 tecnologías
  }

  /**
   * Generar descripción inteligente del proyecto
   */
  private generateSmartDescription(
    repository: GitHubRepository,
    readme: any,
    packageJson: PackageJson | null,
    technologies: string[]
  ): string {
    let description = '';
    
    // Prioridad 1: Primera línea del README
    if (readme && readme.content) {
      try {
        const readmeContent = this.decodeBase64Content(readme.content);
        const lines = readmeContent.split('\n')
          .filter(line => line.trim())
          .filter(line => !line.startsWith('#'))
          .filter(line => !line.startsWith('!'))
          .filter(line => !line.startsWith('['));
        
        if (lines.length > 0) {
          description = lines[0].trim();
        }
      } catch (error) {
        console.warn('Error parsing README content:', error);
      }
    }
    
    // Prioridad 2: Descripción del repositorio
    if (!description && repository.description) {
      description = this.fixTextEncoding(repository.description);
    }
    
    // Prioridad 3: Descripción del package.json
    if (!description && packageJson?.description) {
      description = this.fixTextEncoding(packageJson.description);
    }
    
    // Generar descripción contextual si no hay ninguna
    if (!description) {
      const mainTech = technologies[0] || 'aplicación';
      description = `${mainTech} project`;
    }
    
    // Limitar a 200 caracteres y agregar contexto
    if (description.length > 200) {
      description = description.substring(0, 197) + '...';
    }
    
    // Agregar contexto del tipo de proyecto
    if (technologies.length > 0) {
      const techContext = technologies.slice(0, 3).join(', ');
      if (!description.toLowerCase().includes(techContext.toLowerCase())) {
        description += ` - Built with ${techContext}`;
      }
    }
    
    return description;
  }

  /**
   * Extraer variables de entorno de archivos
   */
  private extractEnvironmentVariables(envFiles: EnvironmentFile[]): Record<string, string> {
    const variables: Record<string, string> = {};
    
    envFiles.forEach(file => {
      Object.entries(file.variables).forEach(([key, value]) => {
        if (!variables[key]) {
          variables[key] = value;
        }
      });
    });
    
    return variables;
  }

  /**
   * Calcular nivel de confianza del análisis
   */
  private calculateConfidence(
    readme: any,
    packageJson: PackageJson | null,
    dockerCompose: DockerCompose | null,
    workflows: GitHubWorkflow[],
    envFiles: EnvironmentFile[]
  ): number {
    let confidence = 0;
    
    if (readme) confidence += 20;
    if (packageJson) confidence += 25;
    if (dockerCompose) confidence += 15;
    if (workflows.length > 0) confidence += 20;
    if (envFiles.length > 0) confidence += 20;
    
    return Math.min(confidence, 100);
  }

  /**
   * Generar análisis detallado del repositorio
   */
  private generateRepositoryAnalysis(
    repository: GitHubRepository,
    readme: any,
    packageJson: PackageJson | null,
    dockerCompose: DockerCompose | null,
    workflows: GitHubWorkflow[],
    commits: GitHubCommit[],
    releases: GitHubRelease[]
  ) {
    return {
      hasReadme: !!readme,
      hasPackageJson: !!packageJson,
      hasDocker: !!dockerCompose,
      hasCI: workflows.length > 0,
      lastCommitDate: commits.length > 0 ? commits[0].commit.author.date : repository.pushed_at,
      hasReleases: releases.length > 0,
      isMonorepo: this.detectMonorepo(repository, packageJson),
      detectedFrameworks: this.extractFrameworks(packageJson),
      detectedDatabases: this.extractDatabases(dockerCompose, packageJson),
      detectedCloudServices: this.extractCloudServices(repository, workflows),
      detectedCITools: this.extractCITools(workflows)
    };
  }

  // =====================================================
  // MÉTODOS DE UTILIDAD
  // =====================================================

  private formatProjectName(name: string, packageJson: PackageJson | null): string {
    if (packageJson?.displayName) {
      return packageJson.displayName;
    }
    
    // Convertir kebab-case a Title Case
    return name
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  private normalizeTechnologyName(name: string): string {
    const techMap: Record<string, string> = {
      'javascript': 'JavaScript',
      'typescript': 'TypeScript',
      'python': 'Python',
      'java': 'Java',
      'c++': 'C++',
      'c#': 'C#',
      'php': 'PHP',
      'ruby': 'Ruby',
      'go': 'Go',
      'rust': 'Rust',
      'swift': 'Swift',
      'kotlin': 'Kotlin',
      'scala': 'Scala',
      'elixir': 'Elixir',
      'clojure': 'Clojure'
    };
    
    return techMap[name.toLowerCase()] || name;
  }

  private detectFramework(dependency: string): string | null {
    for (const [framework, patterns] of Object.entries(KNOWN_FRAMEWORKS)) {
      if (patterns.some(pattern => dependency.includes(pattern.toLowerCase()))) {
        return framework.charAt(0).toUpperCase() + framework.slice(1);
      }
    }
    return null;
  }

  private parseEnvironmentFile(content: string): Record<string, string> {
    const variables: Record<string, string> = {};
    
    // Corregir codificación del contenido antes de procesarlo
    const correctedContent = this.fixTextEncoding(content);
    
    ENV_PATTERNS.forEach(pattern => {
      const matches = correctedContent.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const [_, key, value] = match.match(/^([A-Z_][A-Z0-9_]*)\s*[=:]\s*(.+)$/) || [];
          if (key && value) {
            variables[key.trim()] = this.fixTextEncoding(value.trim());
          }
        });
      }
    });
    
    return variables;
  }

  private detectMonorepo(repository: GitHubRepository, packageJson: PackageJson | null): boolean {
    if (packageJson?.workspaces) return true;
    if (repository.topics.includes('monorepo')) return true;
    return false;
  }

  private extractFrameworks(packageJson: PackageJson | null): string[] {
    if (!packageJson) return [];
    const frameworks: string[] = [];
    
    Object.keys(packageJson.dependencies || {}).forEach(dep => {
      const framework = this.detectFramework(dep);
      if (framework) frameworks.push(framework);
    });
    
    return frameworks;
  }

  private extractDatabases(dockerCompose: DockerCompose | null, packageJson: PackageJson | null): string[] {
    const databases: string[] = [];
    
    if (dockerCompose?.services) {
      Object.values(dockerCompose.services).forEach(service => {
        if (service.image) {
          Object.entries(KNOWN_DATABASES).forEach(([db, patterns]) => {
            if (patterns.some(pattern => service.image.includes(pattern))) {
              databases.push(db.charAt(0).toUpperCase() + db.slice(1));
            }
          });
        }
      });
    }
    
    if (packageJson?.dependencies) {
      Object.keys(packageJson.dependencies).forEach(dep => {
        Object.entries(KNOWN_DATABASES).forEach(([db, patterns]) => {
          if (patterns.some(pattern => dep.includes(pattern))) {
            databases.push(db.charAt(0).toUpperCase() + db.slice(1));
          }
        });
      });
    }
    
    return [...new Set(databases)];
  }

  private extractCloudServices(repository: GitHubRepository, workflows: GitHubWorkflow[]): string[] {
    const services: string[] = [];
    
    // Detectar por archivos de configuración
    Object.entries(KNOWN_CLOUD_SERVICES).forEach(([service, patterns]) => {
      if (patterns.some(pattern => repository.topics.includes(pattern))) {
        services.push(service.charAt(0).toUpperCase() + service.slice(1));
      }
    });
    
    return services;
  }

  private extractCITools(workflows: GitHubWorkflow[]): string[] {
    const tools: string[] = [];
    
    if (workflows.length > 0) {
      tools.push('GitHub Actions');
    }
    
    return tools;
  }

  // =====================================================
  // MÉTODOS DE MANEJO DE CODIFICACIÓN DE TEXTO
  // =====================================================

  /**
   * Decodifica contenido base64 con manejo correcto de UTF-8
   */
  private decodeBase64Content(base64Content: string): string {
    try {
      // Decodificar base64
      const binaryString = atob(base64Content);
      
      // Convertir a Uint8Array para manejar UTF-8 correctamente
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      // Decodificar como UTF-8
      const decoder = new TextDecoder('utf-8');
      return decoder.decode(bytes);
    } catch (error) {
      console.warn('Error decoding base64 content, falling back to atob:', error);
      // Fallback al método anterior
      return atob(base64Content);
    }
  }

  /**
   * Corrige problemas de codificación de caracteres especiales
   */
  private fixTextEncoding(text: string): string {
    if (!text) return text;
    
    try {
      // Mapa de caracteres mal codificados comunes
      const encodingMap: Record<string, string> = {
        'Ã¡': 'á', 'Ã©': 'é', 'Ã­': 'í', 'Ã³': 'ó', 'Ãº': 'ú',
        'Ã±': 'ñ', 'Ã¼': 'ü', 'Ã§': 'ç', 'Ã€': 'À',
        'ÃŒ': 'Ì', 'Ã™': 'Ù', 'Ãœ': 'Ü',
        'Ã¢': 'â', 'Ãª': 'ê', 'Ã®': 'î', 'Ã´': 'ô',
        'Ã»': 'û', 'Ã‚': 'Â', 'ÃŠ': 'Ê', 'ÃŽ': 'Î',
        'Ã›': 'Û', 'Ãƒ': 'Ã', 'Ã‡': 'Ç',
        'Ã': 'É', // Clave consolidada
        'Ã"': 'Ó', 'Ãš': 'Ú'
      };
      
      let correctedText = text;
      
      // Aplicar correcciones de codificación
      Object.entries(encodingMap).forEach(([incorrect, correct]) => {
        correctedText = correctedText.replace(new RegExp(incorrect, 'g'), correct);
      });
      
      // Intentar decodificar como URI si hay caracteres codificados
      try {
        if (correctedText.includes('%')) {
          correctedText = decodeURIComponent(correctedText);
        }
      } catch (error) {
        // Si falla decodeURIComponent, mantener el texto corregido
      }
      
      return correctedText;
    } catch (error) {
      console.warn('Error fixing text encoding:', error);
      return text;
    }
  }

  /**
   * Normaliza y limpia texto para mejor legibilidad
   */
  private normalizeText(text: string): string {
    if (!text) return text;
    
    return text
      .replace(/\s+/g, ' ')           // Múltiples espacios a uno solo
      .replace(/\n\s*\n/g, '\n')      // Múltiples saltos de línea a uno solo
      .replace(/^\s+|\s+$/g, '')      // Eliminar espacios al inicio y final
      .replace(/[^\w\s\u00C0-\u017F\-.,!?()]/g, '') // Solo caracteres válidos + acentos
      .trim();
  }

  // Obtener contenido de un archivo
  async getFileContent(repoUrl: string, path: string, branch: string = 'main') {
    const repoInfo = this.parseRepositoryUrl(repoUrl);
    if (!repoInfo) {
      throw new Error('URL de repositorio inválida');
    }

    const response = await this.request(
      `/repos/${repoInfo.owner}/${repoInfo.repo}/contents/${encodeURIComponent(path)}?ref=${branch}`
    );

    if (response.type === 'file' && response.content) {
      // Decodificar contenido base64 con manejo correcto de UTF-8
      const content = this.decodeBase64Content(response.content);
      return {
        ...response,
        content,
        decoded: true,
      };
    }

    return response;
  }

  // Obtener estructura de directorios
  async getDirectoryStructure(repoUrl: string, path: string = '', branch: string = 'main') {
    const repoInfo = this.parseRepositoryUrl(repoUrl);
    if (!repoInfo) {
      throw new Error('URL de repositorio inválida');
    }

    const endpoint = path 
      ? `/repos/${repoInfo.owner}/${repoInfo.repo}/contents/${encodeURIComponent(path)}?ref=${branch}`
      : `/repos/${repoInfo.owner}/${repoInfo.repo}/contents?ref=${branch}`;

    const files = await this.request(endpoint);
    
    return files.map((file: GitHubFile) => ({
      name: file.name,
      path: file.path,
      type: file.type,
      size: file.size,
      url: file.html_url,
      download_url: file.download_url,
    }));
  }

  // Obtener branches del repositorio
  async getBranches(repoUrl: string): Promise<GitHubBranch[]> {
    const repoInfo = this.parseRepositoryUrl(repoUrl);
    if (!repoInfo) {
      throw new Error('URL de repositorio inválida');
    }

    return this.request(`/repos/${repoInfo.owner}/${repoInfo.repo}/branches`);
  }

  // Obtener commits recientes
  async getRecentCommits(repoUrl: string, branch: string = 'main', limit: number = 10): Promise<GitHubCommit[]> {
    const repoInfo = this.parseRepositoryUrl(repoUrl);
    if (!repoInfo) {
      throw new Error('URL de repositorio inválida');
    }

    return this.request(
      `/repos/${repoInfo.owner}/${repoInfo.repo}/commits?sha=${branch}&per_page=${limit}`
    );
  }

  // Crear o actualizar un archivo
  async updateFile(
    repoUrl: string, 
    path: string, 
    content: string, 
    message: string, 
    branch: string = 'main',
    sha?: string
  ) {
    const repoInfo = this.parseRepositoryUrl(repoUrl);
    if (!repoInfo) {
      throw new Error('URL de repositorio inválida');
    }

    if (!this.token) {
      throw new Error('Se requiere token de GitHub para realizar cambios');
    }

    const body: any = {
      message,
      content: btoa(content), // Codificar en base64
      branch,
    };

    if (sha) {
      body.sha = sha;
    }

    return this.request(
      `/repos/${repoInfo.owner}/${repoInfo.repo}/contents/${encodeURIComponent(path)}`,
      {
        method: 'PUT',
        body: JSON.stringify(body),
      }
    );
  }

  // Crear un nuevo archivo
  async createFile(
    repoUrl: string, 
    path: string, 
    content: string, 
    message: string, 
    branch: string = 'main'
  ) {
    return this.updateFile(repoUrl, path, content, message, branch);
  }

  // Eliminar un archivo
  async deleteFile(
    repoUrl: string, 
    path: string, 
    message: string, 
    sha: string, 
    branch: string = 'main'
  ) {
    const repoInfo = this.parseRepositoryUrl(repoUrl);
    if (!repoInfo) {
      throw new Error('URL de repositorio inválida');
    }

    if (!this.token) {
      throw new Error('Se requiere token de GitHub para realizar cambios');
    }

    return this.request(
      `/repos/${repoInfo.owner}/${repoInfo.repo}/contents/${encodeURIComponent(path)}`,
      {
        method: 'DELETE',
        body: JSON.stringify({
          message,
          sha,
          branch,
        }),
      }
    );
  }

  // Crear un nuevo branch
  async createBranch(repoUrl: string, newBranch: string, baseBranch: string = 'main') {
    const repoInfo = this.parseRepositoryUrl(repoUrl);
    if (!repoInfo) {
      throw new Error('URL de repositorio inválida');
    }

    if (!this.token) {
      throw new Error('Se requiere token de GitHub para crear branches');
    }

    // Primero obtener el SHA del branch base
    const baseBranchInfo = await this.request(
      `/repos/${repoInfo.owner}/${repoInfo.repo}/branches/${baseBranch}`
    );

    return this.request(
      `/repos/${repoInfo.owner}/${repoInfo.repo}/git/refs`,
      {
        method: 'POST',
        body: JSON.stringify({
          ref: `refs/heads/${newBranch}`,
          sha: baseBranchInfo.commit.sha,
        }),
      }
    );
  }

  // Obtener información de un commit específico
  async getCommitInfo(repoUrl: string, commitSha: string) {
    const repoInfo = this.parseRepositoryUrl(repoUrl);
    if (!repoInfo) {
      throw new Error('URL de repositorio inválida');
    }

    return this.request(`/repos/${repoInfo.owner}/${repoInfo.repo}/commits/${commitSha}`);
  }

  // Obtener diferencias entre commits
  async getCommitDiff(repoUrl: string, baseSha: string, headSha: string) {
    const repoInfo = this.parseRepositoryUrl(repoUrl);
    if (!repoInfo) {
      throw new Error('URL de repositorio inválida');
    }

    return this.request(
      `/repos/${repoInfo.owner}/${repoInfo.repo}/compare/${baseSha}...${headSha}`
    );
  }

  // Buscar archivos en el repositorio
  async searchFiles(repoUrl: string, query: string, branch: string = 'main') {
    const repoInfo = this.parseRepositoryUrl(repoUrl);
    if (!repoInfo) {
      throw new Error('URL de repositorio inválida');
    }

    const response = await this.request(
      `/search/code?q=${encodeURIComponent(query)}+repo:${repoInfo.owner}/${repoInfo.repo}+path:/&ref=${branch}`
    );

    return response.items;
  }

  // Obtener estadísticas del repositorio
  async getRepositoryStats(repoUrl: string) {
    const repoInfo = this.parseRepositoryUrl(repoUrl);
      if (!repoInfo) {
      throw new Error('URL de repositorio inválida');
    }

    const [repo, languages, contributors] = await Promise.all([
      this.request(`/repos/${repoInfo.owner}/${repoInfo.repo}`),
      this.request(`/repos/${repoInfo.owner}/${repoInfo.repo}/languages`),
      this.request(`/repos/${repoInfo.owner}/${repoInfo.repo}/contributors`),
    ]);
      
      return {
      repository: repo,
      languages,
      contributors,
    };
  }

  // Verificar si el token es válido
  async validateToken(): Promise<boolean> {
    if (!this.token) {
      return false;
    }

    try {
      await this.request('/user');
      return true;
    } catch (error) {
      return false;
    }
  }

  // Configurar token
  setToken(token: string) {
    this.token = token;
  }

  // Obtener token actual
  getToken(): string | null {
    return this.token;
  }

  // =====================================================
  // MÉTODOS PRINCIPALES DE AUTO-LLENADO
  // =====================================================

  /**
   * Función principal para auto-completar información del proyecto desde GitHub
   * Análisis inteligente y completo del repositorio
   */
  async autoFillFromGitHub(repoUrl: string): Promise<DetectedInfo> {
    const startTime = Date.now();

    try {
      const repoInfo = this.parseRepositoryUrl(repoUrl);
      if (!repoInfo) {
        throw new Error('URL de repositorio inválida');
      }

      // Análisis paralelo de toda la información del repositorio
      const [
        repository,
        languages,
        readme,
        commits,
        releases,
        workflows,
        packageJson,
        dockerCompose,
        envFiles
      ] = await Promise.all([
        this.getRepositoryInfo(repoUrl),
        this.getRepositoryLanguages(repoUrl),
        this.getReadmeContent(repoUrl).catch(() => null),
        this.getRecentCommits(repoUrl, 'main', 5).catch(() => []),
        this.getReleases(repoUrl).catch(() => []),
        this.getWorkflows(repoUrl).catch(() => []),
        this.getPackageJson(repoUrl).catch(() => null),
        this.getDockerCompose(repoUrl).catch(() => null),
        this.getEnvironmentFiles(repoUrl).catch(() => [])
      ]);

      // Análisis inteligente del estado del proyecto
      const status = this.determineProjectStatus(repository, commits, releases, workflows);
      
      // Detección avanzada de tecnologías
      const technologies = this.extractTechnologies(
        languages, 
        packageJson, 
        workflows, 
        dockerCompose,
        repository.topics
      );

      // Generación inteligente de descripción
      const description = this.generateSmartDescription(
        repository, 
        readme, 
        packageJson, 
        technologies
      );

      // Extracción de variables de entorno
      const environmentVariables = this.extractEnvironmentVariables(envFiles);

      // Cálculo de confianza del análisis
      const confidence = this.calculateConfidence(
        readme, 
        packageJson, 
        dockerCompose, 
        workflows,
        envFiles
      );

      // Análisis detallado del repositorio
      const analysis = this.generateRepositoryAnalysis(
        repository,
        readme,
        packageJson,
        dockerCompose,
        workflows,
        commits,
        releases
      );

      const result: DetectedInfo = {
        name: this.formatProjectName(repository.name, packageJson),
        description,
        technologies,
        github_repository_url: repoUrl,
        status,
        is_active: !repository.archived && !repository.disabled,
        environment_variables: environmentVariables,
        confidence,
        analysis
      };

      const duration = Date.now() - startTime;
      
      return result;

    } catch (error: any) {
      if (error.message.includes('Not Found')) {
        throw new Error('Repository not found');
      } else if (error.message.includes('API rate limit exceeded')) {
        throw new Error('API rate limit exceeded');
      } else if (error.message.includes('private')) {
        throw new Error('Repository is private');
      } else {
        throw new Error(`Error al analizar el repositorio: ${error.message}`);
      }
    }
  }
}

export const githubService = new GitHubService();
export default GitHubService;
