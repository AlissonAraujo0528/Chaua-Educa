# Correções V2.1 e medição sazonal

Base: 310e0a0 (inclui o servidor de desenvolvimento sem cache enviado pelo autor).

## Regras

1.000 pontos liberam o abrigo. Distância sozinha não vence nem encerra a oferta de obstáculos/frutas. A aproximação aguarda a rota livre e o alinhamento com o bando. O indicador de progresso usa pontuação. Os testes de navegação sem coleta verificam os quatro trechos; os testes completos de navegador continuam até 1.000 pontos e pouso real.

Aventura mantém gap-base 150 e mínimo-base 115. Padrões têm bônus próprios e encontros com cobras acrescentam folga; 150 não é limite absoluto de toda abertura.

## Correções

- Hitboxes do gavião calibradas para cabeça e peito da arte de 280 unidades, com geometria separada para o atlas legado e região de busca de contato compatível. Movimento reduzido mantém a mesma família de arte.
- Tronco frágil destruído deixa de ser usado para reposicionar o papagaio na animação de derrota. O lado oposto permanece sólido.
- Guia atualizado para descrever madeira quebrável e requisito do abrigo.
- Benchmark adicional usa `Renderer.game` com cenas sazonais reais e gavião, frutas e árvores. O benchmark antigo continua cobrindo o renderizador legado, identificado como tal.

## Fluidez e qualidade

O próximo fundo sazonal é preparado antecipadamente em faixas de 96 pixels. Mantém até duas superfícies sazonais e descarta dados ao redimensionar. Não exibe arte parcialmente preparada. Comparação em 1366×638 e 390×844 encontrou diferença máxima de **0** entre os pixels amostrados da versão antecipada e direta, incluindo transições intermediárias.

O gavião interpola as poses com pesos suaves e composição aditiva em transparência, preservando a opacidade do corpo. Buffers são reutilizados por tamanho; o maior evita cortar a arte ampliada. A resolução do compositor acompanha a resolução útil do sprite-fonte.

## Medições

Chromium headless, perfil alto, quatro transições, 180 quadros por transição e resolução. Sem leitura de pixels dentro da seção cronometrada. Tempo de CPU de emissão de desenho não equivale ao tempo completo de GPU/apresentação. Arquivos JSON são amostras únicas, não garantia para qualquer aparelho.

| Configuração | P95 de CPU por cena | P95 do intervalo de quadros |
| --- | --- | --- |
| `before.json`: antes da interpolação | 0,3–0,5 ms | 16,7–16,8 ms |
| `after.json`: primeira implementação suave | 2,1–2,4 ms | 16,7–16,8 ms |
| `optimized.json`: compositor dimensionado à arte e preparação antecipada | 1,1–1,2 ms | 16,7–16,8 ms |

A interpolação acrescenta trabalho em relação aos sprites sem transição. A otimização reduz aproximadamente pela metade o P95 dessa primeira versão suave, mantendo a interpolação. Na versão otimizada ocorreu **um intervalo acima de 33,34 ms por resolução**, no primeiro bloco; os demais três blocos não tiveram intervalos acima desse limite. Portanto, não se afirma ausência absoluta de stutters nem 60 FPS constantes em hardware físico.

## Validação funcional

- Build e testes unitários (incluindo limiar 999/1000, continuidade de poses, pré-carregamento e ausência de contato com tronco destruído).
- Smoke desktop/toque, cinco layouts, HUD por pontos, clima/árvores, colisão/frutas da cobra e continuidade da cobra.
- Jornadas completas: Aventura 1.000 pontos em 783,9 segundos simulados; Amigável 1.002 pontos em 794,3 segundos simulados. Piloto automatizado conservador, não estimativa de duração para todos os jogadores.
- Preservado o servidor de desenvolvimento sem cache da atualização 310e0a0.
