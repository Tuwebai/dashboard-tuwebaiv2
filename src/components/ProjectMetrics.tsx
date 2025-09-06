import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  CheckSquare, 
  Clock, 
  TrendingUp, 
  BarChart3,
  Play,
  Pause,
  CheckCircle,
  AlertTriangle,
  Calendar,
  Users,
  MessageSquare,
  Zap
} from 'lucide-react';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { motion, AnimatePresence } from '@/components/OptimizedMotion';

// Estilos CSS personalizados para animaciones
const customStyles = `
  @keyframes gradient-x {
    0%, 100% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
  }
  
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
  }
  
  @keyframes pulse-glow {
    0%, 100% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.3); }
    50% { box-shadow: 0 0 30px rgba(59, 130, 246, 0.6); }
  }
  
  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  
  .animate-gradient-x {
    background-size: 200% 200%;
    animation: gradient-x 3s ease infinite;
  }
  
  .animate-spin-slow {
    animation: spin 3s linear infinite;
  }
  
  .animate-float {
    animation: float 3s ease-in-out infinite;
  }
  
  .animate-pulse-glow {
    animation: pulse-glow 2s ease-in-out infinite;
  }
  
  .animate-shimmer {
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
    background-size: 200% 100%;
    animation: shimmer 2s infinite;
  }
  
  .card-hover-effect {
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .card-hover-effect:hover {
    transform: translateY(-8px) scale(1.02);
  }
  
  .metric-value-animation {
    background-size: 200% 200%;
    animation: gradient-x 3s ease infinite;
  }
`;

// Inyectar estilos
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = customStyles;
  document.head.appendChild(styleSheet);
}

interface ProjectMetricsProps {
  projects: any[];
  loading?: boolean;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  onHover?: () => void;
  preview?: React.ReactNode;
}

