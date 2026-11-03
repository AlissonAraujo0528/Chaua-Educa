# A01/P01 — cache do céu na Mata fragmentada

## Escopo desta entrega

O trecho Mata fragmentada desenha a floresta com transparência. O céu e o
brilho solar atrás dela continuam visíveis e eram recalculados em todos os
quadros, mesmo depois do término da transição de cores.

O renderizador passa a preparar essa composição durante a contagem anterior ao
voo e a reaproveitá-la enquanto a paleta e a resolução forem as mesmas. A imagem
da floresta, sua deriva, névoa, parallax, raios, partículas e transições continuam
sendo desenhados pelos caminhos existentes.

Este é um incremento do pacote P01, não a conclusão de todas as otimizações
do cenário. Física, encontros, dificuldade, pontuação, sprites e regras v9
permanecem iguais. A correção da qualidade automática está em outro PR.

## Contrato do cache

- Uma superfície por renderizador, criada somente quando necessária.
- Dimensões iguais às do canvas principal; acompanha seu limite de quatro
  milhões de pixels. Estimativa máxima de 16 MB de pixels RGBA adicionais;
  não é uma medição da memória total do navegador.
- Cópia na resolução física, sem novo redimensionamento.
- Preparação na contagem, para evitar a primeira alocação ao entrar no trecho.
- Recriação quando mudam paleta, tamanho CSS ou DPR.
- Liberação da superfície anterior ao mudar a resolução ou orientação.
- Transições de cor continuam usando o desenho direto; o cache só é usado
  na parte estável do trecho translúcido.
- Alternativa com canvas HTML quando OffscreenCanvas não está disponível.
  No ambiente de testes sem ambos, mantém o desenho direto.

## Validação visual e funcional

`npm run test:background` compara pixels do caminho com cache e do desenho
direto no mesmo navegador. Abrange 1440 × 960, 390 × 844 e 844 × 390,
DPR solicitado 2, alta/baixa qualidade, os quatro trechos, transições,
deriva, menu, movimento reduzido, floresta ausente e alternativa HTML.

A execução local encontrou **zero diferenças de pixels**. O teste também
confirma preparação antes do voo, reutilização do cache, liberação em dez
alternâncias de tamanho e invalidação ao mudar a qualidade. Faz parte do CI.

As suítes existentes verificam adicionalmente animações, máscaras de cobra,
contato fatal, abrigo, interfaces e jornadas completas dos dois modos.

## Medições do jogo em execução

Comparação antes/depois no Chromium headless 134.0.6998.35, viewport
1440 × 960, DPR solicitado 2, qualidade alta, semente 104 e trecho intermediário
da Mata fragmentada. Três pares de sessões de oito segundos, alternando a
ordem. Os perfis usaram voo contínuo com pilotagem automatizada, sem desativar
colisões; as perguntas foram adiadas somente no instrumento de medição.
Todas as sessões permaneceram em voo e não registraram erros JavaScript.

| Métrica | Antes | Com cache |
| --- | ---: | ---: |
| Mediana da taxa de apresentação das três sessões | 20,2 FPS | 32,8 FPS |
| Mediana do intervalo p95 das três sessões | 66,7 ms | 33,4 ms |
| Quadros acima de 50 ms / quadros ativos capturados | 138 / 472 | 9 / 760 |

Esses números descrevem o ambiente e o trecho medidos. Não representam
garantia de desempenho num telefone físico, nem uma solução para todos os
stutters. A duração curta não substitui os testes prolongados previstos no
plano. A preparação do cache ocorre antes da captura aquecida; seu custo e o
primeiro desenho são expostos separadamente pelo benchmark abaixo.

## Reproduzir o benchmark do componente

Em um terminal, iniciar o servidor:

```sh
npm ci
npx playwright install chromium
npm start
```

Em outro terminal:

```sh
npm run test:background
npm run benchmark:background
```

GAME_URL permite usar outro endereço local; CHROMIUM_PATH permite selecionar
um navegador já instalado. O benchmark grava
`test-results/background/benchmark.json`, sem entrar no build publicado.

O benchmark usa três pares por cenário, alternando a ordem, quatro segundos
por sessão e meio segundo inicial fora da amostra estável. Inclui:

- Trecho translúcido em desktop.
- Trecho translúcido em tela móvel.
- Trecho opaco de controle, onde não se espera ganho dessa otimização.

Uma leitura de pixel igual nos dois caminhos força a conclusão da rasterização.
Por isso, seus tempos não devem ser apresentados como previsão de FPS do jogo
inteiro. São registrados custo de preparação, primeiro desenho, mediana/p95 de
desenho, intervalos entre quadros e estimativa dos pixels do cache.

O modo de referência desativa somente o cache. O teste funcional não depende
de um limite absoluto de FPS, que seria instável entre runners de CI.

Resultado local do benchmark reproduzível, mediana dos três pares após a
preparação na contagem:

| Cenário | Desenho mediano direto | Desenho mediano com cache |
| --- | ---: | ---: |
| Desktop, trecho translúcido | 42,3 ms | 24,9 ms |
| Tela móvel, trecho translúcido | 13,4 ms | 7,8 ms |
| Desktop, trecho opaco de controle | 25,3 ms | 25,0 ms |

O primeiro desenho do trecho em desktop ficou em 41,7 ms no caminho direto e
43,2 ms com cache. A preparação, que inclui desenho e recursos de início,
é registrada fora da amostra estável e ocorre durante a contagem. A tela móvel
permaneceu próxima de 60 FPS nos dois caminhos; o menor custo oferece margem,
não uma taxa acima da atualização da tela.

## Limites e próximos passos

A validação local usou o navegador disponível no ambiente; o CI também executa
a configuração do projeto. Android/iOS físicos permanecem pendentes.
Nenhuma resolução foi reduzida para produzir o ganho medido.

As demais oportunidades de P01 e os outros pacotes continuam separados:
parallax, camadas móveis, HUD, alocações, carregamento e efeitos ambientais.

Rollback: reverter a alteração do renderizador restaura o desenho direto.
Não há migração de progresso ou ranking.
