# Correções fundamentadas nos relatos do Android — V2

Os relatórios locais enviados em 18/11/2026 mostram 3 partidas novas longas, FPS médios de 59,53, 59,10 e 59,32; 10 quadros acima de 33 ms em ~143 segundos. Em quatro picos, callbacks JavaScript consumiram ~34–42 ms: aos 10,37 s (sem cobras), 18,46 s (1 cobra), 31,12 s (2 cobras), e 45,51 s (1 cobra). Vários outros gaps de 33–50 ms ocorreram apesar de callbacks de ~1–5 ms. O relatório antigo em chuva marcava 43,78 FPS com 58 stutters, mas não é comparação A/B controlada.

## Esta revisão de diagnóstico

1. No voo comum e com coleta ativa, cinco checkpoints leves de `performance.now()` reaproveitam um único objeto por quadro; não abrem Canvas readback nem um novo RAF.
2. Quando um callback ultrapassa 18 ms, registra sua duração e separa física, HUD, áudio, interpolação, desenho Canvas e outros. Guarda no máximo os 50 piores e o total; não guarda nomes nem envia dados.
3. `?test-seed=1724079006` permite repetir a mesma semente sem mudar o jogo normal. A mesma semente aproxima os encontros; entradas e efeitos podem continuar divergindo, então não equivale a replay determinístico.
4. A alternativa com placas de texto continua selecionável em Ajustes, e `settings.textWarningsShownAtEnd` permanece no relatório.

## Observações e cautelas

- `drawMs` é tempo de chamada JavaScript/Canvas, NÃO tempo de GPU. RAF pode ficar lento quando CPU é baixa por compositor, GPU, energia/temperatura, atrasos de agendamento etc.
- O relato com 0 cobras e 42 ms de JavaScript refuta a hipótese de que *toda* a queda venha das mensagens. Apenas dados de spans distinguem as rotinas.
- Esta alteração não promete ganhos de FPS e não reduz qualidade de imagem. Não tocar nos sprites até haver evidência de qual render path é o gargalo. Não atribuir a regressão visual a uma causa sem medição.
- Testar no mesmo dispositivo, mesmo clima e configurações. Observar `longCallbacks.slowest[].breakdownMs` e `stutters[].visibleWarnings` para decidir o alvo da correção seguinte.
