const esbuild = require('esbuild');

async function build() {
  // 1. 打包 VS Code / Antigravity IDE 插件扩展 (dist/extension.js)
  await esbuild.build({
    entryPoints: ['src/extension/extension.ts'],
    bundle: true,
    platform: 'node',
    target: 'node20',
    external: ['vscode'],
    outfile: 'dist/extension.js',
    sourcemap: true,
  });

  // 2. 打包独立桌面端服务 (dist/desktop.js)
  await esbuild.build({
    entryPoints: ['src/desktop/server.ts'],
    bundle: true,
    platform: 'node',
    target: 'node20',
    outfile: 'dist/desktop.js',
    sourcemap: true,
  });

  // 3. 编译核心测试套件
  await esbuild.build({
    entryPoints: ['src/core/test-runner.ts'],
    bundle: true,
    platform: 'node',
    target: 'node20',
    outfile: 'out/test-runner.js',
    sourcemap: true,
  });

  console.log('✅ VS Code 插件、独立桌面服务与核心模块全部构建成功！');
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
