# Diagnóstico controlado — Mata fragmentada, cobra e composição Canvas

Data: 03/11/2026. Ambiente: GitHub Actions `ubuntu-24.04`, Chromium 151
com rasterização de software/SwiftShader, viewport CSS 1440×960 e canvas interno
2449×1632 (aproximadamente 4 milhões de pixels).

## Principais observações

O benchmark original de métodos (`benchmark:hotspots`) por vezes atribuía
17–25 ms à chamada `Renderer.snake()`. Isso **não prova** que toda essa espera
seja trabalho exclusivo da cobra: comandos Canvas podem ficar pendentes e
ser sincronizados em uma chamada posterior.

Criamos, portanto, medições independentes com `getImageData(0,0,1,1)`
após o desenho, comparando as peças separadamente no **mesmo navegador**.

### A/B de componentes (uma das execuções, valores medianos/P95)

| Componente | Mediana | P95 |
| --- | ---: | ---: |
| Fundo da Mata fragmentada | 10,8 ms | 13,4 ms |
| Cobra animada isolada | 1,4 ms | 1,7 ms |
| Dois troncos | 0,6 ms | 0,7 ms |
| Gavião | 0,3 ms | 0,9 ms |
| Itens | 0,5 ms | 0,9 ms |
| Papagaio | 0,3 ms | 0,4 ms |
| Cena completa | 15,4 ms | 16,2 ms |

Uma segunda execução em runner diferente apresentou custos absolutos maiores
(fundo ~14,6 ms, cobra ~1,9 ms, cena completa ~19,7 ms), mas manteve a mesma
ordem de prioridade. Os valores **não são aditivos**, pois dependem da
composição e de quando o navegador conclui a rasterização.

### Passagens do fundo (ablação **somente no benchmark**)

| Passagem desativada no benchmark | Média |
| --- | ---: |
| Nenhuma, fundo completo | 14,7 ms |
| Imagem grande da floresta | 4,8 ms |
| Parallax de árvores | 13,1 ms |
| Cópia da camada de céu | 13,7 ms |
| Névoa | 14,4 ms |
| Raios solares | 14,2 ms |
| Tonalização | 14,7 ms |

Esses resultados apontam para a **composição da imagem principal da floresta
ampliada e translúcida** como o candidato de maior impacto. As ablações não
são equivalentes a otimizações: os elementos são restaurados na experiência
normal e nenhuma supressão visual foi proposta para produção.

### Cobra: manter a arte atual

O renderizador preserva corpo e cabeça contínuos, movimento do bote, recuo,
colisão e textura. Foi testada uma variação que restringia a região do atlas
lida por cada triângulo da malha. Ela preservou **todos os pixels** em
56 poses/casos por viewport (desktop e mobile), mas a comparação pareada
apresentou medianas praticamente idênticas entre original e candidato.
**A alteração foi revertida**, sem mudar a cobra que o jogador vê.
Não há fundamento para redesenhar ou eliminar seus detalhes agora.

### Canvas opaco e limpeza de quadros (experimentos rejeitados)

- Canvas com atributo `alpha:false`: alterou valores de pixels da cena
  e não trouxe benefício; não foi integrado.
- Pular `clearRect` inicial, pois o céu cobre toda a tela: 144 comparações
  sem qualquer pixel diferente, mas média pareada de **24,33 vs 24,32 ms**;
  ganho insuficiente para justificar a alteração, que também não foi integrada.

## Próxima prioridade

Projetar e comparar uma técnica de composição mais econômica para a **imagem
principal da floresta**, incluindo reamostragem/cópia, transparência e
deslocamento por vento, mantendo nitidez e movimento. Exigir:
1. comparação visual nas quatro fases, transições e telas mobile/desktop;
2. benchmark A/B pareado com mesmos quadros e carga, seguido por voo real;
3. testes em Android e iPhone físicos com o painel `?perf-test=1`;
4. ausência de regressão de cobra, gavião, parallax, pontuação e controles;
5. **nenhuma mudança** no DPR Automático até comprovação de margem real.

## Comandos

```sh
npm run test:snake-raster-parity
npm run benchmark:snake-mesh
PERF_ISOLATE=1 PERF_SECONDS=4 npm run benchmark:hotspots
npm run benchmark:render-parts
npm run benchmark:background-passes
```

O benchmark exige servidor local e Chromium instalado pelo Playwright. Os
tempos de GPU/CPU em software não representam taxas de FPS garantidas em
aparelhos físicos.
