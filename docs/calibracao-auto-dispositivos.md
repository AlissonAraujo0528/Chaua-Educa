# Fase P02 — qualidade Automática com efeitos completos e validação física

## Mudança isolada

No estado anterior, `renderer.setQuality('low')` fazia duas coisas ao mesmo tempo:
reduzia a resolução **e** a decoração. Isto não corresponde ao objetivo do
Automático, que deve conservar a floresta viva sempre que houver margem.

O modo Automático agora usa `renderer.setAutomaticQuality(level)`: o ajuste
atinge somente a resolução (`high` ou `low`), mantendo decoração completa
(`high`). Os modos manuais Alto e Baixo continuam chamando `setQuality`,
preservando seus limites e efeitos originais.

O detector **não muda de limiar neste PR**: janela de 2 segundos, limiar de
35% de tempo em quadros com mais de 23,8 ms e uma única redução por voo.
Isso evita recalibração baseada num único runner com SwiftShader.

## Provas visuais

`npm run test:render-profile` compara, pixel a pixel, o Automático em
resolução Baixa + decoração completa contra o perfil de renderização
correspondente, nos quatro trechos, com e sem movimento reduzido e em
três viewports. Os presets manuais são verificados separadamente.

`npm run test:quality` acompanha o modo em uso pela interface: após a queda
automática a resolução é Baixa mas a decoração permanece Alta, e a opção
manual Baixa continua reduzindo ambas. A observação de uma falha sintética
no desenho confirma que a adaptação continua unilateral, sem oscilações.

## Benchmark prolongado A/B

`scripts/benchmark-long-journey.cjs` aceita `LONG_MODE=auto|high|low` e
`LONG_SECONDS=30..140`. As amostras registram FPS, p50/p95/p99, falhas
acima de 33/50/100 ms, mudança de perfil, quadro por trecho e decoração.
O piloto usa a mesma semente e entradas, com `requestAnimationFrame` nativo.
O script não desativa física, encontros ou desenhos. Perguntas são respondidas
automaticamente pelo piloto.

Resultados de CI com emulação gráfica do Chromium **não substituem** os de
hardware real nem são uma comparação científica se os runners tiverem
capacidades diferentes.

## Testes em Android/iPhone de verdade

Não foi possível controlar aparelhos físicos diretamente neste ambiente.
O app oferece um medidor local opt-in (não é carregado na experiência normal).
Para medições confiáveis:

1. Abrir o **endereço HTTPS real do jogo** em Chrome Android ou Safari iOS,
   adicionando `?perf-test=1` ao endereço (ou `&perf-test=1`, caso já tenha
   parâmetros). A barra `Diagnóstico local` deverá aparecer.
2. Usar um aparelho por vez, sem economia de bateria e com outras aplicações
   pesadas fechadas. Registrar modelo, sistema, navegador, modo de energia e
   frequência da tela (60/90/120 Hz). Usar luminosidade e orientação constantes.
3. Escolher **Automático**. Tocar em `Iniciar` no painel, jogar pelo menos
   3 minutos, atravessando as quatro áreas e encontrando cobras, gaviões,
   transições e itens. Tocar em `Baixar relatório` e guardar o JSON.
4. Repetir **três vezes** no mesmo aparelho. Depois executar três voos em
   **Alto** e três em **Baixo** com a mesma orientação e condições.
5. Fazer capturas do papagaio, da cobra, dos obstáculos e dos efeitos nos
   três modos com a mesma orientação e aproximadamente o mesmo momento de
   jogo. Comparar nitidez, névoa, partículas, mudanças de qualidade e
   legibilidade da interface.
6. Em Android, para análise de GPU, usar Chrome remoto
   (`chrome://inspect/#devices`) com USB; em iPhone, usar o Web Inspector
   do Safari no Mac. Procurar carregamento, rasterização, reflows e picos
   da main thread, separando CPU, GPU e I/O.

O relatório salvo contém apenas métricas locais, configuração do aparelho
disponível via navegador e mudanças de perfil. O jogo não o envia a servidores
nem usa analytics para esse recurso. Ao fazer compartilhamento, revisar o campo
`userAgent` e quaisquer informações de dispositivo.

## Critérios para recalibrar a resolução

- Priorizar p95/p99 de frametime e estabilidade por trecho, não FPS médio.
- Preservar efeitos completos em Automático; jamais transformar uma queda de
  desempenho em remoção silenciosa de animações essenciais.
- Não aumentar agressivamente o DPR sem margem em **aparelhos reais**.
- Não mudar preset manual, física, pontuação, persistência ou conteúdo.
- Não afirmar 60 FPS constantes: mesmo p95 <= 16,7 ms não garante ausência
  de quadros muito longos ou bom desempenho em 90/120 Hz.
- Reavaliar limiar e resoluções intermediárias em outro PR **após dados A/B
  reproduzíveis em aparelhos físicos e execução longa no navegador**.

## Comandos

```sh
npm test
npm run test:quality
npm run test:render-profile
npm run test:perf-probe
LONG_MODE=auto LONG_SECONDS=140 npm run benchmark:long-flight
LONG_MODE=high LONG_SECONDS=140 npm run benchmark:long-flight
LONG_MODE=low LONG_SECONDS=140 npm run benchmark:long-flight
```
