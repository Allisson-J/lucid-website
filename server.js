#!/usr/bin/env node

/**
 * Script wrapper para servir arquivos estáticos no Render
 * Garante que a porta do ambiente seja usada corretamente
 */

const { spawn } = require('child_process');
const path = require('path');
const isWindows = process.platform === 'win32';

const PORT = process.env.PORT || 3000;
const directory = path.join(__dirname, '.');

console.log(`🚀 Iniciando servidor na porta ${PORT}...`);

// Determinar comando baseado no sistema operacional
const command = isWindows ? 'serve.cmd' : 'serve';
const args = [directory, '-p', PORT.toString()];

const serve = spawn(command, args, {
  stdio: 'inherit',
  shell: isWindows,
  cwd: __dirname
});

serve.on('error', (error) => {
  console.error('❌ Erro ao iniciar servidor:', error.message);
  console.error('💡 Certifique-se de que o pacote "serve" está instalado: npm install');
  process.exit(1);
});

serve.on('exit', (code, signal) => {
  if (signal) {
    console.log(`\n⚠️  Servidor encerrado com sinal: ${signal}`);
  } else if (code !== 0) {
    console.error(`\n❌ Servidor encerrado com código: ${code}`);
  }
  process.exit(code || 0);
});

// Tratar encerramento gracioso
process.on('SIGTERM', () => {
  console.log('\n⚠️  Recebido SIGTERM, encerrando servidor...');
  serve.kill('SIGTERM');
});

process.on('SIGINT', () => {
  console.log('\n⚠️  Recebido SIGINT, encerrando servidor...');
  serve.kill('SIGINT');
});

