const fs = require("fs");
const path = require("path");
const root = __dirname;
const routes = JSON.parse(fs.readFileSync(path.join(root, "routes.json"), "utf8")).routes;
const files = new Set(routes.map(route => route.file));
let failed = false;
const htmlFiles = fs.readdirSync(root)
  .filter(file => file.endsWith(".html") && file !== "pencil-export.html");
for (const file of htmlFiles) {
  if (!files.has(file)) {
    console.error(`路由清单存在孤儿页面: ${file}`);
    failed = true;
  }
}
for (const file of files) {
  const full = path.join(root, file);
  if (!fs.existsSync(full)) {
    console.error(`缺少路由文件: ${file}`);
    failed = true;
    continue;
  }
  const html = fs.readFileSync(full, "utf8");
  for (const match of html.matchAll(/href="([^"#?]+\.html)(?:[#?][^"]*)?"/g)) {
    if (!fs.existsSync(path.join(root, match[1]))) {
      console.error(`${file} 存在断链: ${match[1]}`);
      failed = true;
    }
  }
  if (!/lang="zh-CN"/.test(html)) {
    console.error(`${file} 缺少中文语言声明`);
    failed = true;
  }
  if (!["login.html", "404.html"].includes(file) && !/data-shell/.test(html)) {
    console.error(`${file} 未使用共享站点外壳`);
    failed = true;
  }
}
for (const asset of ["site.css", "tokens.css", "site.js"]) {
  if (!fs.existsSync(path.join(root, asset))) {
    console.error(`缺少共享资源: ${asset}`);
    failed = true;
  }
}
if (failed) process.exit(1);
console.log(`通过：${files.size} 个路由文件、无孤儿页面、站内链接与共享资源检查完成。`);
