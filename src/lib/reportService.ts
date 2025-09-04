import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

interface ReportData {
  title: string;
  description: string;
  data: any[];
  columns: Array<{
    key: string;
    label: string;
    type: 'text' | 'number' | 'date' | 'currency' | 'percentage';
  }>;
  summary?: {
    total?: number;
    average?: number;
    count?: number;
  };
}

interface ChartData {
  type: 'line' | 'bar' | 'pie' | 'area';
  title: string;
  data: any[];
  xAxis: string;
  yAxis: string;
}

class ReportService {
  private formatValue(value: any, type: string): string {
    switch (type) {
      case 'currency':
        return new Intl.NumberFormat('es-ES', {
          style: 'currency',
          currency: 'USD'
        }).format(value);
      case 'percentage':
        return `${value}%`;
      case 'date':
        return new Date(value).toLocaleDateString('es-ES');
      case 'number':
        return new Intl.NumberFormat('es-ES').format(value);
      default:
        return String(value);
    }
  }

  public async exportToPDF(element: HTMLElement, filename: string): Promise<void> {
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`${filename}.pdf`);
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      throw new Error('No se pudo exportar el PDF');
    }
  }

  public exportToExcel(data: ReportData, filename: string): void {
    try {
      // Crear workbook
      const workbook = XLSX.utils.book_new();

      // Preparar datos para Excel
      const excelData = data.data.map(row => {
        const formattedRow: any = {};
        data.columns.forEach(column => {
          formattedRow[column.label] = this.formatValue(row[column.key], column.type);
        });
        return formattedRow;
      });

      // Crear worksheet
      const worksheet = XLSX.utils.json_to_sheet(excelData);

      // Agregar resumen si existe
      if (data.summary) {
        const summaryData = [];
        if (data.summary.total !== undefined) {
          summaryData.push({ Métrica: 'Total', Valor: this.formatValue(data.summary.total, 'number') });
        }
        if (data.summary.average !== undefined) {
          summaryData.push({ Métrica: 'Promedio', Valor: this.formatValue(data.summary.average, 'number') });
        }
        if (data.summary.count !== undefined) {
          summaryData.push({ Métrica: 'Cantidad', Valor: this.formatValue(data.summary.count, 'number') });
        }

        if (summaryData.length > 0) {
          // Agregar fila vacía
          XLSX.utils.sheet_add_aoa(worksheet, [['']], { origin: -1 });
          // Agregar resumen
          XLSX.utils.sheet_add_json(worksheet, summaryData, { origin: -1 });
        }
      }

      // Agregar worksheet al workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Reporte');

      // Generar archivo
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `${filename}.xlsx`);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      throw new Error('No se pudo exportar el Excel');
    }
  }

  public exportToCSV(data: ReportData, filename: string): void {
    try {
      // Crear headers
      const headers = data.columns.map(col => col.label).join(',');
      
      // Crear filas de datos
      const rows = data.data.map(row => {
        return data.columns.map(col => {
          const value = this.formatValue(row[col.key], col.type);
          // Escapar comillas en CSV
          return value.includes(',') ? `"${value}"` : value;
        }).join(',');
      });

      // Agregar resumen si existe
      if (data.summary) {
        rows.push(''); // Línea vacía
        if (data.summary.total !== undefined) {
          rows.push(`Total,${this.formatValue(data.summary.total, 'number')}`);
        }
        if (data.summary.average !== undefined) {
          rows.push(`Promedio,${this.formatValue(data.summary.average, 'number')}`);
        }
        if (data.summary.count !== undefined) {
          rows.push(`Cantidad,${this.formatValue(data.summary.count, 'number')}`);
        }
      }

      // Crear contenido CSV
      const csvContent = [headers, ...rows].join('\n');
      
      // Crear blob y descargar
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      saveAs(blob, `${filename}.csv`);
    } catch (error) {
      console.error('Error exporting to CSV:', error);
      throw new Error('No se pudo exportar el CSV');
    }
  }

  public generateProjectReport(projects: any[]): ReportData {
    return {
      title: 'Reporte de Proyectos',
      description: 'Análisis detallado de todos los proyectos',
      columns: [
        { key: 'name', label: 'Nombre del Proyecto', type: 'text' },
        { key: 'type', label: 'Tipo', type: 'text' },
        { key: 'status', label: 'Estado', type: 'text' },
        { key: 'ownerEmail', label: 'Propietario', type: 'text' },
        { key: 'createdAt', label: 'Fecha de Creación', type: 'date' },
        { key: 'updatedAt', label: 'Última Actualización', type: 'date' }
      ],
      data: projects,
      summary: {
        total: projects.length,
        count: projects.filter(p => p.status === 'active').length
      }
    };
  }

  public generateUserReport(users: any[]): ReportData {
    return {
      title: 'Reporte de Usuarios',
      description: 'Análisis de usuarios registrados',
      columns: [
        { key: 'email', label: 'Email', type: 'text' },
        { key: 'role', label: 'Rol', type: 'text' },
        { key: 'createdAt', label: 'Fecha de Registro', type: 'date' },
        { key: 'lastLogin', label: 'Último Acceso', type: 'date' },
        { key: 'status', label: 'Estado', type: 'text' }
      ],
      data: users,
      summary: {
        total: users.length,
        count: users.filter(u => u.status === 'active').length
      }
    };
  }

  public generateRevenueReport(revenueData: any[]): ReportData {
    return {
      title: 'Reporte de Ingresos',
      description: 'Análisis financiero detallado',
      columns: [
        { key: 'month', label: 'Mes', type: 'text' },
        { key: 'revenue', label: 'Ingresos', type: 'currency' },
        { key: 'projects', label: 'Proyectos', type: 'number' },
        { key: 'growth', label: 'Crecimiento', type: 'percentage' }
      ],
      data: revenueData,
      summary: {
        total: revenueData.reduce((sum, item) => sum + item.revenue, 0),
        average: revenueData.reduce((sum, item) => sum + item.revenue, 0) / revenueData.length
      }
    };
  }

  public generatePerformanceReport(performanceData: any[]): ReportData {
    return {
      title: 'Reporte de Rendimiento',
      description: 'Métricas de rendimiento del equipo',
      columns: [
        { key: 'metric', label: 'Métrica', type: 'text' },
        { key: 'value', label: 'Valor', type: 'number' },
        { key: 'target', label: 'Objetivo', type: 'number' },
        { key: 'achievement', label: 'Logro', type: 'percentage' }
      ],
      data: performanceData,
      summary: {
        average: performanceData.reduce((sum, item) => sum + item.value, 0) / performanceData.length
      }
    };
  }

  public async exportDashboardAsPDF(elementId: string, title: string): Promise<void> {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error('Elemento no encontrado');
    }

    await this.exportToPDF(element, `dashboard-${title.toLowerCase().replace(/\s+/g, '-')}`);
  }

  public exportMultipleReports(reports: ReportData[], filename: string): void {
    try {
      const workbook = XLSX.utils.book_new();

      reports.forEach((report, index) => {
        const excelData = report.data.map(row => {
          const formattedRow: any = {};
          report.columns.forEach(column => {
            formattedRow[column.label] = this.formatValue(row[column.key], column.type);
          });
          return formattedRow;
        });

        const worksheet = XLSX.utils.json_to_sheet(excelData);
        XLSX.utils.book_append_sheet(workbook, worksheet, report.title.substring(0, 31));
      });

      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `${filename}.xlsx`);
    } catch (error) {
      console.error('Error exporting multiple reports:', error);
      throw new Error('No se pudieron exportar los reportes');
    }
  }
}

// Singleton instance
export const reportService = new ReportService();

export default reportService; 
