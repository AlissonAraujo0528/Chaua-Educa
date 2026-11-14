# Preparação para a Versão 2.0

Branch de trabalho: `preparacao-para-a-versao-2.0`.

Os incrementos desta preparação começam em **1.0.1**, seguindo 1.0.2, 1.0.3 e seguintes. A identificação **2.0.0** fica reservada ao lançamento aprovado. O histórico técnico anterior é preservado no Git. Para atualizar pacote, lockfile e identificação visível conjuntamente, usar `node scripts/set-game-version.mjs NUMERO`.

## 1.0.1 — campanha e identificação da preparação

- Rotas de 140.000 unidades no Desafio e 84.000 no Amigável, proporcionais às velocidades dos modos, com alvo de cerca de seis minutos de voo ativo.
- A curva de pressão do Desafio atinge sua fase final dentro da nova duração de campanha, mantendo seus limites seguros.
- Os quatro capítulos avançam pelo percurso. A barra mostra caminho percorrido, independentemente dos pontos.
- Concluir o percurso libera o abrigo, após limpar ameaças e responder eventual pergunta pendente. O pouso continua exigindo alinhamento com o bando.
- Os 1.000 pontos passam a valer uma medalha opcional; não antecipam nem bloqueiam a chegada.
- Depois de uma investida do gavião, há uma passagem central ampla antes de voltar aos encontros estreitos, permitindo recuperar a trajetória.
- As estações continuam graduais e baseadas no tempo de voo, com referência planejada de seis minutos. Pausas e perguntas congelam esse relógio; a cobertura de neve continua progressiva.
- Movimento reduzido suprime também o clarão em tela inteira durante tempestades.
- A tela Sobre o projeto identifica a versão da preparação.
- O planejamento de transições reserva 230 unidades de afastamento no Desafio; os percursos completos incluem verificações sem poderes e com reação programada de 120 ms.
- Regras de ranking `floresta-v12`. Registros v11 e anteriores permanecem no Histórico; missões e descobertas mantêm suas identidades.

A meta de duração vem do modelo físico e de pilotos automatizados. A avaliação com pessoas e a medição de desempenho em aparelhos físicos ainda fazem parte da preparação; esta versão não certifica a 2.0 pública.

## Verificação da 1.0.1

307 testes de lógica aprovados localmente, incluindo 80 percursos completos sem poderes e 24 trajetos com reação programada de 120 ms. As oito sementes de calibração completaram a nova campanha em aproximadamente 339–355 segundos de voo ativo, com pontuações abaixo de 1.000, comprovando que a medalha não bloqueia o pouso. Esses são pilotos automatizados, não taxas de vitória ou durações medidas com pessoas. Build Sass e integridade dos atlas também são verificados. Os resultados de navegador estão no CI do PR de preparação.

## Próximos incrementos

1. Polimento temporal dos três botes: intermediários registrados e recuperação contínua, sem duplicação de anatomia. Regerar máscaras e contatos climáticos da arte final.
2. Ampliar a validação de reação em aparelhos físicos. A 1.0.1 já exercita aviso, marcação e contato com velocidades e turbo atuais, sem a antiga hipótese fixa de 350 unidades/s.
3. Evoluir tutorial, descobertas por capítulo, missões e apresentação educativa; preservar fontes rastreáveis e a separação entre jogo e biologia.
4. Medir e otimizar carga inicial, memória, caches e fluidez com a arte final.
5. Validar release candidate em navegadores e aparelhos físicos, com participantes iniciantes e educadores.
6. Publicar a 2.0 no endereço canônico após aprovação e verificação da revisão efetivamente servida.

Cada incremento deve remover seus arquivos e consumidores descartados na mesma alteração. Fontes necessárias à reprodução da arte ativa permanecem; backups de artes substituídas não entram na pasta publicada.

## Integração

A branch parte do commit `79190a4` do PR #77, conservando os três botes e as três investidas do predador. A main e o endereço público não são atualizados automaticamente durante os incrementos de preparação. O PR de preparação funciona como integração revisável até o lançamento.
