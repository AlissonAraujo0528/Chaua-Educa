# A07/P03 — atualizações incrementais do HUD

## Resultado e limite

Esta entrega reduz trabalho de interface durante o voo. Não conclui a meta
de 60 FPS: nos testes automatizados, a taxa de apresentação ficou praticamente
igual. A rasterização do cenário continua dominando o custo total.

Três pares de sessões de oito segundos, com ordem alternada, mesmo trecho,
qualidade Alta e mesma semente:

| Métrica — mediana das três sessões | Antes | Depois |
| --- | ---: | ---: |
| Recálculos de layout | 252 | 21 |
| Mutações observadas dentro do HUD | 678 | 165 |
| Recálculos de estilo | 254 | 261 |
| Taxa de apresentação | 30,9 FPS | 31,8 FPS |
| Intervalo entre quadros p95 | 50 ms | 50 ms |

A redução medida foi de aproximadamente **92% em layouts** e **76% em
mutações**. Não há evidência de ganho expressivo de FPS nessa comparação.
A transformação animada continua exigindo atualizações de estilo/composição;
não se deve confundir isso com o recálculo de geometria que foi reduzido.

Os valores individuais estão em [hud-amostras.json](hud-amostras.json).

## Mudança

- A barra de jornada usa largura fixa e animação por scaleX, preservando a
  duração de 0,3 segundo, o valor acessível e a preferência de movimento reduzido.
- O progresso lógico é guardado separadamente da serialização CSS. Assim,
  porcentagens fracionárias não provocam uma escrita repetida quando o estilo
  é serializado com precisão diferente.
- Textos, atributos ARIA, classes e valores nativos só são escritos quando mudam.
- Referências aos elementos fixos do HUD são reutilizadas. Elementos dinâmicos
  da Chauapédia e dos demais diálogos continuam fora desse cache.
- A duplicação de aria-valuenow foi eliminada.
- As atualizações continuam respeitando a cadência existente de cerca de 80 ms
  e as mudanças de estado da partida.

Nenhuma imagem, sprite, resolução, efeito do cenário, física, encontro ou regra
de pontuação foi alterada. O renderizador desta base é o do PR #27.

## Validação

O novo comando npm run test:hud verifica, em desktop e celular:

1. Atualização de pontos, trecho, destino, escudo, poderes e energia.
2. Zero reescritas no HUD durante trinta atualizações com estado pausado e
   progresso fracionário inalterados.
3. Geometria da barra em 0%, 25%, 50% e 100%, sem largura inline variável.
4. Valores e rótulos acessíveis da jornada e do treino.
5. Remoção das classes/legendas de poderes ao encerrar seus efeitos.
6. Animação por transform no modo normal.
7. Retorno ao início e novo treino, sem dados visuais antigos.

O teste usa o loop real e os elementos da página. Os valores controlados da
partida são apenas uma fixture de validação da interface. As suítes de jornada
e interface existentes cobrem os fluxos reais de entrada, pausa, quiz, derrota,
vitória e reinício.

Executar, com o servidor do jogo ativo:

```sh
npm run test:hud
npm run test:browser
npm run test:journey
```

CHROMIUM_PATH permite selecionar um navegador já instalado; GAME_URL permite
apontar os testes para outro servidor. O teste do HUD foi adicionado ao CI.

## Método de medição

Base anterior: b2fe1a0ccc440122321f633ac4ea9e0c14f66572, correspondente ao PR #27.
O caminho anterior foi servido com seus arquivos script.js e style.css originais;
os demais arquivos, inclusive o renderizador, foram iguais nos dois caminhos.

Ambiente: Chromium headless 134.0.6998.35, viewport 1440 × 960, DPR solicitado 2
e qualidade manual Alta. O diagnóstico do navegador identificou SwiftShader e
rasterização/composição por software, sem aceleração de canvas por GPU real.

A partida foi iniciada normalmente e posicionada num trecho da Mata fragmentada
com semente 104, tempo de voo 35 s e distância 15000. Após um segundo de
aquecimento, cada captura durou cerca de oito segundos. Uma pilotagem automática
usou comandos reais, sem desativar colisões. Perguntas foram adiadas somente no
instrumento de perfil para obter voo contínuo. Todas as sessões terminaram em
voo, sem erros JavaScript capturados.

Os contadores de layout e estilo vieram de Performance.getMetrics. As mutações
foram observadas no elemento HUD e os intervalos, no requestAnimationFrame real.
A instrumentação foi igual nos dois caminhos e não integra o build publicado.

Para repetir a avaliação, comparar a base indicada com este commit usando a
mesma semente, enquadramento e configurações; registrar separadamente tempo
ativo, layouts, estilos, mutações e distribuição dos intervalos. Não misturar
períodos de pausa/quiz com o voo ativo nem comparar execuções de aparelhos ou
sessões diferentes como se fossem pares equivalentes.

## Próximos critérios de desempenho

A meta de apresentação estável a 60 Hz no aparelho de referência permanece
aberta. O resultado headless não é uma previsão do desempenho de um celular.
Testes em hardware físico e sessões prolongadas continuam necessários.

A redução de layouts ajuda a margem de CPU, mas o próximo perfil deve continuar
avaliando o custo de desenhar/compor a cena. Não acrescentar clima ou novas
animações até haver orçamento demonstrado.

Rollback: reverter script.js e o SCSS/CSS correspondente restaura o HUD anterior.
Não há migração de dados, ranking ou preferências.
