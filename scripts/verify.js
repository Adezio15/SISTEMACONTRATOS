const { execFileSync } = require('node:child_process');

function run(command, args) {
  console.log(`> ${command} ${args.join(' ')}`);

  if (process.platform === 'win32' && command === 'npm') {
    execFileSync(process.env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', 'npm', ...args], {
      stdio: 'inherit'
    });
    return;
  }

  execFileSync(command, args, {
    stdio: 'inherit'
  });
}

run('node', ['--check', 'src/app.js']);
run('node', ['--check', 'src/server.js']);
run('node', ['--check', 'scripts/migrate.js']);
run('node', ['--check', 'scripts/seed.js']);
run('npm', ['test']);
run('npm', ['audit', '--omit=dev']);

console.log('Verificacao concluida com sucesso.');
