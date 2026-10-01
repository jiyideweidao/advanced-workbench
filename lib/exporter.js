'use strict';

const fs = require('fs');
const path = require('path');
const { buildPptx } = require('./pptx');
const { createZip } = require('./zip');

function safeName(text) {
  return String(text).replace(/[\\/:*?"<>|]/g, '_').replace(/\s+/g, ' ').trim();
}

function pad(num) {
  return String(num).padStart(2, '0');
}

function resourcesFlat(cat) {
  const groups = [
    ['ppt', 'PPT / 课件'],
    ['doc', '文档与课程'],
    ['video', '视频课程'],
    ['book', '书籍']
  ];
  const rows = [];
  for (const [key, label] of groups) {
    const list = (cat.resources && cat.resources[key]) || [];
    for (const item of list) {
      rows.push({
        kind: label,
        title: item.title,
        provider: item.provider || '',
        level: item.level || '',
        url: item.url || (item.local ? '（本站生成，见下载中心）' : ''),
        note: item.note || ''
      });
    }
  }
  return rows;
}

function buildMarkdown(cat, site) {
  const lines = [];
  const appName = (site && site.app && site.app.name) || '进阶工作台';

  lines.push('# ' + cat.icon + ' ' + cat.name + ' · 学习手册');
  lines.push('');
  lines.push('> ' + cat.tagline);
  lines.push('');
  lines.push('| 项目 | 内容 |');
  lines.push('| --- | --- |');
  lines.push('| 英文名 | ' + cat.en + ' |');
  lines.push('| 难度 | ' + cat.level + ' |');
  lines.push('| 建议投入 | ' + cat.duration + ' |');
  lines.push('| 标签 | ' + (cat.tags || []).join(' · ') + ' |');
  lines.push('| 导出于 | ' + appName + ' ' + new Date().toLocaleString('zh-CN') + ' |');
  lines.push('');

  lines.push('## 一、学习目标');
  lines.push('');
  lines.push(cat.goal);
  lines.push('');

  lines.push('## 二、领域概览');
  lines.push('');
  for (const p of cat.overview || []) lines.push(p, '');

  lines.push('## 三、你会获得的能力');
  lines.push('');
  for (const h of cat.highlights || []) lines.push('- **' + h.title + '**：' + h.desc);
  lines.push('');

  lines.push('## 四、学习路线图');
  lines.push('');
  for (const stage of cat.roadmap || []) {
    lines.push('### ' + stage.stage + '｜' + stage.title + '（' + stage.weeks + '）');
    lines.push('');
    lines.push(stage.desc);
    lines.push('');
    for (const item of stage.items || []) lines.push('- ' + item);
    lines.push('');
    if (stage.output) { lines.push('> ' + stage.output); lines.push(''); }
  }

  lines.push('## 五、详细目录');
  lines.push('');
  for (const mod of cat.toc || []) {
    lines.push('### ' + mod.module + '（' + mod.hours + '）');
    lines.push('');
    for (const lesson of mod.lessons || []) {
      lines.push('- **' + lesson.title + '**');
      if (lesson.key && lesson.key.length) {
        lines.push('  - 要点：' + lesson.key.join('；'));
      }
    }
    lines.push('');
  }

  lines.push('## 六、精选学习资源');
  lines.push('');
  const rows = resourcesFlat(cat);
  const groups = [
    ['PPT / 课件', 'ppt'],
    ['文档与课程', 'doc'],
    ['视频课程', 'video'],
    ['书籍', 'book']
  ];
  const labelMap = { ppt: 'PPT / 课件', doc: '文档与课程', video: '视频课程', book: '书籍' };
  for (const key of ['ppt', 'doc', 'video', 'book']) {
    const list = (cat.resources && cat.resources[key]) || [];
    if (!list.length) continue;
    lines.push('### ' + labelMap[key]);
    lines.push('');
    for (const item of list) {
      const meta = [item.provider, item.level, item.type].filter(Boolean).join(' · ');
      lines.push('- **' + item.title + '**' + (meta ? '（' + meta + '）' : ''));
      if (item.url) lines.push('  - 链接：' + item.url);
      if (item.note) lines.push('  - 说明：' + item.note);
    }
    lines.push('');
  }

  lines.push('## 七、实战项目');
  lines.push('');
  for (const proj of cat.projects || []) {
    lines.push('### ' + proj.title);
    lines.push('');
    lines.push('- 难度：' + proj.level + '｜预计投入：' + proj.hours);
    lines.push('- 目标：' + proj.goal);
    lines.push('- 技术栈：' + (proj.stack || []).join('、'));
    lines.push('');
    lines.push('执行步骤：');
    lines.push('');
    (proj.steps || []).forEach((s, i) => lines.push((i + 1) + '. ' + s));
    lines.push('');
    lines.push('交付物：' + (proj.deliverables || []).join('；'));
    lines.push('');
  }

  lines.push('## 八、自测清单');
  lines.push('');
  for (const item of cat.checklist || []) lines.push('- [ ] ' + item);
  lines.push('');

  lines.push('## 九、常见问题');
  lines.push('');
  for (const item of cat.faq || []) {
    lines.push('**Q：' + item.q + '**');
    lines.push('');
    lines.push('A：' + item.a);
    lines.push('');
  }

  if (site && site.disclaimer) {
    lines.push('---');
    lines.push('');
    lines.push('### 免责声明');
    lines.push('');
    for (const d of site.disclaimer) lines.push('- ' + d);
    lines.push('');
  }

  return lines.join('\n');
}

function esc(text) {
  return String(text == null ? '' : text)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildHtml(cat, site) {
  const rows = resourcesFlat(cat);
  const labelMap = { ppt: 'PPT / 课件', doc: '文档与课程', video: '视频课程', book: '书籍' };

  let resourceHtml = '';
  for (const key of ['ppt', 'doc', 'video', 'book']) {
    const list = (cat.resources && cat.resources[key]) || [];
    if (!list.length) continue;
    resourceHtml += '<h3>' + labelMap[key] + '</h3><ul class="res">';
    for (const item of list) {
      const meta = [item.provider, item.level, item.type].filter(Boolean).join(' · ');
      resourceHtml += '<li><b>' + esc(item.title) + '</b>'
        + (meta ? ' <span class="meta">' + esc(meta) + '</span>' : '')
        + (item.url ? '<div class="url">' + esc(item.url) + '</div>' : '')
        + (item.note ? '<div class="note">' + esc(item.note) + '</div>' : '')
        + '</li>';
    }
    resourceHtml += '</ul>';
  }

  let roadmapHtml = '';
  for (const stage of cat.roadmap || []) {
    roadmapHtml += '<div class="card"><div class="card-head"><span class="stage">' + esc(stage.stage) + '</span>'
      + '<h3>' + esc(stage.title) + '</h3><span class="weeks">' + esc(stage.weeks) + '</span></div>'
      + '<p>' + esc(stage.desc) + '</p><ul>'
      + (stage.items || []).map((i) => '<li>' + esc(i) + '</li>').join('')
      + '</ul>' + (stage.output ? '<p class="out">' + esc(stage.output) + '</p>' : '') + '</div>';
  }

  let tocHtml = '';
  for (const mod of cat.toc || []) {
    tocHtml += '<div class="card"><div class="card-head"><h3>' + esc(mod.module) + '</h3><span class="weeks">'
      + esc(mod.hours) + '</span></div><ul class="lessons">';
    for (const lesson of mod.lessons || []) {
      tocHtml += '<li><b>' + esc(lesson.title) + '</b>'
        + (lesson.key && lesson.key.length ? '<div class="note">' + esc(lesson.key.join('；')) + '</div>' : '')
        + '</li>';
    }
    tocHtml += '</ul></div>';
  }

  let projHtml = '';
  for (const proj of cat.projects || []) {
    projHtml += '<div class="card"><div class="card-head"><h3>' + esc(proj.title) + '</h3>'
      + '<span class="weeks">' + esc(proj.level) + ' · ' + esc(proj.hours) + '</span></div>'
      + '<p>' + esc(proj.goal) + '</p>'
      + '<p class="note">技术栈：' + esc((proj.stack || []).join('、')) + '</p><ol>'
      + (proj.steps || []).map((s) => '<li>' + esc(s) + '</li>').join('')
      + '</ol><p class="out">交付物：' + esc((proj.deliverables || []).join('；')) + '</p></div>';
  }

  const checklistHtml = (cat.checklist || []).map((i) => '<li>' + esc(i) + '</li>').join('');
  const faqHtml = (cat.faq || []).map((f) => '<div class="faq"><b>Q：' + esc(f.q) + '</b><p>A：' + esc(f.a) + '</p></div>').join('');
  const highlightHtml = (cat.highlights || []).map((h) => '<div class="hl"><b>' + esc(h.title) + '</b><span>' + esc(h.desc) + '</span></div>').join('');

  return '<!DOCTYPE html>\n<html lang="zh-CN">\n<head>\n<meta charset="utf-8">\n'
    + '<meta name="viewport" content="width=device-width, initial-scale=1">\n'
    + '<title>' + esc(cat.name) + ' · 学习手册</title>\n<style>\n'
    + ':root{--accent:' + cat.color + '}'
    + '*{box-sizing:border-box}'
    + 'body{margin:0;background:#0b0f1a;color:#e6ebf7;font-family:"Microsoft YaHei","PingFang SC",system-ui,sans-serif;line-height:1.75}'
    + '.wrap{max-width:900px;margin:0 auto;padding:48px 28px 80px}'
    + 'header{border-left:6px solid var(--accent);padding-left:20px;margin-bottom:36px}'
    + 'h1{margin:0 0 8px;font-size:34px}'
    + '.tagline{color:#9aa6c4;font-size:17px}'
    + '.facts{display:flex;flex-wrap:wrap;gap:10px;margin-top:18px}'
    + '.facts span{background:#161d31;border:1px solid #26304a;border-radius:999px;padding:5px 14px;font-size:13px;color:#b9c3dc}'
    + 'h2{margin:44px 0 16px;font-size:23px;padding-bottom:10px;border-bottom:1px solid #222b42}'
    + 'h3{font-size:17px;margin:0}'
    + '.card{background:#121828;border:1px solid #202a42;border-radius:14px;padding:18px 20px;margin:14px 0}'
    + '.card-head{display:flex;align-items:center;gap:12px;flex-wrap:wrap}'
    + '.stage{background:var(--accent);color:#07101f;font-weight:700;font-size:12px;border-radius:6px;padding:3px 9px}'
    + '.weeks{margin-left:auto;color:#7d89a8;font-size:13px;white-space:nowrap}'
    + '.card p{color:#aab4cd;margin:10px 0}'
    + '.out{color:var(--accent) !important;font-weight:600}'
    + 'ul,ol{color:#c3cbe0;padding-left:22px}li{margin:5px 0}'
    + '.note{color:#7d89a8;font-size:13px}'
    + '.hl{display:flex;gap:10px;padding:9px 0;border-bottom:1px dashed #222b42;flex-wrap:wrap}'
    + '.hl b{min-width:150px;color:#fff}.hl span{color:#a3aec7}'
    + '.res{list-style:none;padding:0}.res li{background:#121828;border:1px solid #202a42;border-radius:10px;padding:12px 14px;margin:9px 0}'
    + '.url{color:var(--accent);font-size:12px;word-break:break-all;font-family:Consolas,monospace}'
    + '.faq{background:#121828;border:1px solid #202a42;border-radius:10px;padding:14px 16px;margin:10px 0}'
    + '.faq b{color:#fff}.faq p{margin:6px 0 0;color:#aab4cd}'
    + 'footer{margin-top:56px;padding-top:22px;border-top:1px solid #222b42;color:#6b7694;font-size:13px}'
    + '@media print{body{background:#fff;color:#111}.card,.res li,.faq{background:#f7f8fb;border-color:#dfe3ec}'
    + '.card p,.res .note,.hl span,.faq p,ul,ol{color:#333}.note,.url,.weeks{color:#666}h2{border-color:#ddd}}'
    + '</style>\n</head>\n<body>\n<div class="wrap">\n'
    + '<header><h1>' + esc(cat.icon + ' ' + cat.name) + '</h1><div class="tagline">' + esc(cat.tagline) + '</div>'
    + '<div class="facts"><span>' + esc(cat.level) + '</span><span>' + esc(cat.duration) + '</span>'
    + (cat.tags || []).map((t) => '<span>' + esc(t) + '</span>').join('') + '</div></header>\n'
    + '<h2>学习目标</h2><p>' + esc(cat.goal) + '</p>\n'
    + '<h2>领域概览</h2>' + (cat.overview || []).map((p) => '<p>' + esc(p) + '</p>').join('') + '\n'
    + '<h2>你会获得的能力</h2>' + highlightHtml + '\n'
    + '<h2>学习路线图</h2>' + roadmapHtml + '\n'
    + '<h2>详细目录</h2>' + tocHtml + '\n'
    + '<h2>精选学习资源</h2>' + resourceHtml + '\n'
    + '<h2>实战项目</h2>' + projHtml + '\n'
    + '<h2>自测清单</h2><ul>' + checklistHtml + '</ul>\n'
    + '<h2>常见问题</h2>' + faqHtml + '\n'
    + '<footer>由' + esc((site && site.app && site.app.name) || '进阶工作台') + ' 生成 · ' + new Date().toLocaleString('zh-CN') + '</footer>\n'
    + '</div>\n</body>\n</html>';
}

function buildCsv(cats, site) {
  const header = ['分类', '资料类型', '标题', '提供方', '难度', '链接', '说明'];
  const lines = [header.join(',')];
  for (const cat of cats) {
    for (const row of resourcesFlat(cat)) {
      const cells = [cat.name, row.kind, row.title, row.provider, row.level, row.url, row.note]
        .map((v) => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"');
      lines.push(cells.join(','));
    }
  }
  return '\ufeff' + lines.join('\r\n');
}

function buildDeck(cat, site) {
  const slides = [];
  slides.push({
    title: cat.name,
    kicker: cat.en,
    subtitle: cat.tagline + ' ｜ ' + cat.level + ' ｜ ' + cat.duration,
    footer: (site && site.app && site.app.name) || '进阶工作台'
  });

  slides.push({
    title: '学习目标',
    kicker: '为什么学这个',
    bullets: [cat.goal].concat((cat.highlights || []).slice(0, 5).map((h) => ({ text: h.title + '：' + h.desc, level: 1 })))
  });

  slides.push({
    title: '领域概览',
    kicker: '开始之前',
    bullets: (cat.overview || []).map((p) => ({ text: p.length > 120 ? p.slice(0, 118) + '……' : p, bullet: true }))
  });

  for (const stage of cat.roadmap || []) {
    slides.push({
      title: stage.title,
      kicker: stage.stage + ' · ' + stage.weeks,
      bullets: (stage.items || []).map((i) => ({ text: i })).concat(stage.output ? [{ text: stage.output, level: 1, bold: true }] : [])
    });
  }

  for (const mod of cat.toc || []) {
    slides.push({
      title: mod.module,
      kicker: '模块目录 · ' + mod.hours,
      bullets: (mod.lessons || []).map((l) => ({ text: l.title }))
    });
  }

  slides.push({
    title: '实战项目',
    kicker: '做完这些你就掌握了',
    bullets: (cat.projects || []).map((p) => ({ text: p.title + '（' + p.level + ' · ' + p.hours + '）' }))
  });

  slides.push({
    title: '精选资源',
    kicker: '去哪学',
    bullets: [
      { text: 'PPT / 课件：' + ((cat.resources.ppt || []).length) + ' 项' },
      { text: '文档与课程：' + ((cat.resources.doc || []).length) + ' 项' },
      { text: '视频课程：' + ((cat.resources.video || []).length) + ' 项' },
      { text: '书籍：' + ((cat.resources.book || []).length) + ' 项' },
      { text: '完整清单请查看随附的《学习资源清单.csv》', level: 1 }
    ]
  });

  slides.push({
    title: '自测清单',
    kicker: '学完请逐条核对',
    bullets: (cat.checklist || []).map((c) => ({ text: c }))
  });

  return buildPptx({ title: cat.name, accent: cat.color, slides });
}

function listProjectFiles(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  const walk = (current, prefix) => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      const rel = prefix ? prefix + '/' + entry.name : entry.name;
      if (entry.isDirectory()) walk(full, rel);
      else out.push({ name: rel, data: fs.readFileSync(full) });
    }
  };
  walk(dir, '');
  return out;
}

function buildStarterZip(rootDir, cats) {
  const entries = [];
  for (const cat of cats) {
    const dir = path.join(rootDir, 'content', 'projects', cat.id);
    for (const file of listProjectFiles(dir)) {
      entries.push({ name: safeName(cat.name) + '/' + file.name, data: file.data });
    }
  }
  if (!entries.length) {
    entries.push({ name: '说明.txt', data: '项目示例文件缺失。' });
  }
  entries.push({
    name: '项目示例使用说明.md',
    data: '# 项目示例使用说明\n\n每个文件夹对应一个知识领域的实战项目模板，可直接打开编辑：\n\n'
      + cats.map((c) => '- **' + c.name + '**：对应「' + c.name + '」领域的项目模板\n').join('')
      + '\n建议用法：先照模板填一版自己的内容，再对照网站里的项目步骤逐项执行。\n'
  });
  return createZip(entries);
}

function buildBundle(rootDir, cats, site) {
  const entries = [];
  const appName = (site && site.app && site.app.name) || '进阶工作台';

  entries.push({
    name: '00-学习指南.md',
    data: '# ' + appName + ' · 学习指南\n\n'
      + '导出时间：' + new Date().toLocaleString('zh-CN') + '\n\n'
      + '## 如何使用这套资料\n\n'
      + (site.howto || []).map((h) => h.step + '. **' + h.title + '**：' + h.desc).join('\n') + '\n\n'
      + '## 学习方法\n\n'
      + (site.method || []).map((m) => '- **' + m.title + '**：' + m.desc).join('\n') + '\n\n'
      + '## 内容清单\n\n'
      + cats.map((c) => '- ' + c.name + '：' + c.tagline + '（' + c.toc.length + ' 个模块 / ' + c.projects.length + ' 个实战项目）').join('\n') + '\n'
  });

  for (const cat of cats) {
    const folder = pad(cat.order) + '-' + safeName(cat.name);
    entries.push({ name: folder + '/学习手册.md', data: buildMarkdown(cat, site) });
    entries.push({ name: folder + '/学习手册.html', data: buildHtml(cat, site) });
    entries.push({ name: folder + '/课程大纲.pptx', data: buildDeck(cat, site) });
    const csv = ['资料类型,标题,提供方,难度,链接,说明'];
    for (const row of resourcesFlat(cat)) {
      csv.push([row.kind, row.title, row.provider, row.level, row.url, row.note]
        .map((v) => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"').join(','));
    }
    entries.push({ name: folder + '/学习资源清单.csv', data: '\ufeff' + csv.join('\r\n') });
  }

  entries.push({ name: '99-全部学习资源总表.csv', data: buildCsv(cats, site) });

  for (const cat of cats) {
    const dir = path.join(rootDir, 'content', 'projects', cat.id);
    for (const file of listProjectFiles(dir)) {
      entries.push({ name: '项目示例/' + safeName(cat.name) + '/' + file.name, data: file.data });
    }
  }

  entries.push({
    name: '免责声明.md',
    data: '# 免责声明\n\n' + (site.disclaimer || []).map((d) => '- ' + d).join('\n') + '\n'
  });

  return createZip(entries);
}

module.exports = { buildMarkdown, buildHtml, buildCsv, buildDeck, buildBundle, buildStarterZip, resourcesFlat, safeName, listProjectFiles };