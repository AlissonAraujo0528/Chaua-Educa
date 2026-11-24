# Chauá Educa 1.0.13 — neve pré-composta, Teste C

**Branch:** `preparacao-para-a-versao-2.0` — a `main` não foi alterada.

## Artes fiéis à versão original

- `assets/Seasons/Winter/Precomposed/` contém 16 estados por família: árvores inferiores, superiores e quatro variantes especiais.
- 48 arquivos WebP gerados exclusivamente das spritesheets originais; nenhuma árvore foi redesenhada.
- Estado 00 idêntico em bytes ao arquivo original; estágio 15 das árvores comuns idêntico em bytes à arte de neve final já aprovada.
- `manifest.json` registra os caminhos e SHA-256. Gerador: `scripts/build_precomposed_winter_art.py`.
- Preserva a regra: a parte superior colada ao teto não ganha cobertura de neve.

## Como testar

- **Teste C** (madeira com neve pré-composta): `?clima=winter&perf-ab=precomposed-snow&test-seed=3169729328`.
- **Controle B** (legado): `?clima=winter&perf-test=1&perf-ab=baseline&test-seed=3169729328`.
- **Controle A** (neve desligada): `?clima=winter&perf-test=1&perf-ab=snow-mask-off&test-seed=3169729328`.
- O Teste C não exige `perf-test=1`. Para usar o perfilador manual, pode acrescentá-lo.

## Comportamento

- Em C, `precomposed-winter.mjs` quantiza a cobertura em 16 estágios (0–15), sem interpolação alfa por quadro.
- `assets.mjs` carrega os 43 novos WebPs somente no teste C; as pontas 0 e 15 das árvores comuns reaproveitam assets existentes.
- `tree-art.mjs` faz uma única chamada de desenho da cap por árvore, com a neve já composta; **não** reconstrói máscaras no voo.
- Texturas são pré-aquecidas no carregamento para evitar upload ao surgir um novo estágio.
- O jogo regular mantém seu comportamento anterior até o Teste C ter desempenho e fidelidade comprovados.

## Testes de aceitação

`node --test tests/precomposed-winter.test.mjs`; navegador: `node tests/browser-precomposed-winter.cjs` com servidor na porta 5501.

Comparar os primeiros 20–40 s de inverno forçado, mesma semente e configurações, nos cenários A, B e C. Registrar FPS, 1% low, stutters, `render.trees` e consumo de memória antes de decidir ativação geral. **Não afirmar 60 FPS antes de um teste em aparelho real.**

## Voo de referência gravado

Use a mesma URL base da publicação e acrescente um dos conjuntos abaixo:

| Variante | Parâmetros da URL |
|---|---|
| A — sem neve nas árvores | `?clima=winter&perf-test=1&perf-replay=1&perf-ab=snow-mask-off` |
| B — neve padrão | `?clima=winter&perf-test=1&perf-replay=1&perf-ab=baseline` |
| C — neve pré-composta | `?clima=winter&perf-test=1&perf-replay=1&perf-ab=precomposed-snow` |

Selecione qualidade **Alta** no jogo, mantenha **Leve** no diagnóstico e pressione
**Executar voo de referência**. Não é necessário tocar nos controles de voo.
A trajetória de 41,24 s usa a semente 3169729328, 64 toques e uma resposta ao quiz,
nos mesmos passos da física. Aguarde o indicador de conclusão e baixe o JSON.
Um resultado completo deve ter `replay.completed: true`, 4.949 passos e 115 pontos.
A trajetória cobre os primeiros estágios de acúmulo no inverno forçado. As transições
entre estações e a neve completamente acumulada continuam exigindo outros cenários.

Use `&perf-hz=120` em uma tela configurada para 120 Hz. Sem esse parâmetro, a meta
é 60 Hz. A frequência indicada é a meta selecionada, e não uma medição do monitor.
O relatório traz o orçamento nominal, a tolerância para variações de agendamento,
o percentual de quadros fora do orçamento, o tamanho interno do canvas e as
janelas por tempo de voo. Compare A/B/C no mesmo dispositivo e no mesmo tamanho
de canvas, com o mesmo perfil gráfico e a mesma instrumentação.

Com `npm start`, o servidor informa o SHA do checkout e se os arquivos publicados
têm alterações locais. Em hospedagem estática, inclua no HTML a tag
`<meta name="chaua-git-commit" content="<SHA completo da publicação>">` ou acrescente
`&perf-commit=<SHA completo>` ao teste. O relatório distingue o SHA informado
pela build de um SHA declarado na URL.
