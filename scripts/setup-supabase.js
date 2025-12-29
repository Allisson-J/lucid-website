/* ============================================
   SETUP SUPABASE - Criar Tabela e Políticas
   Execute: node scripts/setup-supabase.js
   ============================================ */

// IMPORTANTE: Para executar este script, você precisa da SERVICE_ROLE key
// (não a anon key, mas a service_role que tem permissões administrativas)
// Esta chave NUNCA deve ser exposta no frontend!

const SUPABASE_URL = 'https://jrmivuarmghsrvwzolvs.supabase.co';
// Substitua pela sua SERVICE_ROLE key (encontre em: Settings > API > service_role)
const SUPABASE_SERVICE_ROLE_KEY = 'SUA_SERVICE_ROLE_KEY_AQUI';

const SQL_SCHEMA = `
-- Criar tabela de leads
CREATE TABLE IF NOT EXISTS leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'converted')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);

-- Habilitar RLS
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Política: Inserção pública
DROP POLICY IF EXISTS "Permitir inserção pública de leads" ON leads;
CREATE POLICY "Permitir inserção pública de leads"
  ON leads FOR INSERT TO anon WITH CHECK (true);

-- Política: Usuários autenticados podem gerenciar
DROP POLICY IF EXISTS "Usuários autenticados podem gerenciar leads" ON leads;
CREATE POLICY "Usuários autenticados podem gerenciar leads"
  ON leads FOR ALL TO authenticated USING (true);

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger
DROP TRIGGER IF EXISTS update_leads_updated_at ON leads;
CREATE TRIGGER update_leads_updated_at 
  BEFORE UPDATE ON leads 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
`;

async function setupSupabase() {
  if (SUPABASE_SERVICE_ROLE_KEY === 'SUA_SERVICE_ROLE_KEY_AQUI') {
    console.error('❌ Erro: Configure a SERVICE_ROLE_KEY no arquivo!');
    console.log('\n📝 Como obter:');
    console.log('1. Acesse: https://supabase.com/dashboard');
    console.log('2. Vá em Settings > API');
    console.log('3. Copie a chave "service_role" (NÃO a anon!)');
    console.log('4. Cole no arquivo scripts/setup-supabase.js');
    process.exit(1);
  }

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify({ sql: SQL_SCHEMA })
    });

    if (!response.ok) {
      // Tentar método alternativo via SQL Editor API
      console.log('⚠️ Método direto não disponível. Use o SQL Editor do Supabase.');
      console.log('\n📋 Execute este SQL no SQL Editor:');
      console.log('='.repeat(60));
      console.log(SQL_SCHEMA);
      console.log('='.repeat(60));
      return;
    }

    const result = await response.json();
    console.log('✅ Tabela e políticas criadas com sucesso!');
    console.log(result);
  } catch (error) {
    console.error('❌ Erro ao executar SQL:', error.message);
    console.log('\n📋 Execute manualmente no SQL Editor do Supabase:');
    console.log('='.repeat(60));
    console.log(SQL_SCHEMA);
    console.log('='.repeat(60));
  }
}

// Executar apenas se chamado diretamente
if (require.main === module) {
  setupSupabase();
}

module.exports = { setupSupabase, SQL_SCHEMA };

