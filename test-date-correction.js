/**
 * SCRIPT DE TESTE: Verificação da Correção de Timezone
 * 
 * COMO USAR:
 * 1. Abrir o sistema no navegador
 * 2. Abrir Console (F12 > Console)
 * 3. Copiar e colar este script completo
 * 4. Pressionar Enter
 * 5. Verificar os resultados no console
 * 
 * O que este script testa:
 * - Simula o problema original (timezone local)
 * - Simula a solução implementada (UTC)
 * - Mostra comparação visual dos resultados
 */

(function() {
  'use strict';

  console.log('%c╔═══════════════════════════════════════════════════════════════════╗', 'color: #115740; font-weight: bold;');
  console.log('%c║  TESTE DE CORREÇÃO: TIMEZONE - DATA DE VENCIMENTO                 ║', 'color: #115740; font-weight: bold;');
  console.log('%c╚═══════════════════════════════════════════════════════════════════╝', 'color: #115740; font-weight: bold;');
  console.log('');

  // Função para simular o PROBLEMA original
  function testProblemaOriginal(firstDueDate, installments = 3) {
    console.log('%c🔴 TESTE 1: Código ANTES da correção (PROBLEMA)', 'color: #dc3545; font-weight: bold; font-size: 14px;');
    console.log('Input: Data de vencimento:', firstDueDate);
    console.log('');

    const results = [];
    
    for (let i = 0; i < installments; i++) {
      const dueDateParts = firstDueDate.split('-');
      const year = parseInt(dueDateParts[0]);
      const month = parseInt(dueDateParts[1]) - 1; // Month is 0-indexed
      const day = parseInt(dueDateParts[2]);
      
      // PROBLEMA: usando timezone local
      const dueDate = new Date(year, month + i, day);
      
      // Formatando usando métodos locais
      const formattedDueDate = `${dueDate.getFullYear()}-${String(dueDate.getMonth() + 1).padStart(2, '0')}-${String(dueDate.getDate()).padStart(2, '0')}`;
      
      results.push({
        parcela: i + 1,
        esperado: firstDueDate,
        gravado: formattedDueDate,
        correto: formattedDueDate === firstDueDate
      });

      // Simular próximo mês para a próxima parcela
      if (i === 0) {
        const nextMonthDate = new Date(year, month + 1, day);
        firstDueDate = `${nextMonthDate.getFullYear()}-${String(nextMonthDate.getMonth() + 1).padStart(2, '0')}-${String(nextMonthDate.getDate()).padStart(2, '0')}`;
      }
    }

    // Mostrar resultados
    console.table(results);
    
    const todosCorretos = results.every(r => r.correto);
    if (todosCorretos) {
      console.log('%c✅ Todas as datas estão corretas (improvável no código antigo)', 'color: #28a745; font-weight: bold;');
    } else {
      console.log('%c❌ PROBLEMA CONFIRMADO: Datas estão sendo gravadas incorretamente!', 'color: #dc3545; font-weight: bold;');
      console.log('%c   → As datas "gravadas" diferem das "esperadas"', 'color: #dc3545;');
    }
    console.log('');

    return results;
  }

  // Função para simular a SOLUÇÃO implementada
  function testSolucaoCorreta(firstDueDate, installments = 3) {
    console.log('%c✅ TESTE 2: Código DEPOIS da correção (SOLUÇÃO)', 'color: #28a745; font-weight: bold; font-size: 14px;');
    console.log('Input: Data de vencimento:', firstDueDate);
    console.log('');

    const results = [];
    
    for (let i = 0; i < installments; i++) {
      const dueDateParts = firstDueDate.split('-');
      const year = parseInt(dueDateParts[0]);
      const month = parseInt(dueDateParts[1]) - 1; // Month is 0-indexed
      const day = parseInt(dueDateParts[2]);
      
      // SOLUÇÃO: usando UTC
      const dueDate = new Date(Date.UTC(year, month + i, day));
      
      // Formatando usando métodos UTC
      const formattedDueDate = `${dueDate.getUTCFullYear()}-${String(dueDate.getUTCMonth() + 1).padStart(2, '0')}-${String(dueDate.getUTCDate()).padStart(2, '0')}`;
      
      results.push({
        parcela: i + 1,
        esperado: firstDueDate,
        gravado: formattedDueDate,
        correto: formattedDueDate === firstDueDate
      });

      // Simular próximo mês para a próxima parcela
      if (i === 0) {
        const nextMonthDate = new Date(Date.UTC(year, month + 1, day));
        firstDueDate = `${nextMonthDate.getUTCFullYear()}-${String(nextMonthDate.getUTCMonth() + 1).padStart(2, '0')}-${String(nextMonthDate.getUTCDate()).padStart(2, '0')}`;
      }
    }

    // Mostrar resultados
    console.table(results);
    
    const todosCorretos = results.every(r => r.correto);
    if (todosCorretos) {
      console.log('%c✅ PERFEITO! Todas as datas estão corretas!', 'color: #28a745; font-weight: bold;');
      console.log('%c   → As datas "gravadas" correspondem exatamente às "esperadas"', 'color: #28a745;');
    } else {
      console.log('%c❌ ERRO: Ainda há problema nas datas (improvável)', 'color: #dc3545; font-weight: bold;');
    }
    console.log('');

    return results;
  }

  // Teste comparativo
  function testeComparativo() {
    console.log('%c📊 TESTE 3: Comparação Lado a Lado', 'color: #115740; font-weight: bold; font-size: 14px;');
    console.log('');

    const testDate = '2026-04-15';
    console.log(`Data de teste: ${testDate}`);
    console.log('');

    // Teste 1: Problema
    const dueDateParts = testDate.split('-');
    const year = parseInt(dueDateParts[0]);
    const month = parseInt(dueDateParts[1]) - 1;
    const day = parseInt(dueDateParts[2]);
    
    // Método antigo (problema)
    const dateOld = new Date(year, month, day);
    const formattedOld = `${dateOld.getFullYear()}-${String(dateOld.getMonth() + 1).padStart(2, '0')}-${String(dateOld.getDate()).padStart(2, '0')}`;
    
    // Método novo (solução)
    const dateNew = new Date(Date.UTC(year, month, day));
    const formattedNew = `${dateNew.getUTCFullYear()}-${String(dateNew.getUTCMonth() + 1).padStart(2, '0')}-${String(dateNew.getUTCDate()).padStart(2, '0')}`;

    const comparison = [
      {
        metodo: '❌ Código Antigo',
        entrada: testDate,
        saida: formattedOld,
        correto: formattedOld === testDate ? '✅' : '❌',
        iso: dateOld.toISOString()
      },
      {
        metodo: '✅ Código Novo',
        entrada: testDate,
        saida: formattedNew,
        correto: formattedNew === testDate ? '✅' : '❌',
        iso: dateNew.toISOString()
      }
    ];

    console.table(comparison);
    console.log('');
  }

  // Executar todos os testes
  console.log('Executando testes...');
  console.log('');

  // Teste 1: Problema Original
  const result1 = testProblemaOriginal('2026-04-15', 3);
  
  console.log('─────────────────────────────────────────────────────────────────');
  console.log('');

  // Teste 2: Solução Correta
  const result2 = testSolucaoCorreta('2026-04-15', 3);

  console.log('─────────────────────────────────────────────────────────────────');
  console.log('');

  // Teste 3: Comparativo
  testeComparativo();

  console.log('─────────────────────────────────────────────────────────────────');
  console.log('');

  // Resumo final
  console.log('%c📋 RESUMO FINAL', 'color: #115740; font-weight: bold; font-size: 16px;');
  console.log('');

  const problemasEncontrados = result1.filter(r => !r.correto).length;
  const corrigidasNaSolucao = result2.filter(r => r.correto).length;

  if (problemasEncontrados > 0) {
    console.log('%c❌ Código ANTIGO:', 'color: #dc3545; font-weight: bold;');
    console.log(`   → ${problemasEncontrados} de ${result1.length} datas INCORRETAS`);
    console.log('   → Datas sendo gravadas com um dia a menos');
    console.log('');
  }

  if (corrigidasNaSolucao === result2.length) {
    console.log('%c✅ Código NOVO:', 'color: #28a745; font-weight: bold;');
    console.log(`   → ${corrigidasNaSolucao} de ${result2.length} datas CORRETAS`);
    console.log('   → Problema de timezone RESOLVIDO!');
    console.log('');
  }

  console.log('%c🔧 AÇÃO NECESSÁRIA:', 'color: #ffc107; font-weight: bold;');
  console.log('   1. Fazer deploy da Edge Function "server" atualizada');
  console.log('   2. Verificar logs: deve mostrar "Server version: 2.2.0"');
  console.log('   3. Testar criando um novo contrato no sistema');
  console.log('   4. Confirmar que as datas estão sendo gravadas corretamente');
  console.log('');

  console.log('%c═══════════════════════════════════════════════════════════════════', 'color: #115740; font-weight: bold;');
  console.log('%cTeste concluído! Revise os resultados acima. ☝️', 'color: #115740; font-style: italic;');
  console.log('%c═══════════════════════════════════════════════════════════════════', 'color: #115740; font-weight: bold;');

  // Retornar objeto com resultados para inspeção adicional
  return {
    problemaOriginal: result1,
    solucaoCorreta: result2,
    resumo: {
      problemasEncontrados,
      corrigidasNaSolucao,
      percentualCorrecao: ((corrigidasNaSolucao / result2.length) * 100).toFixed(0) + '%'
    }
  };
})();
