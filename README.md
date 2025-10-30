# ⚡ ECO-DASH – Plataforma de Gestão Inteligente de Energia (EDIÇÃO EXPANDIDA)

> **ECO-DASH** 
é um Painel de Controle (Dashboard) de nível profissional, 100% frontend e responsivo, 
focado em **Business Intelligence (BI)** aplicado ao consumo energético residencial. 
O projeto transforma dados complexos de monitoramento em **insights proativos e acionáveis**, 
capacitando o usuário a otimizar custos, definir metas e promover a sustentabilidade de forma intuitiva.

---

## 💻 Visualização Pública (Deploy)

O ECO-DASH está com **deploy contínuo** na Vercel, o que permite que o projeto seja acessado publicamente sem a necessidade de execução local:

**Acessar o Site:** [https://eco-dash-taupe.vercel.app/](https://eco-dash-taupe.vercel.app/)

---

## 🎯 Conceito e Filosofia de Design

O principal objetivo do ECO-DASH é desmistificar o consumo de energia. 
Por meio de uma interface limpa e focada em dados, ele oferece transparência total, incentivando a **economia consciente** e a **eficiência de longo prazo**.

* **Dark Mode First:** 
Prioriza o tema escuro (`--fundo-principal: #1A0A33;`) para conforto visual, alinhando-se às tendências de dashboards de análise.
* **Hierarquia Visual Clara:** 
Utiliza o contraste e cores de destaque (Ciano `#00B4D8`) para guiar o usuário aos KPIs mais relevantes.
* **Otimização de Performance:** 
Embora seja um projeto frontend, todos os componentes são otimizados para carregamento rápido e transições suaves, 
simulando a fluidez de um aplicativo nativo.

---

## ✨ Recursos Técnicos e Diferenciais de Engenharia

O desenvolvimento deste dashboard reflete a aplicação de boas práticas e soluções avançadas de frontend:

### 1. Sistema de Temas Dinâmico e Coeso (CSS & JS)
* **CSS Custom Properties:** O coração do sistema de temas. Todas as cores (fundo, texto, acentos, bordas) são gerenciadas por variáveis CSS, 
permitindo a troca instantânea e global do tema com a mudança de um único atributo (`[data-theme="light"]`) no elemento `<html>`.
* **Solução Anti-FOUC:** O `script.js` possui um **Immediately Invoked Function Expression (IIFE)** no topo (`(function() { ... })()`) 
para ler o `localStorage` e aplicar o tema antes da renderização completa do DOM, eliminando o "Flash of Unstyled Content" (FOUC).
* **Adaptação Completa de Gráficos:** A função `renderCharts()` reconstrói todos os gráficos do Chart.js na troca de tema, 
garantindo que as cores das linhas, *datasets*, textos de eixos e *grids* sejam atualizadas dinamicamente para manter a legibilidade.

### 2. Visualização de Dados de Nível BI (Chart.js)
* **Múltiplos Gráficos:** Implementação de 5 tipos de gráficos (Linha, Donut, Radar) em diferentes módulos, cada um com um propósito analítico específico.
* **Gráfico Radar de Desempenho:** Utilizado na página de Eficiência para comparar visualmente
 o **Desempenho Atual** da casa (ex: Iluminação, Climatização) em relação a uma **Meta Ideal**, sendo um diferencial poderoso para diagnóstico.
* **Barras Customizadas:** O widget de Distribuição de Carga utiliza lógica JavaScript complexa (`createGradientColor` e manipulação do DOM) 
para criar barras segmentadas com gradiente de cor e sombreamento, oferecendo uma representação de dados única.

### 3. Layout, Responsividade e UX
* **CSS Grid (12 Colunas):** O layout principal é construído com um sistema de 12 colunas (`grid-template-columns: repeat(12, 1fr)`), 
o padrão da indústria, garantindo flexibilidade na organização de widgets e responsividade perfeita através de *media queries* (`768px` e `1200px`).
* **Animações Suaves:** Utiliza **ScrollReveal.js** para adicionar animações *on-scroll* aos widgets, melhorando a percepção de modernidade e interatividade.
* **KPIs Acionáveis:** Indicadores de Desempenho Chave (KPIs) utilizam cores consistentes (Verde/Positivo, Vermelho/Alerta) e 
indicadores de tendência (▲/▼) para comunicação imediata do estado do sistema.

---

## 🧭 Módulos da Plataforma (Análise Detalhada)

### 🏠 1. Início (`index.html`) - A Recepção do Sistema

* **Propósito:** Dashboard de boas-vindas, resume o status operacional do medidor de energia e direciona o usuário para as áreas críticas da plataforma.
* **Destaque:** O botão de ação principal (⚡ IR PARA MONITORAMENTO) usa o destaque de cor primária para um Call-to-Action (CTA) claro.

### 📈 2. Monitoramento em Tempo Real (`monitoramento.html`) - Onde os Dados Nascem

* **KPIs:** Exibe Consumo Atual (kWh) e o custo do **Desperdício em Standby** (R$), com tendências de comparação (vs. Mês Anterior).
* **Gráfico de Tendência:** Gráfico de Linha do Chart.js para o Consumo Semanal, permitindo identificar picos de uso diário.
* **Análise de Picos:** Tabela crítica que detalha o horário exato, 
o dispositivo e o **impacto financeiro em Reais (R$)** dos picos de consumo, essencial para entender tarifas de Horário de Ponta.
* **Distribuição de Carga:** Representado pelas Barras Customizadas, mostra a proporção de consumo por categoria (Aquecimento, Climatização, Eletrodomésticos).

### 💸 3. Gestão de Custos e Metas (`custos_metas.html`) - Controle Orçamentário

* **Projeção Financeira:** Projeção da Conta Final, incluindo o alerta e indicação da **Bandeira Tarifária** (ex: VERMELHA).
* **Acompanhamento de Metas:** Gráfico Donut para o **Progresso da Meta Geral** 
e uma tabela de **Metas Ativas**, que mostra o sucesso ou falha em atingir objetivos específicos (ex: Limite de Pico, Standby).
* **Histórico de Custos:** Gráfico de Linha que compara o Custo Mensal Real com a **Linha de Meta Fixa**, permitindo uma análise clara da performance de economia.

### ♻️ 4. Eficiência e Otimização (`eficiencia.html`) - A Inteligência Proativa

* **KPI de Otimização:** O **Índice de Otimização (IOE)**, uma pontuação de 0 a 100, atua como um incentivo de Gamificação.
* **Diagnóstico Multidimensional:** O **Gráfico Radar** é usado para comparar o Desempenho dos Dispositivos (ex: Cozinha, Iluminação, Standby) com a Meta Ideal em um formato de teia.
* **Plano de Ação:** Tabela de Dicas de Economia que fornece não apenas a 
sugestão (ex: Trocar Lâmpadas), mas também a **Prioridade**, a **Economia Estimada em R$/Mês** e o **Status da Ação**, transformando a sugestão em um plano de trabalho.

### 👤 5. Perfil (`perfil.html`) - Personalização e Engajamento

* **Configurações:** Formulário de configurações básicas (nome, email, etc.).
* **Gamificação:** O CSS inclui classes (ex: `.gamification-summary`, `.progress-bar.bar-xp`) 
que indicam a intenção de implementar um sistema de níveis e experiência, aumentando o engajamento e a fidelidade do usuário.

---

## 🚀 Tecnologias Utilizadas e Bibliotecas

O projeto é um exemplo de como construir um dashboard rico em funcionalidades e visualmente atraente utilizando uma stack moderna e leve.

| Categoria | Tecnologia | Detalhe de Implementação |
| :--- | :--- | :--- |
| **Estrutura** | HTML5 Semântico | Base clara e organizada, focada na acessibilidade. |
| **Estilização** | CSS3 Moderno | Uso extensivo de **CSS Grid** (layout 12 colunas) e **Custom Properties** (Variáveis CSS). |
| **Comportamento** | JavaScript (ES6+) | Lógica modular (sem bibliotecas grandes além dos gráficos). Responsável por todo o tema dinâmico e interação do usuário. |
| **Visualização** | **Chart.js v4+** | Essencial para renderizar todos os gráficos complexos (Linha, Donut, Radar, etc.) com adaptação de tema. |
| **UX/Animação** | ScrollReveal.js | Adiciona uma camada de polimento visual com animações de entrada nos componentes. |
| **Persistência** | `localStorage` API | Usada para memorizar a preferência de tema do usuário entre as sessões. |

---

## 📐 Estrutura do Projeto

A organização modular do projeto reflete uma arquitetura escalável, mesmo sendo um frontend estático.

⚙️ Estrutura do Projeto
```
ECO-DASH/
│
├── index.html              # Página inicial
├── monitoramento.html      # Visualização de consumo e carga
├── custos_metas.html       # Custos e metas mensais
├── eficiencia.html         # Eficiência e otimização
├── perfil.html             # Configurações do usuário
│
├── style.css               # Estilos principais
└── script.js               # Funções gerais e gráficos
```

---

## 🧠 Conceitos Aplicados

- **Design Responsivo:** o layout se adapta automaticamente a qualquer tela.  
- **Dark Mode Persistente:** o tema preferido é salvo no navegador.  
- **Interatividade Progressiva:** gráficos e dados aparecem de forma animada.  
- **Acessibilidade Visual:** contraste e cores otimizadas para leitura.  
- **Modularização:** cada funcionalidade isolada em um arquivo específico.  

---

## 📐 Layout e UX

O layout segue princípios de **design minimalista** e **visual limpo**, com foco em:

- **Hierarquia visual clara**  
- **Espaçamento adequado entre seções**  
- **Ícones vetoriais consistentes**  
- **Uso de cores com contraste controlado**  
- **Fontes legíveis e modernas**  

---

## ⚙️ Como Executar Localmente

O projeto não possui dependências de backend ou servidor.

1.  **Clone o repositório:**
    ```bash
    git clone [https://github.com/seuusuario/ECO-DASH.git](https://github.com/seuusuario/ECO-DASH.git)
    cd ECO-DASH
    ```
2.  **Visualizar:**
    Abra o arquivo `index.html` diretamente no seu navegador.

---

## 🤝 Contribuições

Sua contribuição para o aprimoramento do ECO-DASH é incentivada! 
Seja na refatoração do JS, na melhoria do CSS ou na adição de novos módulos (como o sistema de Gamificação), sinta-se à vontade para:

1.  Fazer um **Fork** do projeto.
2.  Criar uma nova *branch* para sua funcionalidade.
3.  Comitar suas alterações com mensagens claras.
4.  Abrir um **Pull Request**.

---

## 🚀 Próximos Passos e Oportunidades de Evolução

O projeto está pronto para crescer. Aqui estão algumas sugestões de melhoria (Roadmap):

1.  **Integração Real de Dados:** Substituir os dados estáticos do JS por chamadas a uma **API RESTful** (utilizando `fetch` ou `Axios`) para monitoramento em tempo real de fato.
2.  **Sistema de Gamificação Completo:** Implementar a lógica de XP e níveis no `perfil.html`, utilizando o `localStorage` ou um backend para salvar o progresso do usuário.
3.  **Filtragem Dinâmica:** Adicionar filtros de tempo (Diário/Semanal/Mensal) aos gráficos para maior flexibilidade na análise.
4.  **Acessibilidade (ARIA):** Melhorar a conformidade com WCAG e adicionar atributos ARIA aos componentes do dashboard, tornando-o acessível a leitores de tela.

---

## 📜 Histórico de Versões

O projeto segue a padronização SemVer (Semantic Versioning) para seu ciclo de desenvolvimento.

| Versão | Entrega Principal | Módulos Concluídos | Observações |
| :--- | :--- | :--- | :--- |
| **v1.3.0** | **Finalização do Layout da Página Perfil e Eficiência** | Layout de 5 Páginas, Gráfico Radar, Estilos de Formulário. | Otimização do layout de gamificação (Rank Eco-Tesla) e correções de espaçamento vertical (KPIs). |
| **v1.2.0** | **Finalização da Página Custos e Metas** | Gráfico de Rosca de Meta, Gráfico de Linha de Custo Mensal. | Implementação do gráfico de linha com 'Target Line' e ajuste do layout 50/50 na Linha 3 (Tabela vs. Resumo). |
| **v1.1.0** | **Funcionalidades de UX e Temas** | FOUC Fix, ScrollReveal, Botões Clicáveis. | Implementação da solução anti-Flash (FOUC), troca de tema persistente e animações suaves (`scrollreveal.js`). |
| **v1.0.0** | **Arquitetura Base e Dashboard Inicial** | Estrutura de 5 Páginas, Grid Layout, Tema Dark, Gráfico de Linha. | Estabelecimento do CSS Grid, variáveis CSS, e a primeira versão funcional do Dashboard de Monitoramento (`monitoramento.html`). |
| **v0.1.0** | **Conceito Inicial** | HTML e CSS base. | Estrutura inicial do projeto em HTML/CSS para validação de layout (versão anterior ao uso do Chart.js). |

---

## 🙏 Agradecimentos

Gostaríamos de expressar um profundo agradecimento à **Faculdade de Engenharia de Sorocaba (Facens)**.

O suporte e o ambiente acadêmico proporcionados pela instituição foram fundamentais para a concepção, desenvolvimento e validação técnica deste projeto de Business Intelligence em Eficiência Energética. Agradecemos por cultivar a inovação e o conhecimento aplicado.