// src/utils/formatDateSafe.ts
export function formatDateSafe(date: any): string {
  if (!date) return 'Fecha no disponible';
  let d: Date;
  if (typeof date === 'string' || typeof date === 'number') {
    d = new Date(date);
  } else if (date.toDate) {
    d = date.toDate();
  } else {
    d = date;
  }
  if (!(d instanceof Date) || isNaN(d.getTime())) return 'Fecha no disponible';
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
} 
