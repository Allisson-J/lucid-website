/* ============================================
   SETUP CONFIG - Gerar supabase-config.js a partir do .env
   Execute: node scripts/setup-config.js
   ============================================ */

const fs = require('fs');
const path = require('path');

// Ler arquivo .env
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  
  
  if (!fs.existsSync(envPath)) {
    console.error('❌ Arquivo .env não encontrado!');
    console.log('📝 Crie um arquivo .env baseado no .env.example');
    console.log('   Execute: cp .env.example .env');
    process.exit(1);
  }

  let envContent;
  try {
    // Tentar ler com diferentes encodings
    envContent = fs.readFileSync(envPath, 'utf8');
  } catch (e) {
    try {
      envContent = fs.readFileSync(envPath, 'latin1');
    } catch (e2) {
      envContent = fs.readFileSync(envPath);
    }
  }
  
  // Remover BOM (Byte Order Mark) se existir
  if (envContent.length > 0) {
    if (envContent.charCodeAt(0) === 0xFEFF) {
      envContent = envContent.slice(1);
    } else if (envContent.length >= 3 && 
                envContent.charCodeAt(0) === 0xEF && 
                envContent.charCodeAt(1) === 0xBB && 
                envContent.charCodeAt(2) === 0xBF) {
      envContent = envContent.slice(3);
    }
  }
  
  const env = {};

  // Processar linha por linha, lidando com diferentes tipos de quebra de linha
  // Suporta \n, \r\n, e \r - usar método mais robusto
  const lines = envContent.split(/\r\n|\r|\n/);
  
  // Verificar se o split funcionou corretamente
  if (lines.length === 1 && envContent.length > 100) {
    // Tentar método alternativo
    const altLines = envContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
    if (altLines.length > lines.length) {
      return loadEnvAlt(envPath, altLines);
    }
  }
  
  lines.forEach((line, index) => {
    // Remover espaços em branco e caracteres especiais no início/fim
    const originalLine = line;
    line = line.trim();
    
    // Ignorar comentários e linhas vazias
    if (line && !line.startsWith('#')) {
      // Dividir por = (primeira ocorrência)
      const equalIndex = line.indexOf('=');
      if (equalIndex > 0) {
        const key = line.substring(0, equalIndex).trim();
        const value = line.substring(equalIndex + 1).trim();
        
        // Remover aspas se existirem
        const cleanValue = value.replace(/^["']|["']$/g, '');
        
        if (key && cleanValue) {
          env[key] = cleanValue;
        }
      }
    }
  });
  

  return env;
}

// Função alternativa de parsing (fallback)
function loadEnvAlt(envPath, lines) {
  const env = {};
  
  lines.forEach((line, index) => {
    const trimmed = line.trim();
    
    if (trimmed && !trimmed.startsWith('#')) {
      const equalIndex = trimmed.indexOf('=');
      if (equalIndex > 0) {
        const key = trimmed.substring(0, equalIndex).trim();
        const value = trimmed.substring(equalIndex + 1).trim();
        const cleanValue = value.replace(/^["']|["']$/g, '');
        
        if (key && cleanValue) {
          env[key] = cleanValue;
        }
      }
    }
  });
  
  return env;
}

// Gerar arquivo supabase-config.js
function generateConfig(env) {
  const configPath = path.join(__dirname, 'supabase-config.js');
  
  const configContent = `/* ============================================
   CONFIGURAÇÃO SUPABASE
   ============================================
   ⚠️ ATENÇÃO: Este arquivo é gerado automaticamente a partir do .env
   NÃO edite manualmente! Execute: npm run setup
   ============================================ */

// Configuração do Supabase
const SUPABASE_CONFIG = {
  url: '${env.SUPABASE_URL || ''}',
  anonKey: '${env.SUPABASE_ANON_KEY || ''}'
};

// Cliente Supabase global
let supabaseClient = null;

// Inicializar cliente Supabase
function initSupabase() {
  // Verificar se Supabase está configurado
  if (!isSupabaseConfigured()) {
    console.warn('Supabase não configurado. Usando localStorage como fallback.');
    return false;
  }

  // Verificar se a biblioteca Supabase está carregada
  if (typeof window.supabase === 'undefined') {
    console.warn('Biblioteca Supabase não carregada. Usando localStorage como fallback.');
    return false;
  }

  try {
    supabaseClient = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
    console.log('Supabase inicializado com sucesso!');
    return true;
  } catch (error) {
    console.error('Erro ao inicializar Supabase:', error);
    return false;
  }
}

// Verificar se Supabase está configurado
function isSupabaseConfigured() {
  return SUPABASE_CONFIG.anonKey && 
         SUPABASE_CONFIG.anonKey.length > 0 &&
         SUPABASE_CONFIG.anonKey.trim() !== '' &&
         SUPABASE_CONFIG.url &&
         SUPABASE_CONFIG.url.length > 0;
}

// Obter cliente Supabase
function getSupabaseClient() {
  if (!supabaseClient && isSupabaseConfigured()) {
    initSupabase();
  }
  return supabaseClient;
}

// Aguardar carregamento do Supabase antes de inicializar
function waitForSupabase(maxAttempts = 50, attempt = 0) {
  if (typeof window === 'undefined') return;
  
  if (typeof window.supabase !== 'undefined') {
    // Supabase carregado, inicializar
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initSupabase);
    } else {
      initSupabase();
    }
  } else if (attempt < maxAttempts) {
    // Aguardar mais um pouco (100ms)
    setTimeout(() => waitForSupabase(maxAttempts, attempt + 1), 100);
  } else {
    console.warn('Supabase não carregou após 5 segundos. Usando localStorage como fallback.');
  }
}

// Inicializar automaticamente quando o script carregar
if (typeof window !== 'undefined') {
  waitForSupabase();
}
`;

  fs.writeFileSync(configPath, configContent, 'utf8');
  console.log('✅ Arquivo scripts/supabase-config.js gerado com sucesso!');
}

// Gerar arquivo app-config.js
function generateAppConfig(env) {
  const configPath = path.join(__dirname, 'app-config.js');
  
  const configContent = `/* ============================================
   CONFIGURAÇÃO DA APLICAÇÃO
   ⚠️ ATENÇÃO: Este arquivo é gerado automaticamente a partir do .env
   NÃO edite manualmente! Execute: npm run setup
   ============================================ */

// Configurações da aplicação
const APP_CONFIG = {
  // Contato
  whatsappNumber: '${env.WHATSAPP_NUMBER || '5581986919496'}',
  contactEmail: '${env.CONTACT_EMAIL || 'lucid.suporte@gmail.com'}',
  instagramUrl: '${env.INSTAGRAM_URL || 'https://instagram.com/lucid.social'}',
  
  // Autenticação (credenciais padrão para desenvolvimento)
  defaultAdminEmail: '${env.ADMIN_EMAIL || 'admin@lucid.social'}',
  defaultAdminPassword: '${env.ADMIN_PASSWORD || 'admin123'}'
};

// Função para obter URL do WhatsApp
function getWhatsAppUrl(message) {
  return \`https://wa.me/\${APP_CONFIG.whatsappNumber}?text=\${encodeURIComponent(message)}\`;
}

// Função para obter URL do Email
function getEmailUrl(subject, body) {
  return \`mailto:\${APP_CONFIG.contactEmail}?subject=\${encodeURIComponent(subject)}&body=\${encodeURIComponent(body)}\`;
}
`;

  fs.writeFileSync(configPath, configContent, 'utf8');
  console.log('✅ Arquivo scripts/app-config.js gerado com sucesso!');
}

// Executar
try {
  console.log('🔄 Carregando variáveis de ambiente do .env...');
  const env = loadEnv();
  
  
  // Validar variáveis obrigatórias
  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
    console.error('\n❌ Variáveis obrigatórias não encontradas no .env:');
    if (!env.SUPABASE_URL) console.error('   - SUPABASE_URL');
    if (!env.SUPABASE_ANON_KEY) console.error('   - SUPABASE_ANON_KEY');
    console.error('\n💡 Verifique se o arquivo .env está no diretório raiz do projeto.');
    console.error('💡 Certifique-se de que as variáveis estão no formato: CHAVE=valor');
    process.exit(1);
  }

  console.log('🔄 Gerando scripts/supabase-config.js...');
  generateConfig(env);
  
  console.log('🔄 Gerando scripts/app-config.js...');
  generateAppConfig(env);
  
  console.log('✅ Configuração concluída!');
} catch (error) {
  console.error('❌ Erro:', error.message);
  process.exit(1);
}

