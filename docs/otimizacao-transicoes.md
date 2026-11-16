# Otimização P03 — transições de estação, composição e picos de quadros

## Problema observado

Após a integração dos PRs #36 e #37, os trechos estabilizados ficaram
substancialmente mais leves, mas as transições para os estágios 2 e 3 ainda
reprocessavam uma imagem WebP grande, com gradientes, deslocamento da brisa e
transparências. No voo de referência, o modo Alto registrou aproximadamente
29,6 FPS durante a transição 1→2 e 24,8 FPS em 2→3 em Chromium/SwiftShader.
A média geral não explica esses picos, portanto a medição separa estados
`stageAge < 4` (transição) e `stageAge >= 4` (estabilizado).

## Correção proposta no PR #38

- Mesma imagem da floresta, paletas de estações e **todos os efeitos dinâmicos**;
  cobra, papagaio, gavião, neblina, parallax, vaga-lumes, física e HUD intactos.
- Amostragem apenas do blend da **camada de fundo** em 1/64 de etapa; os efeitos
  sobrepostos e o tempo do jogo avançam continuamente.
- Para cenários grandes (1,8–4,5 milhões de pixels), duas superfícies opacas:
  a superfície anterior completa é apresentada enquanto a seguinte é
  composta **em oito faixas horizontais**, uma por quadro. Nunca exibimos
  uma imagem parcialmente atualizada. As faixas cobrem pixels físicos inteiros,
  sem alterar dimensões ou resolução.
- Uma leitura de **um único pixel no buffer oculto** sincroniza cada faixa com
  o rasterizador antes da troca, evitando concentrar todos os comandos
  pendentes no quadro de publicação.
- Em canvases menores, preserva-se o cache simples, sem reservar uma segunda
  superfície. O pico de memória incremental, em canvas de ~4 MP, é de
  aproximadamente **16 MB** para o segundo buffer RGBA.
- Se dois readbacks consecutivos custarem mais de 18 ms cada, ou forem
  indisponíveis, o caminho incremental é desativado para a sessão e o
  renderizador retorna ao desenho seguro anterior. Os dois buffers são
  liberados ao redimensionar.
- A configuração Automático/Alto/Baixo, seu DPR, critérios de recalibração,
  controles, animações e colisões não foram modificados.

## Resultados de bancada — um navegador, dados pareados

Chromium/SwiftShader, viewport CSS 1440×960, aproximadamente quatro milhões
de pixels físicos, cena inteira com encontro. A/B alternado no mesmo processo
com readback idêntico ao final de cada cena:

| Transição | Tempo médio original | Tempo médio candidato | P95 original | P95 candidato |
|---|---:|---:|---:|---:|
| Estágio 1 | 20,28 ms | 13,39 ms | 27,3 ms | 22,9 ms |
| Estágio 2 | 44,08 ms | 14,88 ms | 46,5 ms | 15,9 ms |
| Estágio 3 | 42,81 ms | 14,56 ms | 45,3 ms | 15,5 ms |

Os ensaios de **8 faixas com sincronização** produziram zero amostras
acima de 33,3 ms nos estágios 2 e 3 desse A/B.
São **tempos de renderização sincronizada**, não quadros por segundo de um
telefone físico. Não se devem comparar FPS de diferentes runners como se
fossem experimento controlado.

### Qualidade

A reconstrução por faixas produziu pixels idênticos aos da composição integral
no protótipo de teste por recorte; as diferenças restantes decorrem da
amostragem temporal da luz/brisa. Nas três viewports examinadas, o pior erro
médio estático ficou em torno de 0,61 numa escala de 0–255 por canal.
Os controles fora da transição permaneceram sem diferença de pixels.
O teste também compara amostras **enquanto a transição está em movimento**
para detectar saltos e ghosting, e verifica que as superfícies são trocadas
apenas após a conclusão da oitava faixa.

## Riscos e critérios de integração

1. **GPU móvel**: `getImageData` pode causar sincronização cara e
   transferência GPU→CPU; os resultados do Chromium/SwiftShader não
   comprovam ganho em Android ou Safari iOS. O fallback automático limita
   danos, mas exige testes físicos antes de ampliar o DPR Automático.
2. **Memória**: medição de utilização e eventuais descartes dos buffers
   devem ser observados em dispositivos com pouca RAM.
3. **Fidelidade temporal**: as transições mantêm aparência e animações,
   mas a camada base é atualizada por instantâneos completos. Inspecionar
   visualmente a brisa nas mudanças de estação, com captura de vídeo 60 FPS.
4. **Regressões**: só mesclar após `Validate game` (jornadas, responsividade,
   cobra e regressão visual), comparação A/B com limites de pixels e P95/P99,
   e voos de 120 segundos em Alto e Automático.
5. **Meta final**: manter o objetivo de 60 FPS sem eliminar efeitos;
   apenas depois de validação repetida no aparelho aumentar a resolução
   automática.

## Execução

```sh
# Com Node 22, npm ci e Chromium instalado:
python3 -m http.server 5501 --bind 127.0.0.1 --directory Chaua-Educa-main
# Em outro terminal:
node scripts/benchmark-transition-composite.cjs
node scripts/benchmark-transition-tiles.cjs
node tests/browser-transition-fallback.cjs
LONG_SECONDS=120 LONG_MODE=high npm run benchmark:long-flight
LONG_SECONDS=120 LONG_MODE=auto npm run benchmark:long-flight
```

No próprio celular: acessar o jogo publicado com `?perf-test=1`, testar
Automático/Alto/Baixo três vezes cada e exportar os relatórios. Não há
coleta remota ou modificação permanente de qualidade por esse painel.
