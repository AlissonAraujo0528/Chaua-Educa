# Chauá Educa — correção v1.0.12.1 (trovões)

Branch: `preparacao-para-a-versao-2.0`. Esta correção não é um merge para a main.

## Correções
- Relâmpagos e áudio agora usam um único calendário determinístico de descargas, com intervalos variáveis (aproximadamente 3,35–4,65 segundos) e variação discreta de tom/intensidade.
- O buffer procedural de 2,8 s é pré-gerado em blocos de 2.048 amostras de 24 kHz após a primeira interação sonora; a geração total deixa de bloquear um quadro de voo.
- No caso raro em que o primeiro relâmpago ocorre antes da conclusão da pré-geração, o ruído grave ambiental permanece disponível sem processar o buffer inteiro no RAF.
- Reiniciar, continuar de checkpoint ou iniciar treinamento reinicia a identidade do último trovão. O buffer pronto é reutilizado.
- O clima visual selecionado no menu não causa trovões sem relâmpagos: sons de descargas só ocorrem durante o voo e a aproximação final.
- Pausa, pergunta, silêncio, perda de foco e encerramento interrompem os estrondos em reprodução com atenuação curta.
- O desenho do raio mantém sua forma fixa dentro de cada descarga em vez de variar os segmentos a cada quadro.

## Garantias e validação
- Sem novas imagens ou sons baixados; mantém o áudio procedural e a escolha de clima apenas visual.
- Testes adicionados: `tests/thunder-1121.test.mjs`, executado por `npm test`.
- Teste auditivo em navegadores e medição de FPS em dispositivos reais ainda são necessários para homologação.

Nota de versão: `1.0.12.1` é o identificador de correção do jogo; o campo `version` do pacote npm permanece `1.0.11`, pois npm exige SemVer de três componentes.
