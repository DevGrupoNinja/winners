# Especificação do Backend - Winners

Este documento descreve as funcionalidades necessárias para o backend do projeto Winners, organizado por páginas e fluxos de usuário. O objetivo é guiar o desenvolvimento focando no comportamento esperado e nas necessidades de dados de cada funcionalidade.

## Visão Geral Técnica

*   **Linguagem:** Python (escolhido pela capacidade de processamento de dados e IA).
*   **Framework:** FastAPI.
*   **Banco de Dados:** SQLite para desenvolvimento e PostgreSQL para produção.
*   **Autenticação:** Baseada em JWT.

---

## 1. Módulo de Autenticação e Usuários
**Contexto:** O sistema precisa gerenciar o acesso de treinadores e administradores.

*   **Login e Acesso:** O sistema deve permitir login (possivelmente via Google ou credenciais próprias). Existem perfis de **Admin**, **Treinador** e **Atleta**.
    *   *Permissões:* Admin e Treinador possuem o mesmo nível de acesso operacional (criar treinos, gerenciar atletas), mas **apenas o Admin pode alterar as Configurações Globais** (ícone de engrenagem em cada módulo).
*   **Perfil do Usuário:** O sistema deve permitir recuperar os dados do usuário logado para exibir no layout (avatar, nome).

---

## 2. Página de Atletas (Gestão de Elenco)
**Contexto:** Onde os treinadores gerenciam o cadastro e status dos nadadores.

*   **Listagem e Filtros:** O backend deve fornecer uma lista de atletas que suporte busca por nome e filtros por categoria ou status.
*   **Cadastro de Atleta:**
    *   **Dados Pessoais:** Nome, sobrenome, data de nascimento, CPF, endereço.
    *   **Contatos:** E-mail e telefone.
    *   **Classificação:** O atleta deve ser vinculado a uma categoria (ex: Infantil, Master, Absoluto, Petiz).
    *   **Validações:** O sistema deve garantir que E-mail e CPF sejam únicos.
*   **Edição e Status:** Deve ser possível editar todos os dados e alterar o status do atleta (Ativo/Bloqueado).

**Configurações do Módulo (Admin):**
*   **Gerenciar Categorias:** Criar/Editar/Remover as categorias disponíveis para os atletas (ex: adicionar "Juvenil").

---

## 3. Página de Ciclos (Periodização)
**Contexto:** O planejamento macro do treino, estruturado de forma hierárquica.

*   **Agrupamento:** 
    *   **Macrocliclo:** Ciclo maior (Temporada). Exibe métricas agregadas de todos os seus filhos.
    *   **Mesociclo:** Blocos de treino dentro do Macro.
    *   **Microciclo:** Unidade semanal. Define foco, intensidade e volume planejado.
*   **Dashboard Agregado:**
    *   Ao acessar um nível (especialmente o Microciclo), o sistema deve retornar um **resumo consolidado** de tudo que ocorreu naquele período: treinos realizados (água e academia), avaliações físicas feitas e médias de bem-estar.

---

## 4. Página de Treino (Natação)
**Contexto:** Construção detalhada e acompanhamento dos treinos na piscina.

*   **Planejador de Treinos (Estrutura de Dados):**
    *   **Treino:** Data, Horário, Grupo/Categoria alvo.
    *   **Séries (Blocos):** O treino é dividido em Séries (ex: "Aquecimento", "Principal").
        *   *Campos da Série:* Nome, número de repetições da série (ex: 2x), RPE alvo, Volume total calculado, métricas DDR/DCR e instruções gerais.
    *   **Subdivisões (Itens da Série):** Cada série contém os exercícios práticos.
        *   *Campos da Subdivisão:* Tipo (DDR/DCR), Quantidade de repetições, Distância (mts), Estilo/Exercício, Tempo de saída ou intervalo, Pausa, e parâmetros de intensidade decimal (DA-RE, DA-ER).
*   **Duplicação:** Permitir copiar um treino inteiro para outra data.
*   **Modo "Ao Vivo" (Execução):**
    *   Registrar presença (chamada).
    *   Registrar feedback pós-treino por atleta: RPE Real (0-10), Nível de Exaustão e anotações.
    *   **Tomada de Tempo:** Campo opcional para registrar tempos em séries específicas.

**Configurações do Módulo (Admin):**
*   **Categorias de Treino:** Definir tags ou grupos (ex: Velocidade, Fundo).
*   **Tipos de Exercício:** Cadastrar estilos ou drills padronizados.
*   **Intervalos de Intensidade:** Configurar as faixas de referência para classificar automaticamente a Base Funcional com base nos valores de DA-RE e DA-ER inseridos nas subdivisões.

---

## 5. Página de Academia (Dryland)
**Contexto:** Treinos de força e condicionamento.

*   **Modelos de Treino (Fichas):**
    *   Criação de modelos reutilizáveis categorizados (ex: "Força Hipertrofia - Infantil").
    *   **Estrutura do Exercício:**
        *   Nome, C. Físico-Motriz, Qtde Séries, Qtde Execuções, Pausa (seg).
        *   **Meta Relativa:** O sistema deve permitir definir metas de carga relativas ao peso do atleta. *Importante:* Deve haver um campo de meta para **cada série** configurada (ex: se são 3 séries, haverá 3 campos de meta relativa).
*   **Agendamento e Execução:**
    *   Instanciar um modelo para uma data específica.
    *   **Cargas Reais:** No modo execução, registrar a carga (kg) efetivamente utilizada pelo atleta em cada série realizada.

**Configurações do Módulo (Admin):**
*   **Cadastro de Exercícios:** Banco de dados de exercícios disponíveis para seleção.
*   **Capacidades Físico-Motrizes:** Gerenciar a lista de capacidades (ex: Força Máxima, Potência).

---

## 6. Página de Analytics (Avaliações)
**Contexto:** Monitoramento físico e bem-estar.

*   **Avaliações Físicas:**
    *   Registro manual de: Peso (kg), Salto Vertical (cm), Arremesso (m).
*   **Bem-Estar (Wellness):**
    *   Questionário diário ou periódico: Sono, Fadiga, Dor Muscular, Estresse (escalas numéricas).
*   **Visualização:**
    *   API deve fornecer histórico cronológico para plotagem de gráficos de evolução.

**Configurações do Módulo (Admin):**
*   **Gerenciar Tipos de Avaliação:** (Futuro) Permitir criar novos campos de métrica além dos padrões.
