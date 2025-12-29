# Lucid - Site Institucional

Site profissional da Lucid Tecnologia, empresa focada em automação de processos, inteligência artificial e desenvolvimento de sistemas sob medida.

## 📁 Estrutura do Projeto

```
Lucid/
├── index.html              # Página principal (landing page)
├── login.html              # Página de login do CRM
├── crm.html                # Dashboard do CRM
├── FIX-RLS-AGORA.sql       # Script SQL para configurar RLS no Supabase
├── styles/                 # Arquivos CSS organizados
│   ├── variables.css       # Variáveis CSS (cores, espaçamentos, etc)
│   ├── base.css            # Reset e estilos globais
│   ├── components.css      # Componentes reutilizáveis (botões, cards, etc)
│   ├── layout.css          # Layout (header, footer, navegação)
│   ├── background-effects.css # Efeitos de fundo animados
│   ├── social-buttons.css  # Estilos dos botões sociais
│   ├── login.css           # Estilos da página de login
│   ├── crm.css             # Estilos do CRM
│   ├── theme.css           # Estilos para modo claro/escuro
│   └── main.css            # Arquivo principal que importa todos
├── scripts/                # Arquivos JavaScript
│   ├── supabase-config.js  # Configuração do Supabase (gerado)
│   ├── app-config.js       # Configuração da aplicação (gerado)
│   ├── menu.js             # Menu responsivo mobile
│   ├── scroll.js           # Animações de scroll e scroll suave
│   ├── form.js             # Formulário de contato
│   ├── splide.js           # Configuração do slider de projetos
│   ├── auth.js             # Sistema de autenticação
│   ├── login.js            # Lógica da página de login
│   ├── crm.js              # Lógica do CRM
│   └── setup-config.js     # Script para gerar configs do .env
└── README.md               # Documentação do projeto
```

## 🎨 Design System

### Cores
- **Primary**: `#4da6ff` (Azul principal)
- **Secondary**: `#6f7cff` (Roxo/Azul secundário)
- **Accent**: `#00d4ff` (Ciano de destaque)
- **Background**: `#0b0e14` (Preto azulado)
- **Cards**: `#121726` (Cinza escuro)

### Tipografia
- **Fonte**: Inter (Google Fonts)
- **Pesos**: 300 (Light), 400 (Normal), 600 (Semibold), 700 (Bold)

### Componentes
- Botões com gradiente e hover effects
- Cards com animação ao hover
- Formulários com validação
- Grid responsivo (mobile-first)

## 🚀 Funcionalidades

### Implementadas
- ✅ Layout responsivo (mobile-first)
- ✅ Menu hambúrguer para mobile
- ✅ Scroll suave entre seções
- ✅ Animações de scroll (fade-in-up)
- ✅ Formulário de contato funcional
- ✅ Integração preparada para WhatsApp e Email
- ✅ Header sticky com efeito de scroll
- ✅ Dark theme premium

### Implementadas (Cont.)
- ✅ Integração com Supabase (leads)
- ✅ Sistema de CRM para gerenciar leads
- ✅ Autenticação básica (login/logout)
- ✅ Proteção de chaves via variáveis de ambiente (.env)
- ✅ Modo claro/escuro no CRM
- ✅ Efeitos visuais tecnológicos (partículas, animações)
- ✅ Dashboard com estatísticas de leads

### Preparado para Futuro
- 🔄 Migração para React/Next.js
- 🔄 Sistema de blog/artigos
- 🔄 Portfólio expandido com filtros

## 📱 Responsividade

O projeto utiliza abordagem **mobile-first**:
- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px

## 🔧 Configuração

### 🔐 Variáveis de Ambiente (OBRIGATÓRIO)

**IMPORTANTE:** Este projeto usa variáveis de ambiente para proteger chaves sensíveis.

1. **Criar arquivo `.env`** na raiz do projeto:
   ```bash
   # Copie o template
   cp .env.example .env
   ```

2. **Preencher o `.env`** com suas credenciais:
   ```env
   # Supabase
   SUPABASE_URL=https://seu-projeto.supabase.co
   SUPABASE_ANON_KEY=sua_chave_anon_aqui
   
   # Contato
   WHATSAPP_NUMBER=5581999999999
   CONTACT_EMAIL=lucid.suporte@gmail.com
   
   # Autenticação (desenvolvimento)
   ADMIN_EMAIL=XXXXXXXXX
   ADMIN_PASSWORD=XXXXXXXXXXXXX
   ```

3. **Instalar dependências:**
   ```bash
   npm install
   ```

4. **Gerar arquivo de configuração:**
   ```bash
   npm run config
   ```
   
   Isso criará o arquivo `scripts/supabase-config.js` a partir do `.env`.


### Para desenvolvimento local:

**Opção 1: Abrir diretamente no navegador**
1. Configure o `.env` e execute `npm run config` primeiro
2. Abra o arquivo `index.html` em um navegador moderno
3. Funciona perfeitamente para desenvolvimento básico

**Opção 2: Usar servidor local com npm**
```bash
# Instalar dependências
npm install

# Gerar configuração do Supabase
npm run config

# Iniciar servidor de desenvolvimento
npm run dev
# ou
npm start
```
O servidor iniciará em `http://localhost:3000`

**Opção 3: Outros servidores locais**
```bash
# Python
python -m http.server 8000

# Node.js (sem npm)
npx serve

# PHP
php -S localhost:8000
```

### Configurar WhatsApp e Instagram:
As configurações de contato são feitas no arquivo `.env`:
```env
WHATSAPP_NUMBER=558199999999
INSTAGRAM_URL=https://www.instagram.com/lucid_brasil
CONTACT_EMAIL=lucid.suporte@gmail.com
```
Após alterar o `.env`, execute `npm run config` para atualizar os arquivos de configuração.

## 📝 Próximos Passos

1. **Integração com Backend**
   - Configurar Supabase para armazenar leads
   - Adicionar API para envio de emails
   - Implementar webhook para WhatsApp

2. **Melhorias de Performance**
   - Otimizar imagens (quando adicionadas)
   - Implementar lazy loading
   - Minificar CSS/JS para produção

3. **Migração para React/Next.js**
   - Estrutura já preparada para migração
   - Componentes podem ser facilmente convertidos
   - CSS variables facilitam theming

## 👤 Autor

**Allisson José da Silva**  
Fundador da Lucid Tecnologia

## 📄 Licença

© 2025 Lucid Tecnologia. Todos os direitos reservados.

