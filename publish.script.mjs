/**
 * 发布脚本
 */

import fs from 'fs';
import { execSync } from 'child_process';

try {
  // 提取参数
  const args = process.argv.slice(2);
  const releaseAs = args.find((arg) => arg.startsWith('--release-as')).split('=')[1];

  // 更新版本和提交记录
  const as = releaseAs === 'alpha' ? '--prerelease' : '--release-as';
  execSync(`npx standard-version ${as} ${releaseAs} --skip.tag --skip.commit`);

  // 更新 README 版本号
  const _package = fs.readFileSync('./package.json');
  const { version } = JSON.parse(_package);
  const readmeFiles = ['README.md', 'README.cn.md'];
  readmeFiles.forEach((file) => {
    let content = fs.readFileSync(file);
    content = content
      .toString()
      .replace(/version-([0-9a-zA-Z.]*)-green/g, `version-${version}-green`);
    fs.writeFileSync(file, content);
  });

  // 打包
  execSync(`npm run build`);

  // 提交
  execSync(`git commit -am 'chore(release): ${version}'`);

  // 打标签
  execSync(`git tag -a v${version} -m "Release version ${version}"`);
} catch (err) {
  console.error('发布失败:', err);
}
