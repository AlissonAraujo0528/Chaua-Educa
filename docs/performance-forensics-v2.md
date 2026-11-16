# Chauá Performance Analyzer V2 — diagnóstico forense opcional

## Objetivo

Investigar qual operação foi realmente medida durante um stutter no notebook
sem confundir correlação temporal com prova de causa.

O jogo normal no GitHub Pages não inicia rotinas de coleta e não depende de
servidor, backend, ferramentas de desenvolvimento ou prompts.

## Como abrir

Modo leve:
https://alissonaraujo0528.github.io/Chaua-Educa/Chaua-Educa-main/?perf-test=1

Modo profundo:
https://alissonaraujo0528.github.io/Chaua-Educa/Chaua-Educa-main/?perf-test=1&perf-level=deep

No painel inferior esquerdo, selecione Leve ou Profundo, clique Iniciar,
entre no jogo e complete uma sessão. Clique Baixar relatório para obter o JSON.
Nada é enviado automaticamente, nem salvo no servidor. O último log pode ser
recuperado em window.__CHAUA_LAST_LOG__ enquanto a página estiver aberta.

## Medições

- Intervalos nativos entre quadros requestAnimationFrame e 1% low FPS real
  (inverso da média dos tempos dos 1% piores quadros).
- Tempo JS de simulação, interpolação, renderização, fundo e HUD; no modo
  profundo também mede madeira, partículas, personagem e escudo.
- Tempo separado de storage.read, storage.serialize e storage.write,
  registrando apenas chave e tamanho do valor, nunca conteúdo ou nomes.
- Eventos de coleta, geração de cobra e primeiro desenho de cada atlas
  da cobra, além de posicionamento alternativo de frutas.
- Long Animation Frames e longtasks por PerformanceObserver quando disponíveis,
  com script de entrada, pausas e layout forçado quando expostos pelo navegador.
- Buffers limitados e captura dos quadros anteriores a stutters severos.
- JSON com forensics.correlatedStutters e evidências independentes.
  As classificações measured-js-work-overlap, browser-long-animation-frame-observed
  e unattributed indicam EVIDÊNCIA, não causalidade comprovada.

## Interpretação responsável

Um intervalo de 183 ms entre callbacks RAF não equivale a 183 ms de
JavaScript executado pelo jogo. A Long Animation Frames API é opcional e
nem sempre identifica a função interna que consumiu tempo. Medir drawImage
não comprova upload de textura para GPU, custo de GPU, GC ou flush de disco.
Cuidado com atividades de outras aplicações no notebook.

O diagnóstico profundo tem custo próprio. Compare com o modo leve e com
partidas sem diagnóstico. Use a mesma seed e resolução em testes de laboratório,
repetindo várias execuções. Não extrapole uma partida de 20 segundos na
primavera para todo o inverno ou toda a progressão do jogo.

## Persistência

O progresso educativo e os recordes continuam salvos imediatamente em
localStorage. A gravação de descobertas/frutas já armazenadas deixa de ser
repetida; registros novos continuam usando a mesma semântica de tratamento
de erros. Não há postergação arriscada até o encerramento do voo.

## Validação

- Unitários: npm test
- Navegador: npm run test:perf-probe e npm run test:perf-forensics
- CI geral: Validate game (GitHub Actions)

Não realizar merge se a validação falhar. Não sacrificar arte ou física
somente para produzir FPS melhores no benchmark.
