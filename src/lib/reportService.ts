import { supabase } from './supabase';

export interface ReportData {
  total_tasks: number;
  completed_tasks: number;
  overdue_tasks: number;
  productivity_score: number;
  team_efficiency: number;
  skill_gaps: Array<{
    skill_name: string;
    gap_percentage: number;
  }>;
  top_performers: Array<{
    user_name: string;
    completed_tasks: number;
  }>;
  project_summary: Array<{
    project_name: string;
    status: string;
    progress: number;
  }>;
}

export class ReportService {
  private static instance: ReportService;

  public static getInstance(): ReportService {
    if (!ReportService.instance) {
      ReportService.instance = new ReportService();
    }
    return ReportService.instance;
  }

  async generateReportData(type: 'weekly' | 'monthly'): Promise<ReportData> {
    try {
      // Calcular fechas según el tipo de reporte
      const now = new Date();
      const startDate = type === 'weekly' 
        ? new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Obtener datos de tareas
      const [tasksResult, projectTasksResult] = await Promise.all([
        supabase
          .from('tasks')
          .select('*')
          .gte('created_at', startDate.toISOString()),
        supabase
          .from('project_tasks')
          .select('*')
          .gte('created_at', startDate.toISOString())
      ]);

      const allTasks = [
        ...(tasksResult.data || []).map(t => ({ ...t, table_name: 'tasks' as const })),
        ...(projectTasksResult.data || []).map(t => ({ ...t, table_name: 'project_tasks' as const }))
      ];

      // Calcular estadísticas
      const total_tasks = allTasks.length;
      const completed_tasks = allTasks.filter(t => t.status === 'completed').length;
      const overdue_tasks = allTasks.filter(t => 
        t.status !== 'completed' && 
        t.due_date && 
        new Date(t.due_date) < now
      ).length;
      
      const productivity_score = total_tasks > 0 ? Math.round((completed_tasks / total_tasks) * 100) : 0;
      const team_efficiency = productivity_score; // Por ahora igual a productividad

      // Obtener gaps de skills
      const skillGaps = await this.getSkillGaps();

      // Obtener top performers
      const topPerformers = await this.getTopPerformers(startDate);

      // Obtener resumen de proyectos
      const projectSummary = await this.getProjectSummary();

      return {
        total_tasks,
        completed_tasks,
        overdue_tasks,
        productivity_score,
        team_efficiency,
        skill_gaps: skillGaps,
        top_performers: topPerformers,
        project_summary: projectSummary
      };
    } catch (error) {
      console.error('Error generando datos del reporte:', error);
      throw error;
    }
  }

  private async getSkillGaps() {
    try {
      const { data: skillData } = await supabase
        .from('user_skills')
        .select('skill_name, user_id')
        .not('skill_name', 'is', null);

      if (!skillData) return [];

      const skillCounts = skillData.reduce((acc: any, skill: any) => {
        if (!acc[skill.skill_name]) {
          acc[skill.skill_name] = 0;
        }
        acc[skill.skill_name]++;
        return acc;
      }, {});

      const { data: taskSkillsData } = await supabase
        .from('tasks')
        .select('required_skills')
        .not('required_skills', 'is', null);

      const requiredSkills: any = {};
      if (taskSkillsData) {
        taskSkillsData.forEach((task: any) => {
          if (task.required_skills && Array.isArray(task.required_skills)) {
            task.required_skills.forEach((skill: string) => {
              requiredSkills[skill] = (requiredSkills[skill] || 0) + 1;
            });
          }
        });
      }

      return Object.keys(skillCounts).map(skillName => {
        const available = skillCounts[skillName];
        const required = requiredSkills[skillName] || 0;
        const gapPercentage = required > 0 ? Math.max(0, ((required - available) / required) * 100) : 0;
        
        return {
          skill_name: skillName,
          gap_percentage: gapPercentage
        };
      });
    } catch (error) {
      console.error('Error obteniendo gaps de skills:', error);
      return [];
    }
  }

  private async getTopPerformers(startDate: Date) {
    try {
      const { data: users } = await supabase
        .from('users')
        .select('id, name, email');

      if (!users) return [];

      const performers = await Promise.all(
        users.map(async (user) => {
          const { count } = await supabase
            .from('tasks')
            .select('*', { count: 'exact' })
            .eq('assignee', user.id)
            .eq('status', 'completed')
            .gte('updated_at', startDate.toISOString());

          return {
            user_name: user.name || user.email,
            completed_tasks: count || 0
          };
        })
      );

      return performers
        .filter(p => p.completed_tasks > 0)
        .sort((a, b) => b.completed_tasks - a.completed_tasks)
        .slice(0, 5);
    } catch (error) {
      console.error('Error obteniendo top performers:', error);
      return [];
    }
  }

  private async getProjectSummary() {
    try {
      const { data: projects } = await supabase
        .from('projects')
        .select('name, status, progress')
        .limit(10);

      if (!projects) return [];

      return projects.map(project => ({
        project_name: project.name || 'Sin nombre',
        status: project.status || 'unknown',
        progress: project.progress || 0
      }));
    } catch (error) {
      console.error('Error obteniendo resumen de proyectos:', error);
      return [];
    }
  }