const MetricCard = React.memo(({ 
  title, 
  value, 
  subtitle, 
  icon, 
  color, 
  trend, 
  onHover,
  preview 
}: MetricCardProps) => {
  const [showPreview, setShowPreview] = useState(false);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div 
            className="relative group cursor-pointer card-hover-effect"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            onMouseEnter={() => setShowPreview(true)}
            onMouseLeave={() => setShowPreview(false)}
          >
            <div className={`${color} rounded-2xl p-4 sm:p-6 shadow-xl hover:shadow-2xl dark:shadow-2xl transition-shadow duration-500 transform hover:-translate-y-2 border border-border/50 dark:border-slate-700/50 backdrop-blur-sm overflow-hidden relative`}>
              {/* Efecto de brillo sutil */}
              <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              {/* Efecto de brillo adicional para modo oscuro */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-white/20 to-white/10 opacity-0 dark:opacity-100 group-hover:opacity-100 dark:group-hover:opacity-100 transition-opacity duration-500"></div>
              
              {/* Icono mejorado con animación flotante */}
              <div className="flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl mb-4 shadow-2xl group-hover:scale-110 transition-transform duration-500 text-white animate-float relative overflow-hidden">
                {icon}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
              </div>
              
              {/* Valor con animación mejorada */}
              <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-3 group-hover:scale-105 transition-transform duration-300 metric-value-animation bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                {value}
              </div>
              
              {/* Título con mejor tipografía */}
              <div className="text-lg sm:text-xl font-bold text-white mb-2 flex items-center gap-2">
                {title}
              </div>
              
              {/* Subtítulo con icono */}
              <div className="text-sm text-white/80 flex items-center gap-2">
                <div className="w-2 h-2 bg-gradient-to-r from-white/60 to-white/40 rounded-full animate-pulse"></div>
                <span className="text-white/90 font-semibold">
                  {subtitle}
                </span>
              </div>
              
              {/* Efecto de partículas flotantes */}
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce mt-1" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </motion.div>
        </TooltipTrigger>
        {preview && (
          <TooltipContent side="top" className="p-0 bg-transparent border-0 shadow-none">
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-6 w-80 backdrop-blur-sm"
            >
              {preview}
            </motion.div>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
});

MetricCard.displayName = 'MetricCard';

const ProjectMetrics = React.memo(({ projects, loading = false }: ProjectMetricsProps) => {
  // Calcular métricas
  const metrics = useMemo(() => {
    const totalProjects = projects.length;
    const activeProjects = projects.filter(p => p.status !== 'completed' && p.status !== 'cancelled').length;
    const completedProjects = projects.filter(p => p.status === 'completed').length;
    const inProgressProjects = projects.filter(p => p.status === 'in_progress').length;
    const pendingProjects = projects.filter(p => p.status === 'pending').length;
    
    // Calcular total de tareas
    const totalTasks = projects.reduce((acc, project) => {
      return acc + (project.fases?.length || 0);
    }, 0);
    
    const completedTasks = projects.reduce((acc, project) => {
      return acc + (project.fases?.filter((fase: any) => fase.estado === 'Terminado').length || 0);
    }, 0);
    
    // Calcular actividad reciente (últimos 7 días)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentActivity = projects.filter(project => {
      const updatedAt = new Date(project.updated_at);
      return updatedAt >= sevenDaysAgo;
    }).length;
    
    // Calcular progreso promedio
    const averageProgress = projects.length > 0 
      ? Math.round(projects.reduce((acc, project) => {
          const progress = project.fases?.length > 0 
            ? Math.round((project.fases.filter((f: any) => f.estado === 'Terminado').length / project.fases.length) * 100)
            : 0;
          return acc + progress;
        }, 0) / projects.length)
      : 0;

    return {
      totalProjects,
      activeProjects,
      completedProjects,
      inProgressProjects,
      pendingProjects,
      totalTasks,
      completedTasks,
      recentActivity,
      averageProgress
    };
  }, [projects]);

  // Preview de proyectos activos
  const activeProjectsPreview = (
    <div className="space-y-3">
      <h4 className="font-semibold text-slate-900 dark:text-white mb-3">Proyectos Activos</h4>
      <div className="space-y-2">
        {projects.filter(p => p.status !== 'completed' && p.status !== 'cancelled').slice(0, 5).map((project) => (
          <div key={project.id} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-700 rounded-lg">
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                {project.name}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  {project.status === 'in_progress' ? 'En desarrollo' : 
                   project.status === 'pending' ? 'Pendiente' : 
                   project.status === 'review' ? 'En revisión' : project.status}
                </Badge>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {project.fases?.length || 0} fases
                </span>
              </div>
            </div>
            <div className="w-16">
              <Progress 
                value={project.fases?.length > 0 
                  ? Math.round((project.fases.filter((f: any) => f.estado === 'Terminado').length / project.fases.length) * 100)
                  : 0
                } 
                className="h-2"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Preview de tareas
  const tasksPreview = (
    <div className="space-y-3">
      <h4 className="font-semibold text-slate-900 dark:text-white mb-3">Desglose de Tareas</h4>
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-slate-600 dark:text-slate-400">Completadas</span>
          <span className="font-semibold text-green-600">{metrics.completedTasks}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-slate-600 dark:text-slate-400">Pendientes</span>
          <span className="font-semibold text-slate-600 dark:text-slate-400">
            {metrics.totalTasks - metrics.completedTasks}
          </span>
        </div>
        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${metrics.totalTasks > 0 ? (metrics.completedTasks / metrics.totalTasks) * 100 : 0}%` }}
          />
        </div>
      </div>
    </div>
  );

  // Preview de actividad reciente
  const activityPreview = (
    <div className="space-y-3">
      <h4 className="font-semibold text-slate-900 dark:text-white mb-3">Actividad Reciente</h4>
      <div className="space-y-2">
        {projects
          .filter(project => {
            const updatedAt = new Date(project.updated_at);
            return updatedAt >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          })
          .slice(0, 3)
          .map((project) => (
            <div key={project.id} className="flex items-center gap-3 p-2 bg-slate-50 dark:bg-slate-700 rounded-lg">
              <div className="w-2 h-2 bg-blue-500 rounded-full" />
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  {project.name}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Actualizado {new Date(project.updated_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="bg-slate-100 dark:bg-slate-800 animate-pulse">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="h-4 bg-slate-300 dark:bg-slate-600 rounded w-20 mb-2" />
                  <div className="h-8 bg-slate-300 dark:bg-slate-600 rounded w-16" />
                </div>
                <div className="w-12 h-12 bg-slate-300 dark:bg-slate-600 rounded-xl" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6 px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="contents"
        >
        {/* Proyectos Activos */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.5, ease: "easeOut" }}
        >
          <MetricCard
            title="Proyectos Activos"
            value={metrics.activeProjects}
            subtitle={`${metrics.inProgressProjects} en progreso`}
            icon={<Activity className="h-8 w-8" />}
            color="bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-700"
            trend={{ value: 12, isPositive: true }}
            preview={activeProjectsPreview}
          />
        </motion.div>

        {/* Tareas Totales */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5, ease: "easeOut" }}
        >
          <MetricCard
            title="Tareas Totales"
            value={metrics.totalTasks}
            subtitle={`${metrics.completedTasks} completadas`}
            icon={<CheckSquare className="h-8 w-8" />}
            color="bg-gradient-to-br from-emerald-500 via-green-600 to-teal-700"
            preview={tasksPreview}
          />
        </motion.div>

        {/* Progreso Promedio */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.5, ease: "easeOut" }}
        >
          <MetricCard
            title="Progreso Promedio"
            value={`${metrics.averageProgress}%`}
            subtitle="de todos los proyectos"
            icon={<BarChart3 className="h-8 w-8" />}
            color="bg-gradient-to-br from-violet-500 via-purple-600 to-fuchsia-700"
          />
        </motion.div>

        {/* Actividad Reciente */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.5, ease: "easeOut" }}
        >
          <MetricCard
            title="Actividad Reciente"
            value={metrics.recentActivity}
            subtitle="últimos 7 días"
            icon={<Clock className="h-8 w-8" />}
            color="bg-gradient-to-br from-amber-500 via-yellow-600 to-orange-700"
            preview={activityPreview}
          />
        </motion.div>

        {/* Análisis General */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.5, ease: "easeOut" }}
        >
          <MetricCard
            title="Eficiencia"
            value={`${Math.round((metrics.completedProjects / Math.max(metrics.totalProjects, 1)) * 100)}%`}
            subtitle="proyectos completados"
            icon={<TrendingUp className="h-8 w-8" />}
            color="bg-gradient-to-br from-indigo-500 via-blue-600 to-cyan-700"
          />
        </motion.div>
        </motion.div>
      </div>
    </div>
  );
});

ProjectMetrics.displayName = 'ProjectMetrics';

export default ProjectMetrics;
