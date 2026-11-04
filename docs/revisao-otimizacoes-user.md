# Revisão conservadora das otimizações propostas — 04/11/2026

## Integrações desta branch
- \`script.js\`: utiliza o viewport cacheado de \`Renderer.getViewport()\` no resize e no loop principal. Margens seguras são atualizadas antes do resize.
- \`engine.mjs\`: lazy collision body por tick, recalculado quando a pose do jogador muda após uma recuperação; broad phase de gavião, madeira e pickup, confirmado por testes de geometrias SAT.
- \`engine.mjs\`: limpeza de arrays sob demanda, preservando a exclusão de \`NaN\` e demais dados inválidos pela mesma condição de filtragem original.
- \`render.mjs\`: prewarm de glows estáticos e da pimenta durante a carga, sem alterar seus pixels em voo.

## Não integrados sem benchmark
- Pré-escala da floresta: aumenta o consumo de memória em vista vertical, e pode modificar pixels pela dupla reamostragem. Só integrar com teste A/B de FPS + paridade de imagem + limite de RAM.
- Remover \`getImageData\` síncrono entre faixas: no A/B anterior houve regressão ao eliminá-lo; encontrar solução alternativa antes.
- Pooling em \`snapshot()\` e \`visual()\`: pode quebrar snapshots e interpolação. Exige teste de referências, temporalidade e GC.
- Simplificar malha da cobra: versões anteriores alteraram pixels.

## Validação
\`npm test\`, \`npm run build\`, testes completos de navegador da CI e \`tests/engine-fastpaths.test.mjs\`. FPS de hardware real ainda não comprovado.