  async generatePDF(data: ReportData, type: 'weekly' | 'monthly'): Promise<Blob> {
    // Crear contenido HTML para el PDF
    const htmlContent = this.generateHTMLReport(data, type);
    
    // Usar jsPDF para generar el PDF
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    
    // Agregar título
    doc.setFontSize(20);
    doc.text(`Reporte ${type === 'weekly' ? 'Semanal' : 'Mensual'} - TuWebAI`, 20, 20);
    
    // Agregar fecha
    doc.setFontSize(12);
    doc.text(`Generado el: ${new Date().toLocaleDateString('es-ES')}`, 20, 30);
    
    // Agregar estadísticas principales
    doc.setFontSize(16);
    doc.text('Estadísticas Principales', 20, 50);
    
    doc.setFontSize(12);
    doc.text(`Total de Tareas: ${data.total_tasks}`, 20, 65);
    doc.text(`Tareas Completadas: ${data.completed_tasks}`, 20, 75);
    doc.text(`Tareas Vencidas: ${data.overdue_tasks}`, 20, 85);
    doc.text(`Puntuación de Productividad: ${data.productivity_score}%`, 20, 95);
    doc.text(`Eficiencia del Equipo: ${data.team_efficiency}%`, 20, 105);
    
    // Agregar top performers
    if (data.top_performers.length > 0) {
      doc.setFontSize(16);
      doc.text('Top Performers', 20, 125);
      
      doc.setFontSize(12);
      data.top_performers.forEach((performer, index) => {
        doc.text(`${index + 1}. ${performer.user_name}: ${performer.completed_tasks} tareas`, 20, 135 + (index * 10));
      });
    }
    
    // Agregar gaps de skills
    if (data.skill_gaps.length > 0) {
      doc.setFontSize(16);
      doc.text('Gaps de Habilidades', 20, 185);
      
      doc.setFontSize(12);
      data.skill_gaps.slice(0, 5).forEach((gap, index) => {
        doc.text(`${gap.skill_name}: ${gap.gap_percentage.toFixed(1)}% gap`, 20, 195 + (index * 10));
      });
    }
    
    return doc.output('blob');
  }

  async generateCSV(data: ReportData, type: 'weekly' | 'monthly'): Promise<Blob> {
    const csvContent = [
      ['Métrica', 'Valor'],
      ['Tipo de Reporte', type === 'weekly' ? 'Semanal' : 'Mensual'],
      ['Fecha de Generación', new Date().toLocaleDateString('es-ES')],
      ['Total de Tareas', data.total_tasks.toString()],
      ['Tareas Completadas', data.completed_tasks.toString()],
      ['Tareas Vencidas', data.overdue_tasks.toString()],
      ['Puntuación de Productividad (%)', data.productivity_score.toString()],
      ['Eficiencia del Equipo (%)', data.team_efficiency.toString()],
      ['', ''],
      ['Top Performers', ''],
      ['Nombre', 'Tareas Completadas']
    ];

    // Agregar top performers
    data.top_performers.forEach(performer => {
      csvContent.push([performer.user_name, performer.completed_tasks.toString()]);
    });

    csvContent.push(['', '']);
    csvContent.push(['Gaps de Habilidades', '']);
    csvContent.push(['Habilidad', 'Gap (%)']);

    // Agregar gaps de skills
    data.skill_gaps.forEach(gap => {
      csvContent.push([gap.skill_name, gap.gap_percentage.toFixed(1)]);
    });

    const csvString = csvContent.map(row => row.join(',')).join('\n');
    return new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  }

  private generateHTMLReport(data: ReportData, type: 'weekly' | 'monthly'): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Reporte ${type === 'weekly' ? 'Semanal' : 'Mensual'} - TuWebAI</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .section { margin-bottom: 25px; }
          .metric { display: flex; justify-content: space-between; margin: 10px 0; }
          .table { width: 100%; border-collapse: collapse; margin: 10px 0; }
          .table th, .table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          .table th { background-color: #f2f2f2; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Reporte ${type === 'weekly' ? 'Semanal' : 'Mensual'}</h1>
          <p>TuWebAI Dashboard - ${new Date().toLocaleDateString('es-ES')}</p>
        </div>
        
        <div class="section">
          <h2>Estadísticas Principales</h2>
          <div class="metric"><span>Total de Tareas:</span><span>${data.total_tasks}</span></div>
          <div class="metric"><span>Tareas Completadas:</span><span>${data.completed_tasks}</span></div>
          <div class="metric"><span>Tareas Vencidas:</span><span>${data.overdue_tasks}</span></div>
          <div class="metric"><span>Puntuación de Productividad:</span><span>${data.productivity_score}%</span></div>
          <div class="metric"><span>Eficiencia del Equipo:</span><span>${data.team_efficiency}%</span></div>
        </div>
        
        ${data.top_performers.length > 0 ? `
        <div class="section">
          <h2>Top Performers</h2>
          <table class="table">
            <tr><th>Nombre</th><th>Tareas Completadas</th></tr>
            ${data.top_performers.map(p => `<tr><td>${p.user_name}</td><td>${p.completed_tasks}</td></tr>`).join('')}
          </table>
        </div>
        ` : ''}
        
        ${data.skill_gaps.length > 0 ? `
        <div class="section">
          <h2>Gaps de Habilidades</h2>
          <table class="table">
            <tr><th>Habilidad</th><th>Gap (%)</th></tr>
            ${data.skill_gaps.map(g => `<tr><td>${g.skill_name}</td><td>${g.gap_percentage.toFixed(1)}</td></tr>`).join('')}
          </table>
        </div>
        ` : ''}
      </body>
      </html>
    `;
  }

  downloadFile(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

export const reportService = ReportService.getInstance();