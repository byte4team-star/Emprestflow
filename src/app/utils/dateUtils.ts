/**
 * Utilidades de data para evitar problemas de timezone
 * 
 * Problema: Quando usamos new Date('2026-04-15') no navegador, ele interpreta
 * como meia-noite UTC. Se o usuário está em UTC-3 (Brasil), ao usar 
 * toLocaleDateString, pode mostrar um dia anterior (14/04/2026).
 * 
 * Solução: Processar datas sempre como strings YYYY-MM-DD sem conversão para
 * objeto Date quando possível, ou garantir que a conversão considere UTC.
 */

/**
 * Formata uma data no formato YYYY-MM-DD para DD/MM/YYYY
 * sem conversão para objeto Date, evitando problemas de timezone
 * 
 * @param dateString - Data no formato YYYY-MM-DD ou YYYY-MM-DDTHH:mm:ss
 * @returns Data formatada como DD/MM/YYYY
 */
export function formatDateBR(dateString: string): string {
  if (!dateString) return '-';
  
  try {
    // Extrair apenas a parte da data (YYYY-MM-DD)
    const datePart = dateString.split('T')[0];
    const [year, month, day] = datePart.split('-');
    
    // Retornar no formato brasileiro sem conversão de timezone
    return `${day}/${month}/${year}`;
  } catch (error) {
    console.error('Error formatting date:', error, dateString);
    return dateString; // Retorna a string original em caso de erro
  }
}

/**
 * Formata uma data no formato YYYY-MM-DD usando toLocaleDateString
 * CORRIGIDO: Usa UTC para evitar mudança de dia
 * 
 * @param dateString - Data no formato YYYY-MM-DD ou YYYY-MM-DDTHH:mm:ss
 * @returns Data formatada conforme locale pt-BR
 */
export function formatDateBRWithLocale(dateString: string): string {
  if (!dateString) return '-';
  
  try {
    // Extrair apenas a parte da data
    const datePart = dateString.split('T')[0];
    const [year, month, day] = datePart.split('-');
    
    // Criar data em UTC para evitar conversão de timezone
    const date = new Date(Date.UTC(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day)
    ));
    
    // Usar toLocaleDateString com UTC timezone
    return date.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  } catch (error) {
    console.error('Error formatting date with locale:', error, dateString);
    return dateString;
  }
}

/**
 * Verifica se uma data está vencida
 * 
 * @param dueDate - Data de vencimento no formato YYYY-MM-DD
 * @returns true se a data está vencida
 */
export function isDateOverdue(dueDate: string): boolean {
  if (!dueDate) return false;
  
  try {
    // Pegar apenas a data, sem hora
    const datePart = dueDate.split('T')[0];
    const [year, month, day] = datePart.split('-');
    
    // Criar data em UTC
    const dueDateObj = new Date(Date.UTC(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day)
    ));
    
    // Data atual em UTC, zerada (apenas data, sem hora)
    const today = new Date();
    const todayUTC = new Date(Date.UTC(
      today.getUTCFullYear(),
      today.getUTCMonth(),
      today.getUTCDate()
    ));
    
    return dueDateObj < todayUTC;
  } catch (error) {
    console.error('Error checking if date is overdue:', error, dueDate);
    return false;
  }
}

/**
 * Converte uma data de input[type="date"] para o formato esperado pelo backend
 * 
 * @param dateInputValue - Valor do input de data (YYYY-MM-DD)
 * @returns Data no formato YYYY-MM-DD (sem alteração, apenas validação)
 */
export function formatDateForAPI(dateInputValue: string): string {
  // Input type="date" já retorna no formato YYYY-MM-DD, apenas validar
  if (!dateInputValue || !/^\d{4}-\d{2}-\d{2}$/.test(dateInputValue)) {
    throw new Error('Data inválida. Formato esperado: YYYY-MM-DD');
  }
  return dateInputValue;
}

/**
 * Calcula a diferença em dias entre duas datas
 * 
 * @param date1 - Primeira data (YYYY-MM-DD)
 * @param date2 - Segunda data (YYYY-MM-DD)
 * @returns Número de dias entre as datas (positivo se date2 > date1)
 */
export function getDaysBetween(date1: string, date2: string): number {
  try {
    const [year1, month1, day1] = date1.split('T')[0].split('-');
    const [year2, month2, day2] = date2.split('T')[0].split('-');
    
    const d1 = new Date(Date.UTC(parseInt(year1), parseInt(month1) - 1, parseInt(day1)));
    const d2 = new Date(Date.UTC(parseInt(year2), parseInt(month2) - 1, parseInt(day2)));
    
    const diffTime = d2.getTime() - d1.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  } catch (error) {
    console.error('Error calculating days between dates:', error);
    return 0;
  }
}

/**
 * Obtém a data atual no formato YYYY-MM-DD
 * 
 * @returns Data atual no formato YYYY-MM-DD
 */
export function getTodayDateString(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Valida se uma string é uma data válida no formato YYYY-MM-DD
 * 
 * @param dateString - String para validar
 * @returns true se é uma data válida
 */
export function isValidDateString(dateString: string): boolean {
  if (!dateString || !/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return false;
  }
  
  try {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    
    // Verificar se a data é válida (ex: 2026-02-30 é inválida)
    return (
      date.getUTCFullYear() === year &&
      date.getUTCMonth() === month - 1 &&
      date.getUTCDate() === day
    );
  } catch {
    return false;
  }
}

// Exemplos de uso:
// formatDateBR('2026-04-15') → '15/04/2026'
// formatDateBRWithLocale('2026-04-15') → '15/04/2026'
// isDateOverdue('2026-04-15') → false (se hoje é antes de 15/04/2026)
// getDaysBetween('2026-04-15', '2026-04-20') → 5
// getTodayDateString() → '2026-03-28' (data atual)
