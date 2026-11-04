# Auditoria final antes do merge — Chauá Educa

**Origem aprovada:** `nome-da-sua-branch` @ `d3273f4d`.
**Candidato:** `perf/final-grafico-premerge-20261104`.
**Escopo:** fundo, transições, fluidez e regressões gráficas. Sem alteração de física, jogabilidade, HUD, controles ou resolução automática.

## Escolhas técnicas

1. **Mantido:** reconstrução completa do fundo em oito faixas de pixels físicos, usando buffer oculto e apresentando apenas após a oitava faixa. A leitura de um pixel após cada faixa força a conclusão da rasterização naquele passo; o custo é limitado por medição. Se dois readbacks seguidos excederem 18 ms, ou ocorrer erro, o sistema libera o buffer e volta ao caminho seguro. O recurso só é alocado entre 1,8 e 4,5 milhões de pixels.
2. **Mantido:** omitir o desenho do céu quando a imagem de fundo cobre integralmente o viewport com pixels opacos. Verificado que a imagem `forest.webp` tem 2.073.600 pixels totalmente opacos. O resultado visual do atalho é idêntico nos casos controlados.
3. **Mantido:** não invalidar o cache pelo tom do céu escondido quando o fundo é 100% opaco. A cor da camada superior continua animada, sem alterar sprites ou movimentação.
4. **Descartado:** duas camadas DOM Canvas. Apesar de economizar cerca de 0,8–1,4 ms por quadro no render isolado, não apresentou melhoria nativa consistente e aumentou a memória; em alguns testes piorou substancialmente o FPS.
5. **Descartado:** desenhar todo o fundo diretamente em cada quadro da primeira transição como substituição definitiva às oito faixas. Nas repetições A/B, alternou resultados com a ordem de execução: não há ganho consistente comprovado. Nenhum desvio visual foi observado no instantâneo final, mas faltaria validação temporal suficiente para substituir o método aprovado.

## Evidência já obtida

Uma dupla de voos completos na mesma execução (Chromium/SwiftShader) melhorou **58,69 → 59,77 FPS**, reduziu **40 → 5** quadros acima de 33 ms e **P99 33,3 → 16,8 ms** quando a sincronização de faixas foi ativada, mantendo os elementos visuais.

A adição de otimizações de céu/cache produziu resultados mistos em voos completos. Elas são mantidas por justificativa de composição e correção visual, mas seu ganho médio de FPS não deve ser presumido; o teste final pareado compara todos os recursos ativados/desativados no mesmo código.

## Validação obrigatória

- `npm test`, `npm run build`, e CSS compilado sem alterações;
- Testes de sprites, cobra com paridade de pixels, predadores, colisões, jornadas, HUD, acessibilidade e qualidade automática;
- Teste de fallback de transição com readback normal, bloqueado e lento;
- Comparação temporal entre todos os estágios, em desktop e celular, verificando saltos visuais;
- Comparação A/B de céu opaco e de rasterização por faixas;
- Voos completos com `requestAnimationFrame` nativo nas quatro fases, acompanhando FPS, P95, P99, quadros >33ms e >50ms;
- Teste final no aparelho real antes de declarar 60 FPS garantidos.

**Não realizar merge na `main` até validar resultados.** Nenhum critério autoriza apagar testes ou sacrificar imagens para obter artificialmente mais FPS.
