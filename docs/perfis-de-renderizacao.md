# Resolução e decoração independentes — etapa B.1

## Mudança

O renderizador usava `quality` tanto para o limite da resolução física do canvas
quanto para a quantidade de elementos decorativos. Agora essas decisões usam
`resolution` e `decoration` separadamente. Os limites de resolução estão em
`RESOLUTION_BUDGETS`, em `quality.mjs`.

| Preset existente | Resolução | Decoração |
| --- | --- | --- |
| Detalhada (`high`) | DPR máximo 2, até 4 milhões de pixels | Completa |
| Econômica (`low`) | DPR máximo 1, até 4 milhões de pixels | Reduzida |

`Renderer.setQuality(mode)` continua aplicando o preset completo. Mesmo após
uma experiência com uma combinação diferente, selecionar um preset restaura
ambos os controles. Os Ajustes e a preferência persistida não mudaram nesta etapa.
`Renderer.quality` identifica o último preset aplicado; para diagnosticar uma
combinação experimental, consultar `resolution` e `decoration` diretamente.

Para comparações internas:

```js
renderer.setVisualProfile({resolution:'low',decoration:'high'});
// Alterar somente a decoração preserva a resolução atual e não limpa o canvas.
renderer.setVisualProfile({decoration:'low'});
renderer.setQuality('high'); // restaura os dois controles
```

Resolução controla somente o tamanho do canvas, respeitando também DPR real e
limite de pixels. Decoração controla a névoa adicional, camadas decorativas de
parallax, pontos luminosos, borboletas, limite de partículas e folhas de vitória.
Não controla as poses ou os relógios do papagaio, predador e cobra, nem a física.
O fundo e os personagens ainda compartilham um canvas; não há camadas com
resoluções distintas nesta etapa.

## Verificação

`npm run test:render-profile` verifica desktop 1440×960, celular 390×844 e
paisagem 844×390, com DPR 2:

- pixels iguais entre cada preset e seus controles correspondentes, nos quatro
  trechos e com/sem movimento reduzido;
- os mesmos comandos de desenho e geometria ao alterar apenas a resolução,
  mantendo tanto decoração completa quanto reduzida;
- alteração de decoração sem redimensionar ou limpar o canvas;
- efeitos completos restaurados e simulação inalterada pelo desenho;
- restauração dos dois controles ao reaplicar um preset.

Também é possível comparar os pixels com o renderizador de uma revisão anterior:

```sh
git show 3db2a239ed14379bb03a975f9e4656a724e10568:Chaua-Educa-main/js/render.mjs > /tmp/render-before-profile.mjs
PROFILE_BASELINE_PATH=/tmp/render-before-profile.mjs npm run test:render-profile
```

Use a revisão correspondente à base testada: em uma integração com o cache do
PR #27, o renderizador de referência deve conter o mesmo cache.

## Medição reproduzível

Com o servidor do jogo já iniciado, executar:

```sh
node scripts/benchmark-render-profile.cjs > /tmp/render-profile-samples.json
```

O script compara as quatro combinações de resolução/decoração em três repetições,
alternando a ordem entre rodadas. Usa agendamento nativo de quadros, viewport
1440×960, DPR solicitado 2, um segundo de aquecimento e oito segundos de captura.
Registra tamanho efetivo, FPS, p95/p99 de intervalo, máximo, quadros acima de
50 ms e informações de GPU. `CHROMIUM_PATH` e `GAME_URL` são opcionais.

O cenário é um treino protegido no trecho Mata fragmentada, com fundo animado e
papagaio, sem encontros. Não substitui jornadas completas, aquecimento prolongado
ou testes físicos. A comparação mede o custo das combinações, não um ganho da
separação de controles: com os presets preservados, não há motivo para prometer
um aumento de FPS por esta refatoração sozinha.

O próximo incremento deverá escolher o orçamento visual com base nas medições e
comparações de nitidez. A arquitetura em camadas permanece uma investigação
separada, condicionada à apresentação final e ao uso de memória.

## Resultado local em 02/11/2026

Medições com esta mudança combinada temporariamente aos PRs #27/#28 e à correção
do #26, em Chromium headless 134.0.6998.35, SwiftShader e composição por software.
Medianas das três repetições descritas acima:

| Resolução interna | Decoração | Pixels | FPS | Intervalo p95 |
| --- | --- | ---: | ---: | ---: |
| Alta | Completa | 3.996.768 | 40,04 | 33,4 ms |
| Alta | Reduzida | 3.996.768 | 41,54 | 33,4 ms |
| Reduzida | Completa | 1.382.400 | 60,00 | 16,7 ms |
| Reduzida | Reduzida | 1.382.400 | 60,00 | 16,7 ms |

[Amostras individuais e ambiente](render-profile-samples.json).

As 12 sessões terminaram em `playing`, sem erros JavaScript. Neste trecho sem
encontros, reduzir apenas a resolução sustentou aproximadamente 60 FPS nas três
amostras curtas com decoração completa. Isso não demonstra estabilidade em uma
jornada prolongada nem autoriza aplicar universalmente esse orçamento.

Comparações com o renderizador anterior produziram zero diferenças de pixels
nos presets existentes, em 48 cenários por base (quatro trechos, dois presets,
duas opções de movimento e três viewports), tanto na base do #26 quanto na
integração com #27/#28. A densidade decorativa também permaneceu independente da
resolução nos testes de comandos de desenho. Os perfis disponíveis ao jogador
continuam iguais; o resultado é uma base de medição para o próximo incremento.
