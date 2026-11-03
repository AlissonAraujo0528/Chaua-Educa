# Changelog

## Não lançado

### Corrigido

- A qualidade visual automática agora reconhece quadros rápidos e lentos
  alternados e travamentos recorrentes acima de 100 ms durante o voo.
  Antes, um quadro rápido ou um atraso longo apagava a evidência de lentidão.
- A decisão usa uma janela móvel de dois segundos: se pelo menos 35% desse
  tempo estiver em quadros acima de 1/42 s, reduz a qualidade. Um atraso isolado
  não provoca a redução. Os intervalos são limitados a 250 ms, como no loop.
- Após uma redução automática, a qualidade permanece reduzida durante o voo.
  Uma nova partida ou a seleção explícita de Automático permite reavaliar Alta.
  Pausa, inatividade e amostras inválidas limpam a medição sem elevar a qualidade;
  as escolhas manuais Alta e Baixa permanecem respeitadas entre partidas.

### Validação

- Regressões de lógica para lentidão mista, atrasos isolados, expiração da
  janela, inatividade, novos voos, escolhas manuais e telas de 60–240 Hz.
- `npm run test:quality` exercita o loop real, a resolução do canvas, as
  configurações, pausa/retomada e movimento reduzido no Chromium. Incluído no CI.
- A02/P02 do plano de evolução. Esta correção altera somente a adaptação visual;
  não muda física, encontros, pontuação, assets ou versão das regras.
- Validação física em Android/iOS continua pendente; os testes automatizados
  não demonstram ausência de stutters em todos os aparelhos.

O histórico das versões anteriores está no [README](README.md).
