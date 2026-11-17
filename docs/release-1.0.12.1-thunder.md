# Chauá Educa — v1.0.12.1 · trovões reais (revisão de áudio)

Branch: `preparacao-para-a-versao-2.0`. Sem merge automático para `main`.

## Fonte e licença
- **BigSoundBank Thunder #3 (ID 3114)**: https://bigsoundbank.com/thunder-3-s3114.html
- **BigSoundBank Thunder #5 (ID 3116)**: https://bigsoundbank.com/thunder-5-s3116.html
- Licença indicada na fonte: CC0. Arquivos originais fornecidos pelo usuário.
- Dois uploads de Thunder #5 eram idênticos (mesmo SHA-256); apenas uma cópia foi utilizada.

## Processamento
`Chaua-Educa-main/sounds/thunder-real.mp3` é um pacote mono MP3 de 24 kHz / 24 kbps, cerca de 16,8 KB. Foi editado a partir de dois trechos reais:
- **Próximo:** 0–2,50 s de áudio, vindo de Thunder #3 (original cortado em 1,20–3,70 s).
- **Distante:** 2,62–5,47 s, vindo de Thunder #5 (original cortado em 1,05–3,90 s).
- Há 0,12 s de silêncio entre trechos. Ambas as gravações receberam fades curtos de entrada/saída e ajuste moderado de ganho.
- MP3 decodificado uma vez após a interação do usuário e reutilizado em memória. O carregamento é assíncrono e não está no RAF.

## Comportamento
- O controlador `lightning.mjs` continua sendo a fonte única dos momentos de descarga visual e sonora.
- Trovão próximo toca com atraso de 0,12 s; distante, 0,40 s. Três padrões determinísticos usam essas duas gravações para alternar as descargas.
- O processamento antigo de estalos elétricos, onda de choque e rugido procedural foi removido.
- Pausar, abrir quiz, silenciar ou perder foco interrompe a fonte atual com fade breve; reiniciar libera o mesmo índice para uma nova tentativa.
- Caso o arquivo falhe ao carregar, o evento permanece silencioso, sem recorrer ao antigo chiado sintetizado.
- O arquivo está pré-carregado como recurso do Pages e consta da auditoria offline de release.

## Validação
`npm test` inclui `tests/thunder-1121.test.mjs`. O áudio deve ser conferido com fones e alto-falantes reais no navegador antes da homologação definitiva.

## Revisão de durações e iluminação de cena
- **Curto / próximo:** 1,30 s de gravação, começa 0,12 s após o relâmpago.
- **Intermediário:** 2,75 s de gravação, começa 0,32 s após o relâmpago.
- **Prolongado / distante:** 5,43 s, com os dois trechos reais preservados, começa 0,54 s após o relâmpago.
- Os intervalos de fonte variam discretamente com o playbackRate determinístico (aprox. 0,89–1,10). Portanto os três tempos são distintos mas não valores cronométricos fixos no alto-falante.
- O prolongado é formado pelos dois estrondos reais já agrupados no pacote; ainda não é uma terceira gravação independente.
- O brilho agora ocorre na camada do céu **e** sobre a cena já desenhada (árvores, Chauá e efeitos climáticos) com composição `screen`; os avisos do jogo são desenhados depois, sem perda de legibilidade.
- A preferência por movimento reduzido continua suprimindo clarões visuais, mas não impede o som.
- Foram adicionados testes para durações distintas e iluminação em tela inteira.
