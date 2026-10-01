/* 作品列表由数据渲染 —— 练习：把数组换成从接口 fetch 获取 */
const WORKS = [
  { title: '企业官网改版', desc: '重构信息架构，移动端首屏加载从 4.2s 降到 1.3s。', stack: 'HTML / CSS / JavaScript' },
  { title: '产品落地页', desc: '独立完成设计稿到上线的全流程，转化率提升 37%。', stack: '响应式 / SEO' },
  { title: '数据看板', desc: 'React + 接口联调，含登录鉴权与权限控制。', stack: 'React / Node.js' }
];

function renderWorks() {
  const list = document.getElementById('work-list');
  if (!list) return;
  list.innerHTML = WORKS.map(function (w) {
    return '<article class="card">'
      + '<h3>' + w.title + '</h3>'
      + '<p>' + w.desc + '</p>'
      + '<div class="stack">' + w.stack + '</div>'
      + '</article>';
  }).join('');
}

function fillYear() {
  const el = document.getElementById('year');
  if (el) el.textContent = String(new Date().getFullYear());
}

document.addEventListener('DOMContentLoaded', function () {
  renderWorks();
  fillYear();
});