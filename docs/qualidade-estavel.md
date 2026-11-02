# Qualidade automática estável durante o voo

## Problema e política

Quadros rápidos no perfil Baixa não demonstram que o custo de Alta cabe novamente
no aparelho. A recuperação após 12 segundos gerava um ciclo: Alta lenta → Baixa
rápida → Alta lenta. Um cenário de três minutos com 30 FPS em Alta e 60 FPS em
Baixa reproduziu 25 transições antes da correção.

O modo Automático continua medindo uma janela móvel de dois segundos. Quando
pelo menos 35% desse tempo ocorre em quadros acima de 1/42 segundo, reduz para
Baixa. Depois disso mantém Baixa até o fim daquele voo. Uma nova partida,
reinício ou treino inicia outra avaliação em Alta, durante a contagem inicial.
Selecionar Automático explicitamente também permite reavaliar. Alta e Baixa
manuais são preservadas entre partidas.

Pausa, retomada, mudança de tamanho e amostras inválidas não autorizam um retorno
automático a Alta. O benefício é evitar tentativas caras no meio da partida; o
custo é manter Baixa até outro voo mesmo se a carga externa desaparecer.

## Validação em 02/11/2026

- Regressão de três minutos: 25 transições antes; uma redução depois.
- Testes de amostras mistas, atrasos isolados, inatividade, troca explícita de
  modo, partidas novas e monitores de 60 a 240 Hz.
- Chromium: interface real com pausa, retomada e novas partidas nos três modos;
  cenário adicional de 40 segundos com requestAnimationFrame nativo e desenho
  real, adicionando carga somente a Alta para reproduzir o defeito no CI.
- Voo protegido de treino de 180 segundos, sem carga artificial, com renderização
  real em viewport de 1440 × 960 e DPR 2: **59,38 FPS médios**, intervalo p95
  **16,8 ms**, uma redução para Baixa, nenhum retorno a Alta e nenhum erro JS.
  O maior intervalo foi 100,1 ms: ainda existem atrasos pontuais. O canvas após
  adaptação ficou em 1440 × 960. Chromium 134 headless, ambiente com SwiftShader.

O voo protegido mantém a sessão ativa para medir o controlador; não substitui
uma jornada completa com todos os encontros. FPS neste ambiente não garante
60 FPS em aparelhos físicos. Esta etapa não altera orçamento de pixels,
animações, assets, física ou pontuação. A otimização do orçamento de renderização
e a validação em Android/iOS permanecem etapas seguintes.
