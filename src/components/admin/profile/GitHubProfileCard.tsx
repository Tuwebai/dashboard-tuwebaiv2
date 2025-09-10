import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Github, 
  Eye
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useGitHubData } from '@/hooks/useGitHubData';

interface GitHubProfileCardProps {
  userId: string;
}

export const GitHubProfileCard: React.FC<GitHubProfileCardProps> = ({ userId }) => {
  const { 
    user, 
    stats, 
    isLoading, 
    error 
  } = useGitHubData();
  
  const navigate = useNavigate();

  const handleViewMore = () => {
    navigate(`/profile/${userId}/github`);
  };

  if (isLoading) {
    return (
      <Card className="bg-white rounded-2xl shadow-lg border border-slate-200/50">
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-slate-600">Cargando GitHub...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !user) {
    return null; // No mostrar la card si hay error o no hay datos
  }

  return (
    <Card className="bg-white rounded-2xl shadow-lg border border-slate-200/50">
      <CardHeader className="pb-4">
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
      <CardContent className="space-y-4">
        {/* Perfil del usuario */}
        <div className="flex items-center space-x-4">
          <img
            src={user.avatar_url}
            alt={user.name || user.login}
            className="w-12 h-12 rounded-full border-2 border-slate-200"
          />
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-slate-800 truncate">
              {user.name || user.login}
            </h3>
            <p className="text-slate-600 text-sm truncate">
              @{user.login}
            </p>
            <div className="flex items-center space-x-4 mt-1 text-sm text-slate-500">
              <span>{user.followers || 0} seguidores</span>
              <span>{user.following || 0} siguiendo</span>
              <span>{user.public_repos || 0} repositorios</span>
            </div>
          </div>
        </div>

        {/* Estadísticas básicas */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="text-center p-3 bg-slate-50 rounded-lg">
              <div className="text-xl font-bold text-slate-800">{stats.totalCommits || 0}</div>
              <div className="text-xs text-slate-500">Commits totales</div>
            </div>
            <div className="text-center p-3 bg-slate-50 rounded-lg">
              <div className="text-xl font-bold text-slate-800">{stats.commitsThisYear || 0}</div>
              <div className="text-xs text-slate-500">Este año</div>
            </div>
            <div className="text-center p-3 bg-slate-50 rounded-lg">
              <div className="text-xl font-bold text-slate-800">{stats.commitsThisMonth || 0}</div>
              <div className="text-xs text-slate-500">Este mes</div>
            </div>
            <div className="text-center p-3 bg-slate-50 rounded-lg">
              <div className="text-xl font-bold text-slate-800">{stats.streak || 0}</div>
              <div className="text-xs text-slate-500">Racha actual</div>
            </div>
          </div>
        )}

        {/* Botón Ver más */}
        <div className="flex justify-center pt-2">
          <Button 
            onClick={handleViewMore} 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Eye className="w-4 h-4 mr-2" />
            Ver más detalles
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
