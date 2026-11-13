// One catalogue for simulation, artwork, journal and persisted discoveries.
const pan='https://www.gov.br/icmbio/pt-br/assuntos/biodiversidade/pan/pan-papagaios/2-ciclo/produtos/2021-pan-papagaios-pan-chaua-relatorio-final-website.pdf';
const usp='https://www.gov.br/ibama/pt-br/assuntos/biodiversidade/recuperacao-ambiental/20251204_Projeto_IN_20_2024.pdf';
const inma='https://www.gov.br/inma/pt-br/assuntos/noticias/papagaio-ameacado-ajuda-cientistas-a-descobrir-nova-populacao-de-ipe-raro-no-rio-doce';
export const FOODS=Object.freeze([
 ['Goiaba','Goiaba','fruto','A goiaba tem pequenas sementes na polpa. Há registros de chauás consumindo goiabas em pomares próximos às florestas.',usp],
 ['Manga','Manga','fruto','A manga tem uma semente grande envolvida por polpa e é citada entre os alimentos utilizados pelo chauá.',pan],
 ['Mamao','Mamão','fruto','O mamão guarda sementes na cavidade central. Chauás também buscam frutos em áreas cultivadas próximas à floresta.',pan],
 ['Banana','Banana','fruto','As bananas crescem em cachos e aparecem entre os recursos alimentares citados para o chauá.',pan],
 ['Caju','Caju','fruto','O caju inclui a parte carnosa e a castanha associada. É um recurso alimentar citado para o chauá.',pan],
 ['Caja','Cajá','fruto','O cajá é um dos frutos citados entre os recursos alimentares utilizados pelo chauá.',pan],
 ['Jaca','Jaca','fruto','A jaca reúne várias unidades carnosas. Há registros de chauás buscando esse recurso em áreas cultivadas.',pan],
 ['Jambo','Jambo','fruto','Jambo é um dos nomes populares de frutos citados na alimentação do chauá; o nome sozinho não identifica uma espécie de planta.',pan],
 ['Acerola','Acerola','fruto','A acerola aparece entre os frutos citados para o chauá. A variedade de recursos ajuda a mostrar sua relação com as plantas.',pan],
 ['Semente','Sementes florestais','semente','Sementes fazem parte dos recursos do chauá. Esta imagem representa a categoria, sem identificar uma planta específica. Comer uma semente não garante dispersão ou germinação.',pan],
 ['Broto','Broto','broto','Brotos também são citados entre os recursos alimentares do chauá. O desenho representa uma parte vegetal jovem.',pan],
 ['PetalasIpe','Pétalas de ipê-do-Rio-Doce','pétala','Chauás utilizam as pétalas do ipê Handroanthus riodocensis. Essa relação alimentar ajudou pesquisadores a localizar árvores raras no Espírito Santo.',inma],
].map(([id,name,category,description,source],slot)=>Object.freeze({id,name,category,description,source,slot})));
export const FOOD_IDS=new Set(FOODS.map(f=>f.id));
