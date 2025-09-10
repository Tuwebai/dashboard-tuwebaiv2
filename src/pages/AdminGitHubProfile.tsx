import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Github, 
  ArrowLeft
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useGitHubData } from '@/hooks/useGitHubData';

const AdminGitHubProfile: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const { 
    user, 
    repos, 
    featuredRepos, 
    stats, 
    languages, 
    contributionGraph,
    isLoading, 
    error 
  } = useGitHubData();
  
  const navigate = useNavigate();

  const getTopLanguages = () => {
    if (!languages || typeof languages !== 'object') {
      return [];
    }
    return Object.entries(languages)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <Button
              variant="outline"
              onClick={() => navigate(`/perfil/${userId}`)}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al perfil
            </Button>
            <h1 className="text-3xl font-bold text-slate-800">GitHub de {user?.name || 'Usuario'}</h1>
          </div>
          <Card className="bg-white rounded-2xl shadow-lg border border-slate-200/50">
            <CardContent className="p-8">
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <span className="ml-4 text-slate-600 text-lg">Cargando datos de GitHub...</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <Button
              variant="outline"
              onClick={() => navigate(`/perfil/${userId}`)}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al perfil
            </Button>
            <h1 className="text-3xl font-bold text-slate-800">GitHub de Usuario</h1>
          </div>
          <Card className="bg-white rounded-2xl shadow-lg border border-slate-200/50">
            <CardContent className="p-8">
              <div className="text-center py-12">
                <Github className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-800 mb-2">
                  No hay datos de GitHub disponibles
                </h3>
                <p className="text-slate-600">
                  Este usuario no tiene GitHub conectado o no hay datos disponibles.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => navigate(`/perfil/${userId}`)}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al perfil
          </Button>
          <h1 className="text-3xl font-bold text-slate-800">GitHub de {user.name || user.login}</h1>
        </div>

        <Card className="bg-white rounded-2xl shadow-lg border border-slate-200/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Github className="w-5 h-5 text-slate-700" />
                <span className="text-slate-800">GitHub</span>
              </CardTitle>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="text-sm font-medium text-green-600">Conectado</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mt-6 space-y-6">
              {/* Perfil del usuario */}
              <div className="flex items-start space-x-4 p-4 bg-slate-50 rounded-lg">
                <img
                  src={user.avatar_url}
                  alt={user.name || user.login}
                  className="w-16 h-16 rounded-full border-2 border-slate-200"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-slate-800 truncate">
                    {user.name || user.login}
                  </h3>
                  <p className="text-slate-600 text-sm truncate">
                    @{user.login}
                  </p>
                  {user.bio && (
                    <p className="text-slate-600 text-sm mt-1 line-clamp-2">
                      {user.bio}
                    </p>
                  )}
                  <div className="flex items-center space-x-4 mt-2 text-sm text-slate-500">
                    <span>{user.followers || 0} seguidores</span>
                    <span>{user.following || 0} siguiendo</span>
                    <span>{user.public_repos || 0} repositorios</span>
                  </div>
                </div>
              </div>

              {/* Estadísticas de contribuciones */}
              {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-slate-50 rounded-lg">
                    <div className="text-2xl font-bold text-slate-800">{stats.totalCommits || 0}</div>
                    <div className="text-sm text-slate-500">Commits totales</div>
                  </div>
                  <div className="text-center p-4 bg-slate-50 rounded-lg">
                    <div className="text-2xl font-bold text-slate-800">{stats.commitsThisYear || 0}</div>
                    <div className="text-sm text-slate-500">Este año</div>
                  </div>
                  <div className="text-center p-4 bg-slate-50 rounded-lg">
                    <div className="text-2xl font-bold text-slate-800">{stats.commitsThisMonth || 0}</div>
                    <div className="text-sm text-slate-500">Este mes</div>
                  </div>
                  <div className="text-center p-4 bg-slate-50 rounded-lg">
                    <div className="text-2xl font-bold text-slate-800">{stats.streak || 0}</div>
                    <div className="text-sm text-slate-500">Racha actual</div>
                  </div>
                </div>
              )}

              {/* Lenguajes más usados */}
              {languages && Object.keys(languages).length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-800">Lenguajes más usados</h3>
                  <div className="space-y-2">
                    {getTopLanguages().map(([language, count]) => (
                      <div key={language} className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-800">{language}</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-20 bg-slate-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${(count / Math.max(...Object.values(languages))) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-slate-500 w-12 text-right">
                            {count}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Repositorios destacados */}
              {featuredRepos && featuredRepos.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-800">Repositorios destacados</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    {featuredRepos.slice(0, 6).map((repo) => (
                      <div key={repo.id} className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-slate-800 truncate">{repo.name}</h4>
                            <p className="text-sm text-slate-600 mt-1 line-clamp-2">
                              {repo.description || 'Sin descripción'}
                            </p>
                            <div className="flex items-center space-x-4 mt-2 text-xs text-slate-500">
                              <span>{repo.language || 'Sin lenguaje'}</span>
                              <span>⭐ {repo.stargazers_count || 0}</span>
                              <span>🍴 {repo.forks_count || 0}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Gráfico de contribuciones */}
              {contributionGraph && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-800">Gráfico de contribuciones</h3>
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <p className="text-sm text-slate-600 text-center">
                      Gráfico de contribuciones disponible (implementación pendiente)
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminGitHubProfile;
