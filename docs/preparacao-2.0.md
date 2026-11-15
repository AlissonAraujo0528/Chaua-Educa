# Preparação para a Versão 2.0

Branch de trabalho: `preparacao-para-a-versao-2.0`.

Os incrementos desta preparação começam em **1.0.1**, seguindo 1.0.2, 1.0.3 e seguintes. A identificação **2.0.0** fica reservada ao lançamento aprovado. O histórico técnico anterior é preservado no Git. Para atualizar pacote, lockfile e identificação visível conjuntamente, usar `node scripts/set-game-version.mjs NUMERO`.

## 1.0.2 — botes e geometria atual de contato

- Recuperação frontal com 11 poses intactas; bote alto e varredura com sete. O recolhimento percorre os quadros de preparação em ordem inversa e termina na mesma pose de repouso, substituindo o salto de apenas dois quadros. Nenhuma cabeça, asa ou corpo adicional é sobreposto; as artes aprovadas permanecem intactas.
- Aviso do bote termina numa postura compatível com o começo de cada ataque. Tempos de preparação, ataque e recuperação permanecem próprios de cada um dos três botes.
- Cabeça do chauá reposicionada sobre a cabeça da spritesheet atual; o antigo núcleo estava no pescoço. O núcleo do corpo e os perfis de voo/mergulho do gavião foram conferidos contra a transparência das artes atuais.
- Colisão e desenho compartilham inclinação, deslocamento das batidas de asas e oscilação. O voo com movimento reduzido usa uma pose estática da mesma spritesheet do chauá.
- Coleta por máscaras offline dos 48 quadros de alimentos e das penas de proteção/pontuação, acompanhando flutuação e pulsação. A pimenta desenhada por código tem um núcleo próprio que acompanha sua rotação. A antiga caixa genérica de coleta e o getter retangular do jogador foram removidos.
- Copa e chão consideram a extensão do corpo atual. Troncos mantêm o núcleo compartilhado de 110 unidades; galhos vivos, galhos secos e lados quebrados conservam seus estados físicos. Neve, folhas, brilho, asas, cauda e efeitos climáticos decorativos não ampliam a colisão dos pássaros/troncos.
- Reserva de transição do Desafio passa de 230 para 260 unidades para acomodar a cabeça real, mais adiantada. A progressão, os limites de velocidade e os três tipos de ataque permanecem; a segurança é exercitada por percursos completos, incluindo decisões a 30 Hz e reação de 120 ms.
- Regras `floresta-v13` arquivam os placares v12; missões e descobertas continuam preservadas.

### Proteção contra hitboxes desatualizadas

| Elemento | Referência verificada |
|---|---|
| Chauá | Oito poses de voo e pose estática de movimento reduzido; corpo/cabeça internos à arte |
| Gavião | Oito poses da ação e três poses ativas da arte de mergulho/voo reduzido; transformações compartilhadas |
| Cobra | Cinco atlas, 40 máscaras por quadro, escala e espelhamento do mesmo resolvedor usado no desenho |
| Troncos/galhos | Núcleo geométrico compartilhado com a renderização; integridade dos atlas base |
| Alimentos | 12 alimentos × quatro quadros; 16 × 16 células por quadro |
| Penas/pimenta | Máscaras das duas artes atuais e núcleo próprio do desenho vetorial |
| Chão/copa | Limites aplicados aos polígonos atuais do chauá |

`scripts/generate-collision-art.py --check` verifica assinaturas, núcleos dos pássaros e máscaras de coleta; `scripts/generate-snake-a2-masks.py --check` verifica as máscaras da cobra. O teste de navegador compara os núcleos com pixels efetivamente desenhados em 48 poses/configurações e as 12.800 células dos coletáveis com a transparência dos arquivos servidos. O teste existente da cobra continua comparando as 40.960 células de seus cinco atlas.

As máscaras são discretas: os alimentos têm células de aproximadamente quatro unidades de jogo e a cobra conserva as células conservadoras atuais (até aproximadamente 7,3 unidades no atlas de maior escala). Não se trata de colisão por pixel a cada frame. Não há leitura de pixels durante o voo. A avaliação com pessoas e em aparelhos físicos permanece pendente para o lançamento 2.0.

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

1. Validar o polimento dos três botes em aparelhos físicos, com atenção à leitura dos avisos e do recolhimento. A 1.0.2 usa poses intactas existentes e suas máscaras/contatos atuais, sem substituir a arte.
2. Ampliar a validação de reação em aparelhos físicos. A 1.0.1 já exercita aviso, marcação e contato com velocidades e turbo atuais, sem a antiga hipótese fixa de 350 unidades/s.
3. Evoluir tutorial, descobertas por capítulo, missões e apresentação educativa; preservar fontes rastreáveis e a separação entre jogo e biologia.
4. Medir e otimizar carga inicial, memória, caches e fluidez com a arte final.
5. Validar release candidate em navegadores e aparelhos físicos, com participantes iniciantes e educadores.
6. Publicar a 2.0 no endereço canônico após aprovação e verificação da revisão efetivamente servida.

Cada incremento deve remover seus arquivos e consumidores descartados na mesma alteração. Fontes necessárias à reprodução da arte ativa permanecem; backups de artes substituídas não entram na pasta publicada.

## Integração

A branch parte do commit `79190a4` do PR #77, conservando os três botes e as três investidas do predador. A main e o endereço público não são atualizados automaticamente durante os incrementos de preparação. O PR de preparação funciona como integração revisável até o lançamento.
