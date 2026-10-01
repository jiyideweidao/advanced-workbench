'use strict';

(function () {
  const ws = window.workstation;
  const state = { site: null, categories: [], stats: null, route: { name: 'home' }, query: '' };
  const viewEl = document.getElementById('view');
  const navEl = document.getElementById('nav');
  const toastEl = document.getElementById('toast');
  const searchEl = document.getElementById('search');

  const RES_GROUPS = [
    { key: 'ppt', label: 'PPT / 课件', icon: '📊' },
    { key: 'doc', label: '文档与课程', icon: '📄' },
    { key: 'video', label: '视频课程', icon: '🎥' },
    { key: 'book', label: '书籍', icon: '📚' }
  ];

  function esc(text) {
    return String(text == null ? '' : text)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function attr(text) { return esc(text); }

  function catById(id) { return state.categories.find(function (c) { return c.id === id; }); }

  function toast(title, body, kind, action) {
    toastEl.className = 'toast show' + (kind ? ' ' + kind : '');
    toastEl.innerHTML = '<div class="t-title">' + esc(title) + '</div>'
      + (body ? '<div class="t-body">' + esc(body) + '</div>' : '')
      + (action ? '<button data-toast-action="1">' + esc(action.label) + '</button>' : '');
    if (action) {
      const btn = toastEl.querySelector('[data-toast-action]');
      btn.onclick = function () { action.run(); hideToast(); };
    }
    clearTimeout(toast._timer);
    toast._timer = setTimeout(hideToast, action ? 12000 : 4200);
  }

  function hideToast() { toastEl.className = 'toast'; }

  function scrollTop() { viewEl.scrollTo({ top: 0, behavior: 'auto' }); }

  function renderNav() {
    let html = '';
    html += '<button class="nav-item" data-nav="home"><span class="nav-ico">🏠</span><span class="nav-label">首页</span></button>';
    html += '<div class="nav-group">五大知识库</div>';
    for (const cat of state.categories) {
      const active = state.route.name === 'category' && state.route.id === cat.id;
      html += '<button class="nav-item' + (active ? ' active' : '') + '" data-nav="category" data-id="' + attr(cat.id) + '">'
        + '<span class="nav-ico">' + esc(cat.icon) + '</span>'
        + '<span class="nav-label">' + esc(cat.name) + '</span>'
        + '<span class="nav-badge">' + ((cat.toc || []).length) + '</span></button>';
    }
    html += '<div class="nav-group">资料与工具</div>';
    html += '<button class="nav-item" data-nav="downloads"><span class="nav-ico">⬇️</span><span class="nav-label">下载中心</span><span class="nav-badge">' + (state.stats ? state.stats.total : 0) + '</span></button>';
    html += '<button class="nav-item" data-nav="projects"><span class="nav-ico">🧪</span><span class="nav-label">项目示例</span><span class="nav-badge">' + (state.stats ? state.stats.projects : 0) + '</span></button>';
    html += '<button class="nav-item" data-nav="resources"><span class="nav-ico">🗂️</span><span class="nav-label">资源总表</span></button>';
    html += '<div class="nav-group">关于</div>';
    html += '<button class="nav-item" data-nav="method"><span class="nav-ico">🎯</span><span class="nav-label">学习方法</span></button>';
    html += '<button class="nav-item" data-nav="research"><span class="nav-ico">🔍</span><span class="nav-label">同类项目调研</span></button>';
    html += '<button class="nav-item" data-nav="about"><span class="nav-ico">ℹ️</span><span class="nav-label">关于本程序</span></button>';
    navEl.innerHTML = html;
  }

  function navigate(name, id) {
    state.route = { name: name, id: id };
    state.query = '';
    searchEl.value = '';
    renderNav();
    if (name === 'home') renderHome();
    else if (name === 'category') renderCategory(id);
    else if (name === 'downloads') renderDownloads();
    else if (name === 'projects') renderProjects();
    else if (name === 'resources') renderResources();
    else if (name === 'method') renderMethod();
    else if (name === 'research') renderResearch();
    else if (name === 'about') renderAbout();
    else renderHome();
    scrollTop();
  }

  function renderHome() {
    const s = state.stats;
    const counts = {
      modules: s ? s.modules : 0,
      lessons: s ? s.lessons : 0,
      resources: s ? s.total : 0,
      projects: s ? s.projects : 0
    };
    let catCards = '';
    for (const cat of state.categories) {
      const mods = (cat.toc || []).length;
      const projs = (cat.projects || []).length;
      const resCount = RES_GROUPS.reduce(function (acc, g) { return acc + ((cat.resources[g.key] || []).length); }, 0);
      catCards += '<button class="cat-card" style="--card-accent:' + attr(cat.color) + '" data-nav="category" data-id="' + attr(cat.id) + '">'
        + '<div class="cat-card-top"><div class="cat-ico">' + esc(cat.icon) + '</div>'
        + '<h3>' + esc(cat.name) + '<small>' + esc(cat.en) + '</small></h3></div>'
        + '<p>' + esc(cat.tagline) + '</p>'
        + '<div class="cat-meta"><span class="chip">' + mods + ' 个模块</span>'
        + '<span class="chip">' + projs + ' 个实战项目</span>'
        + '<span class="chip">' + resCount + ' 条资源</span>'
        + '<span class="chip">' + esc(cat.duration) + '</span></div></button>';
    }
    const steps = (state.site.howto || []).map(function (h) {
      return '<div class="step-card"><div class="step-num">' + esc(h.step) + '</div><h4>' + esc(h.title) + '</h4><p>' + esc(h.desc) + '</p></div>';
    }).join('');
    const methods = (state.site.method || []).map(function (m) {
      return '<div class="method-item"><b>' + esc(m.title) + '</b><span>' + esc(m.desc) + '</span></div>';
    }).join('');
    const hero = state.site.hero;

    viewEl.innerHTML = '<div class="page">'
      + '<section class="hero">'
      + '<span class="hero-kicker">' + esc(hero.kicker) + '</span>'
      + '<h1>' + esc(hero.title) + '</h1>'
      + '<p class="lead">' + esc(hero.subtitle) + '</p>'
      + '<div class="hero-actions">'
      + '<button class="btn primary" data-nav="category" data-id="' + attr(state.categories[0].id) + '">▶ ' + esc(hero.primaryAction) + '</button>'
      + '<button class="btn" data-nav="downloads">⬇ ' + esc(hero.secondaryAction) + '</button>'
      + '<button class="btn" data-nav="research">🔍 看看同类开源项目</button>'
      + '</div></section>'
      + '<div class="stats">'
      + '<div class="stat"><b>' + state.categories.length + '</b><span>知识领域</span></div>'
      + '<div class="stat"><b>' + counts.modules + '</b><span>学习模块</span></div>'
      + '<div class="stat"><b>' + counts.lessons + '</b><span>课程条目</span></div>'
      + '<div class="stat"><b>' + counts.resources + '</b><span>精选资源</span></div>'
      + '<div class="stat"><b>' + counts.projects + '</b><span>实战项目</span></div>'
      + '</div>'
      + '<section class="section"><div class="section-head"><h2>五大知识库</h2><p>点击进入完整的学习路线、目录、资源与项目</p></div>'
      + '<div class="cat-grid">' + catCards + '</div></section>'
      + '<section class="section"><div class="section-head"><h2>怎么用这个工作站</h2><p>四步建立你的学习节奏</p></div>'
      + '<div class="steps">' + steps + '</div></section>'
      + '<section class="section"><div class="section-head"><h2>学习方法</h2><p>决定成败的不是信息量，而是这几条</p></div>'
      + '<div class="method-list">' + methods + '</div></section>'
      + '<section class="section"><div class="section-head"><h2>下载中心</h2><p>把整套资料导成 PPT / 文档 / 表格带走吧</p>'
      + '<span class="spacer"></span><button class="btn small" data-nav="downloads">进入下载中心 →</button></div>'
      + renderDownloadSummary() + '</section>'
      + '</div>';
  }

  function renderDownloadSummary() {
    return '<div class="dl-grid">'
      + dlCard('全部资料包', 'zip', '一键导出五大知识库的全部内容：Markdown 笔记 + HTML 手册 + PPT 大纲 + 资源清单 + 项目示例代码。', 'bundle', null, 'ZIP')
      + dlCard('全部资源清单', 'cal', '一张 CSV 表格装下所有 ' + (state.stats ? state.stats.total : 0) + ' 条精选资源，含链接与说明，可直接用 Excel 打开。', 'resources-all', null, 'CSV')
      + dlCard('项目示例代码包', 'zip', '五大领域共 ' + (state.stats ? state.stats.projects : 0) + ' 个实战项目的模板文件，开箱即用。', 'starter', null, 'ZIP')
      + '</div>';
  }

  function dlCard(title, extClass, desc, format, catId, extLabel) {
    const fmt = format || null;
    return '<div class="dl-card"><h3>' + esc(title)
      + '<span class="dl-ext ' + extClass + '">' + esc(extLabel || extClass.toUpperCase()) + '</span></h3>'
      + '<p class="dl-desc">' + esc(desc) + '</p>'
      + '<div class="dl-actions">'
      + (fmt ? '<button class="btn primary small" data-save="' + attr(fmt) + '"' + (catId ? ' data-cat="' + attr(catId) + '"' : '') + '>下载</button>' : '')
      + '</div></div>';
  }
  function renderCategory(id) {
    const cat = catById(id);
    if (!cat) { renderHome(); return; }

    const overview = (cat.overview || []).map(function (p) { return '<p class="para">' + esc(p) + '</p>'; }).join('');

    const highlights = (cat.highlights || []).map(function (h) {
      return '<div class="hl-item"><b>' + esc(h.title) + '</b><span>' + esc(h.desc) + '</span></div>';
    }).join('');

    const roadmap = (cat.roadmap || []).map(function (st) {
      return '<div class="rm-item"><div class="rm-stage"><b>' + esc(st.stage) + '</b><span>' + esc(st.weeks) + '</span></div>'
        + '<div class="rm-body"><h4>' + esc(st.title) + '</h4><p>' + esc(st.desc) + '</p><ul>'
        + (st.items || []).map(function (i) { return '<li>' + esc(i) + '</li>'; }).join('')
        + '</ul>' + (st.output ? '<span class="rm-output">' + esc(st.output) + '</span>' : '') + '</div></div>';
    }).join('');

    const toc = (cat.toc || []).map(function (mod) {
      return '<div class="toc-mod"><div class="toc-mod-head"><h4>' + esc(mod.module) + '</h4>'
        + '<span class="toc-hours">' + esc(mod.hours) + '</span></div><div class="toc-lessons">'
        + (mod.lessons || []).map(function (l) {
          return '<div class="toc-lesson"><b>' + esc(l.title) + '</b>'
            + (l.key && l.key.length ? '<div class="toc-keys">要点：' + esc(l.key.join(' · ')) + '</div>' : '')
            + '</div>';
        }).join('')
        + '</div></div>';
    }).join('');

    let resources = '';
    for (const g of RES_GROUPS) {
      const list = (cat.resources[g.key] || []);
      if (!list.length) continue;
      resources += '<div class="res-group"><div class="res-group-head"><h3>' + g.icon + ' ' + g.label + '</h3>'
        + '<span class="res-count">' + list.length + ' 项</span></div><div class="res-list">'
        + list.map(function (item) { return resItem(item); }).join('')
        + '</div></div>';
    }

    const projects = (cat.projects || []).map(function (p) {
      return '<div class="proj-card"><div class="proj-head"><h3>' + esc(p.title) + '</h3>'
        + '<span class="chip">' + esc(p.level) + '</span><span class="chip">' + esc(p.hours) + '</span></div>'
        + '<p class="proj-goal">' + esc(p.goal) + '</p>'
        + '<div class="proj-stack">' + (p.stack || []).map(function (s) { return '<span class="chip">' + esc(s) + '</span>'; }).join('') + '</div>'
        + '<ol class="proj-steps">' + (p.steps || []).map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ol>'
        + '<div class="proj-deliver">交付物：' + esc((p.deliverables || []).join('；')) + '</div></div>';
    }).join('');

    const checklist = (cat.checklist || []).map(function (c) {
      return '<li><span class="check-box"></span><span>' + esc(c) + '</span></li>';
    }).join('');

    const faq = (cat.faq || []).map(function (f) {
      return '<div class="faq-item"><b>Q：' + esc(f.q) + '</b><p>A：' + esc(f.a) + '</p></div>';
    }).join('');

    viewEl.innerHTML = '<div class="page" style="--accent:' + attr(cat.color) + '">'
      + '<div class="detail-head"><h1>' + esc(cat.icon) + ' ' + esc(cat.name) + '</h1>'
      + '<p class="tagline">' + esc(cat.tagline) + '</p>'
      + '<div class="chips"><span class="chip">' + esc(cat.level) + '</span><span class="chip">' + esc(cat.duration) + '</span>'
      + (cat.tags || []).map(function (t) { return '<span class="chip">' + esc(t) + '</span>'; }).join('') + '</div></div>'

      + '<div class="subnav">'
      + '<a data-scroll="sec-overview">概览</a><a data-scroll="sec-roadmap">学习路线图</a>'
      + '<a data-scroll="sec-toc">详细目录</a><a data-scroll="sec-res">精选资源</a>'
      + '<a data-scroll="sec-proj">实战项目</a><a data-scroll="sec-check">自测清单</a>'
      + '<a data-scroll="sec-faq">常见问题</a><a data-scroll="sec-dl">下载资料</a>'
      + '</div>'

      + '<div class="block" id="sec-overview"><h2>学习目标与概览</h2>'
      + '<div class="goal-box">' + esc(cat.goal) + '</div>' + overview
      + '<h3 style="font-size:15.5px;margin:24px 0 12px">你会获得的能力</h3>'
      + '<div class="hl-grid">' + highlights + '</div></div>'

      + '<div class="block" id="sec-roadmap"><h2>学习路线图<span class="hint">按阶段推进，每个阶段都有明确产出</span></h2>' + roadmap + '</div>'
      + '<div class="block" id="sec-toc"><h2>详细目录<span class="hint">' + (cat.toc || []).length + ' 个模块</span></h2>' + toc + '</div>'
      + '<div class="block" id="sec-res"><h2>精选学习资源<span class="hint">点击按钮用系统浏览器打开</span></h2>' + resources + '</div>'
      + '<div class="block" id="sec-proj"><h2>实战项目<span class="hint">做完就是作品集</span></h2>' + projects + '</div>'
      + '<div class="block" id="sec-check"><h2>自测清单<span class="hint">逐条核对，未通过就回去补课</span></h2>'
      + '<ul class="check-list">' + checklist + '</ul></div>'
      + '<div class="block" id="sec-faq"><h2>常见问题</h2>' + faq + '</div>'

      + '<div class="block" id="sec-dl"><h2>下载本领域资料</h2>'
      + '<div class="dl-grid">'
      + dlCard(cat.name + ' · 学习手册（Markdown）', 'doc', '纯文本笔记，含目标、路线图、目录、资源、项目与自测清单，可导入任何笔记软件。', 'md', cat.id, 'MD')
      + dlCard(cat.name + ' · 学习手册（网页）', 'doc', '排版好的单文件网页，双击即可在浏览器打开，支持打印成 PDF。', 'html', cat.id, 'HTML')
      + dlCard(cat.name + ' · 课程大纲', 'ppt', '真正可编辑的 PPTX 文件，含封面、路线图、模块目录、项目与自测，可直接改配色用于分享。', 'pptx', cat.id, 'PPTX')
      + dlCard(cat.name + ' · 学习手册（PDF）', 'pdf', '由程序内置引擎渲染的中文 PDF，适合打印和发给别人。', 'pdf', cat.id, 'PDF')
      + dlCard(cat.name + ' · 资源清单', 'cal', '本领域全部资源的表格版，含链接、提供方、难度与说明。', 'csv', cat.id, 'CSV')
      + '</div></div>'
      + '</div>';
  }

  function resItem(item) {
    const isLocal = item.local === true || !item.url;
    const meta = [item.provider, item.level, item.type].filter(Boolean).join(' · ');
    return '<div class="res-item"><div class="res-body">'
      + '<div class="res-title">' + esc(item.title)
      + (isLocal ? '<span class="res-tag local">本站生成</span>' : '<span class="res-tag">外部链接</span>')
      + '</div>'
      + (meta ? '<div class="res-meta">' + esc(meta) + '</div>' : '')
      + (item.note ? '<div class="res-note">' + esc(item.note) + '</div>' : '')
      + (item.url ? '<div class="res-url">' + esc(item.url) + '</div>' : '')
      + '</div>'
      + (item.url ? '<button class="res-open" data-open="' + attr(item.url) + '">打开</button>'
                  : '<button class="res-open" data-nav="downloads">下载</button>')
      + '</div>';
  }
  function renderDownloads() {
    let catCards = '';
    for (const cat of state.categories) {
      catCards += '<div class="dl-card"><h3>' + esc(cat.icon) + ' ' + esc(cat.name)
        + '<span class="dl-ext">合集</span></h3>'
        + '<p class="dl-desc">' + esc(cat.tagline) + '</p>'
        + '<div class="dl-actions">'
        + '<button class="btn small" data-save="md" data-cat="' + attr(cat.id) + '">MD 笔记</button>'
        + '<button class="btn small" data-save="html" data-cat="' + attr(cat.id) + '">HTML</button>'
        + '<button class="btn small" data-save="pptx" data-cat="' + attr(cat.id) + '">PPTX</button>'
        + '<button class="btn small" data-save="pdf" data-cat="' + attr(cat.id) + '">PDF</button>'
        + '<button class="btn small" data-save="csv" data-cat="' + attr(cat.id) + '">CSV</button>'
        + '</div></div>';
    }

    viewEl.innerHTML = '<div class="page">'
      + '<div class="hero" style="padding-bottom:0"><span class="hero-kicker">Download Center</span>'
      + '<h1 style="font-size:34px">下载中心</h1>'
      + '<p class="lead">所有资料都由本程序在本地生成，不需要联网。默认保存位置为「文档 / 进阶工作台资料」文件夹。</p>'
      + '<div class="hero-actions"><button class="btn" data-open-dir="1">📂 打开下载目录</button>'
      + '<button class="btn" data-nav="resources">🗂️ 先看资源总表</button></div></div>'

      + '<section class="section"><div class="section-head"><h2>打包下载</h2><p>一次拿走整套资料</p></div>'
      + '<div class="dl-grid">'
      + dlCard('全部资料包', 'zip', '五大知识库完整导出：Markdown 笔记 + HTML 手册 + PPT 大纲 + 资源清单 + 项目示例代码 + 免责声明。', 'bundle', null, 'ZIP')
      + dlCard('项目示例代码包', 'zip', '五大领域的实战项目模板文件，解压即可编辑使用。', 'starter', null, 'ZIP')
      + dlCard('全部资源清单', 'cal', '所有 ' + (state.stats ? state.stats.total : 0) + ' 条资源汇总成一张表，含提供方、难度、链接与说明。', 'resources-all', null, 'CSV')
      + '</div></section>'

      + '<section class="section"><div class="section-head"><h2>按领域下载</h2><p>每个领域五种格式，覆盖 PPT / 文档 / 表格</p></div>'
      + '<div class="dl-grid">' + catCards + '</div></section>'

      + '<section class="section"><div class="section-head"><h2>格式说明</h2></div>'
      + '<div class="table-wrap"><table><thead><tr><th>格式</th><th>用途</th><th>打开方式</th></tr></thead><tbody>'
      + '<tr><td>PPTX</td><td>可直接编辑的幻灯片大纲，用于分享或自学复盘</td><td>PowerPoint / WPS / Keynote</td></tr>'
      + '<tr><td>PDF</td><td>排版固定的中文手册，适合打印与传阅</td><td>任意 PDF 阅读器</td></tr>'
      + '<tr><td>Markdown</td><td>纯文本笔记，便于二次编辑与导入知识库</td><td>VS Code / Obsidian / Typora</td></tr>'
      + '<tr><td>HTML</td><td>单文件网页，双击即可打开，也可另存为 PDF</td><td>任意浏览器</td></tr>'
      + '<tr><td>CSV</td><td>资源清单表格，可筛选排序</td><td>Excel / WPS 表格</td></tr>'
      + '<tr><td>ZIP</td><td>打包合集，含多个分类文件夹</td><td>系统自带解压</td></tr>'
      + '</tbody></table></div></section>'
      + '</div>';
  }

  function renderProjects() {
    let html = '';
    for (const cat of state.categories) {
      html += '<div class="section" style="margin-top:34px"><div class="section-head">'
        + '<h2>' + esc(cat.icon) + ' ' + esc(cat.name) + '</h2><p>' + (cat.projects || []).length + ' 个实战项目</p>'
        + '<span class="spacer"></span><button class="btn small" data-nav="category" data-id="' + attr(cat.id) + '">进入领域 →</button></div>';
      for (const p of (cat.projects || [])) {
        html += '<div class="proj-card"><div class="proj-head"><h3>' + esc(p.title) + '</h3>'
          + '<span class="chip">' + esc(p.level) + '</span><span class="chip">' + esc(p.hours) + '</span></div>'
          + '<p class="proj-goal">' + esc(p.goal) + '</p>'
          + '<div class="proj-stack">' + (p.stack || []).map(function (s) { return '<span class="chip">' + esc(s) + '</span>'; }).join('') + '</div>'
          + '<ol class="proj-steps">' + (p.steps || []).map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ol>'
          + '<div class="proj-deliver">交付物：' + esc((p.deliverables || []).join('；')) + '</div></div>';
      }
      html += '</div>';
    }

    viewEl.innerHTML = '<div class="page">'
      + '<div class="hero" style="padding-bottom:0"><span class="hero-kicker">Projects</span>'
      + '<h1 style="font-size:34px">项目示例</h1>'
      + '<p class="lead">共 ' + (state.stats ? state.stats.projects : 0) + ' 个实战项目。每个项目都给出目标、技术栈、执行步骤与交付物——做完即可放进作品集。</p>'
      + '<div class="hero-actions"><button class="btn primary" data-save="starter">⬇ 下载项目模板代码包</button></div></div>'
      + html + '</div>';
  }

  function shortUrl(url) {
    try {
      const u = new URL(url);
      const isSearch = u.pathname.indexOf('search') >= 0 || u.search.length > 0;
      const tail = (u.pathname === '/' ? '' : u.pathname);
      return u.hostname.replace(/^www\./, '') + tail + (isSearch ? '（搜索）' : '');
    } catch (err) { return url; }
  }

  function renderResources() {
    let rows = '';
    for (const cat of state.categories) {
      for (const g of RES_GROUPS) {
        for (const item of (cat.resources[g.key] || [])) {
          rows += '<tr><td>' + esc(cat.icon + ' ' + cat.name) + '</td><td>' + esc(g.label) + '</td>'
            + '<td>' + esc(item.title) + '</td><td>' + esc(item.provider || '—') + '</td>'
            + '<td>' + esc(item.level || '—') + '</td>'
            + '<td>' + (item.url ? '<a href="#" data-open="' + attr(item.url) + '">' + esc(shortUrl(item.url)) + '</a>' : '本站生成') + '</td>'
            + '</tr>';
        }
      }
    }
    viewEl.innerHTML = '<div class="page">'
      + '<div class="hero" style="padding-bottom:0"><span class="hero-kicker">Resource Index</span>'
      + '<h1 style="font-size:34px">学习资源总表</h1>'
      + '<p class="lead">全部 ' + (state.stats ? state.stats.total : 0) + ' 条精选资源，按领域与类型整理。点击链接会用系统默认浏览器打开。</p>'
      + '<div class="hero-actions"><button class="btn primary" data-save="resources-all">⬇ 导出为 CSV 表格</button>'
      + '<button class="btn" data-nav="downloads">下载中心</button></div></div>'
      + '<section class="section"><div class="table-wrap"><table><thead><tr>'
      + '<th>领域</th><th>类型</th><th>资源</th><th>提供方</th><th>难度</th><th>链接</th>'
      + '</tr></thead><tbody>' + rows + '</tbody></table></div></section></div>';
  }
  function renderMethod() {
    const methods = (state.site.method || []).map(function (m) {
      return '<div class="method-item"><b>' + esc(m.title) + '</b><span>' + esc(m.desc) + '</span></div>';
    }).join('');
    const steps = (state.site.howto || []).map(function (h) {
      return '<div class="step-card"><div class="step-num">' + esc(h.step) + '</div><h4>' + esc(h.title) + '</h4><p>' + esc(h.desc) + '</p></div>';
    }).join('');

    viewEl.innerHTML = '<div class="page">'
      + '<div class="hero" style="padding-bottom:0"><span class="hero-kicker">Method</span>'
      + '<h1 style="font-size:34px">学习方法</h1>'
      + '<p class="lead">同样一份资料，有人学完能接单，有人学完就忘。差别通常不在学习时长，而在这几条原则。</p></div>'
      + '<section class="section"><div class="section-head"><h2>四步建立节奏</h2></div><div class="steps">' + steps + '</div></section>'
      + '<section class="section"><div class="section-head"><h2>四条核心原则</h2></div><div class="method-list">' + methods + '</div></section>'
      + '<section class="section"><div class="section-head"><h2>每周节奏建议</h2></div>'
      + '<div class="table-wrap"><table><thead><tr><th>时间</th><th>做什么</th><th>为什么</th></tr></thead><tbody>'
      + '<tr><td>周一至周五 · 每天 1.5-2 小时</td><td>按模块推进：先看 30 分钟资料，再动手 60-90 分钟</td><td>输入与输出比例控制在 1:2，避免「看会了但写不出」</td></tr>'
      + '<tr><td>周六 · 3-4 小时</td><td>集中做项目，把本周所学拼成一件完整作品</td><td>项目是唯一能证明能力的东西</td></tr>'
      + '<tr><td>周日 · 1 小时</td><td>复盘：填写自测清单，记录卡点，安排下周计划</td><td>没有复盘的练习会重复犯同样的错</td></tr>'
      + '<tr><td>每 4 周</td><td>阶段性交付：把成果发到公开平台或给真实用户看</td><td>真实反馈比自我评估准确得多</td></tr>'
      + '</tbody></table></div></section>'
      + '</div>';
  }

  function renderResearch() {
    const r = state.site.similarProjects;
    const items = (r.items || []).map(function (p) {
      return '<div class="research-card"><h4>' + esc(p.name) + '<span class="star">★ ' + esc(p.stars) + '</span></h4>'
        + '<p>' + esc(p.what) + '</p>'
        + '<p class="learn">💡 可借鉴：' + esc(p.learn) + '</p>'
        + '<p><a href="#" data-open="' + attr(p.url) + '">' + esc(p.url) + '</a></p></div>';
    }).join('');

    viewEl.innerHTML = '<div class="page">'
      + '<div class="hero" style="padding-bottom:0"><span class="hero-kicker">Research</span>'
      + '<h1 style="font-size:34px">同类项目调研</h1>'
      + '<p class="lead">' + esc(r.note) + '</p></div>'
      + '<section class="section"><div class="section-head"><h2>GitHub 上找到的相关项目</h2><p>共 ' + (r.items || []).length + ' 个</p></div>'
      + items + '</section>'
      + '<section class="section"><div class="section-head"><h2>调研结论</h2></div>'
      + '<div class="table-wrap"><table><thead><tr><th>现有项目类型</th><th>优势</th><th>缺少什么</th></tr></thead><tbody>'
      + '<tr><td>通用笔记 / 知识库（Trilium、Nevo、归知）</td><td>结构灵活、可扩展、适合长期沉淀</td><td>没有成体系的学习路线与项目任务，需要自己从零组织内容</td></tr>'
      + '<tr><td>本地课程播放器（Media-Reader-App）</td><td>离线播放、进度跟踪体验好</td><td>只解决「看」的问题，不提供学习路径与实战项目</td></tr>'
      + '<tr><td>LLM 知识库（Memora、ZenWiki）</td><td>AI 自动整理与问答能力强</td><td>依赖模型与网络，首次使用门槛高，与具体变现技能无关</td></tr>'
      + '<tr><td>离线 LMS（our-africa-desktop）</td><td>课程 / 进度 / 证书数据模型完整</td><td>面向机构教学，缺少个人副业变现场景的实操内容</td></tr>'
      + '</tbody></table></div></section>'
      + '<section class="section"><div class="section-head"><h2>本项目的取舍</h2></div>'
      + '<div class="method-list">'
      + '<div class="method-item"><b>自建而非套用</b><span>没找到「五大变现技能 + 路线图 + 实战项目 + 可下载资料」的现成方案，因此用 Electron 自建。</span></div>'
      + '<div class="method-item"><b>离线优先</b><span>所有内容与导出都在本地完成，不依赖任何服务器或 API，断网也能用。</span></div>'
      + '<div class="method-item"><b>内容即数据</b><span>知识内容放在 content 目录的 JSON 里，改内容不需要动程序代码，方便你自己扩充第六条、第七条路径。</span></div>'
      + '<div class="method-item"><b>不重复造轮子</b><span>检索、AI 问答等能力建议直接借鉴上面这些项目的实现，而不是在本程序里重写。</span></div>'
      + '</div></section></div>';
  }

  async function renderAbout() {
    const info = await ws.appInfo();
    viewEl.innerHTML = '<div class="page">'
      + '<div class="hero" style="padding-bottom:0"><span class="hero-kicker">About</span>'
      + '<h1 style="font-size:34px">关于本程序</h1>'
      + '<p class="lead">' + esc(state.site.app.description) + '</p></div>'
      + '<section class="section"><div class="section-head"><h2>程序信息</h2></div>'
      + '<dl class="info-table">'
      + '<dt>程序名称</dt><dd>' + esc(info.name) + ' ' + esc(info.version) + '</dd>'
      + '<dt>运行框架</dt><dd>Electron ' + esc(info.electron) + ' / Chromium ' + esc(info.chrome) + ' / Node ' + esc(info.node) + '</dd>'
      + '<dt>内容更新</dt><dd>' + esc(state.site.app.updated) + '</dd>'
      + '<dt>程序目录</dt><dd>' + esc(info.programDir) + '</dd>'
      + '<dt>下载目录</dt><dd>' + esc(info.downloadDir) + '</dd>'
      + '</dl>'
      + '<div class="hero-actions" style="margin-top:18px">'
      + '<button class="btn" data-open-dir="1">📂 打开下载目录</button>'
      + '<button class="btn" data-open-prog="1">📁 打开程序目录</button>'
      + '<button class="btn" data-nav="downloads">⬇ 下载中心</button></div></section>'

      + '<section class="section"><div class="section-head"><h2>使用说明</h2></div>'
      + '<div class="table-wrap"><table><thead><tr><th>操作</th><th>结果</th></tr></thead><tbody>'
      + '<tr><td>双击启动图标</td><td>打开主界面；若程序已在运行，会直接唤起已有窗口，不会重复启动（单实例）</td></tr>'
      + '<tr><td>点击标题栏最小化按钮</td><td>窗口隐藏到系统托盘，程序继续在后台运行</td></tr>'
      + '<tr><td>双击托盘图标 / 单击托盘图标</td><td>重新显示主界面</td></tr>'
      + '<tr><td>点击标题栏关闭按钮</td><td>完全退出程序（托盘图标一并消失）</td></tr>'
      + '<tr><td>托盘右键菜单 → 退出程序</td><td>完全退出程序</td></tr>'
      + '<tr><td>F12 或 Ctrl+Shift+I</td><td>打开开发者工具（排查问题时使用）</td></tr>'
      + '</tbody></table></div></section>'

      + '<section class="section"><div class="section-head"><h2>免责声明</h2></div>'
      + '<div class="note-box"><h4>请务必阅读</h4><ul>'
      + (state.site.disclaimer || []).map(function (d) { return '<li>' + esc(d) + '</li>'; }).join('')
      + '</ul></div></section>'
      + '</div>';
  }
  function runSearch(q) {
    const query = q.trim().toLowerCase();
    state.query = query;
    if (!query) { navigate('home'); return; }

    const hits = [];
    for (const cat of state.categories) {
      if ((cat.name + cat.en + cat.tagline).toLowerCase().indexOf(query) >= 0) {
        hits.push({ kind: '知识库', title: cat.icon + ' ' + cat.name, sub: cat.tagline, nav: 'category', id: cat.id });
      }
      for (const g of RES_GROUPS) {
        for (const item of (cat.resources[g.key] || [])) {
          const hay = (item.title + ' ' + (item.provider || '') + ' ' + (item.note || '') + ' ' + g.label).toLowerCase();
          if (hay.indexOf(query) >= 0) {
            hits.push({
              kind: g.label,
              title: item.title,
              sub: cat.name + ' · ' + (item.provider || '') + ' · ' + (item.note || ''),
              url: item.url,
              nav: item.url ? null : 'downloads'
            });
          }
        }
      }
      for (const mod of (cat.toc || [])) {
        for (const lesson of (mod.lessons || [])) {
          const hay = (lesson.title + ' ' + (lesson.key || []).join(' ')).toLowerCase();
          if (hay.indexOf(query) >= 0) {
            hits.push({ kind: '课程', title: lesson.title, sub: cat.name + ' · ' + mod.module, nav: 'category', id: cat.id });
          }
        }
      }
      for (const p of (cat.projects || [])) {
        const hay = (p.title + ' ' + p.goal + ' ' + (p.stack || []).join(' ')).toLowerCase();
        if (hay.indexOf(query) >= 0) {
          hits.push({ kind: '项目', title: p.title, sub: cat.name + ' · ' + p.level + ' · ' + p.hours, nav: 'projects' });
        }
      }
      for (const f of (cat.faq || [])) {
        if ((f.q + f.a).toLowerCase().indexOf(query) >= 0) {
          hits.push({ kind: '问答', title: f.q, sub: cat.name, nav: 'category', id: cat.id });
        }
      }
    }

    renderNav();
    if (!hits.length) {
      viewEl.innerHTML = '<div class="page"><section class="section"><div class="section-head"><h2>没有找到「' + esc(q) + '」相关的内容</h2></div>'
        + '<div class="empty">试试更短的关键词，例如「报价」「剪辑」「提示词」「SEO」。</div></section></div>';
      scrollTop();
      return;
    }

    let html = '';
    for (const h of hits.slice(0, 80)) {
      if (h.url) {
        html += '<button class="search-hit" data-open="' + attr(h.url) + '">'
          + '<div class="kind">' + esc(h.kind) + ' · 外部链接</div>'
          + '<div class="title">' + esc(h.title) + '</div>'
          + '<div class="sub">' + esc(h.sub) + '</div></button>';
      } else {
        html += '<button class="search-hit" data-nav="' + attr(h.nav) + '"' + (h.id ? ' data-id="' + attr(h.id) + '"' : '') + '>'
          + '<div class="kind">' + esc(h.kind) + '</div>'
          + '<div class="title">' + esc(h.title) + '</div>'
          + '<div class="sub">' + esc(h.sub) + '</div></button>';
      }
    }

    viewEl.innerHTML = '<div class="page">'
      + '<div class="hero" style="padding-bottom:0"><span class="hero-kicker">Search</span>'
      + '<h1 style="font-size:30px">「' + esc(q) + '」的搜索结果</h1>'
      + '<p class="lead">共找到 ' + hits.length + ' 条结果' + (hits.length > 80 ? '（仅显示前 80 条）' : '') + '。</p></div>'
      + '<section class="section"><div class="search-res">' + html + '</div></section></div>';
    scrollTop();
  }

  async function doSave(format, catId, btn) {
    if (btn) { btn.disabled = true; btn.dataset.original = btn.textContent; btn.textContent = '生成中…'; }
    try {
      const res = await ws.save({ format: format, categoryId: catId });
      if (res && res.ok) {
        const name = res.path.split(/[\\/]/).pop();
        toast('已保存', name + '\n位置：' + res.path, 'ok', {
          label: '在文件夹中显示',
          run: function () { ws.reveal(res.path); }
        });
      } else if (res && res.canceled) {
        toast('已取消保存', '没有生成文件。');
      } else {
        toast('生成失败', (res && res.error) || '未知错误', 'err');
      }
    } catch (err) {
      toast('生成失败', String(err && err.message ? err.message : err), 'err');
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = btn.dataset.original || '下载'; }
    }
  }

  document.addEventListener('click', function (ev) {
    const target = ev.target.closest('[data-nav], [data-open], [data-save], [data-scroll], [data-open-dir], [data-open-prog]');
    if (!target) return;

    if (target.dataset.open) {
      ev.preventDefault();
      ws.openExternal(target.dataset.open);
      return;
    }
    if (target.dataset.nav) {
      ev.preventDefault();
      navigate(target.dataset.nav, target.dataset.id);
      return;
    }
    if (target.dataset.save) {
      ev.preventDefault();
      doSave(target.dataset.save, target.dataset.cat, target);
      return;
    }
    if (target.dataset.scroll) {
      ev.preventDefault();
      const el = document.getElementById(target.dataset.scroll);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    if (target.dataset.openDir) {
      ev.preventDefault();
      ws.openDownloadDir().then(function (dir) { toast('已打开下载目录', dir); });
      return;
    }
    if (target.dataset.openProg) {
      ev.preventDefault();
      ws.openProgramDir();
    }
  });

  let searchTimer = null;
  searchEl.addEventListener('input', function () {
    clearTimeout(searchTimer);
    const value = searchEl.value;
    searchTimer = setTimeout(function () { runSearch(value); }, 180);
  });
  searchEl.addEventListener('keydown', function (ev) {
    if (ev.key === 'Escape') { searchEl.value = ''; runSearch(''); }
  });

  document.getElementById('brand').addEventListener('click', function () { navigate('home'); });
  document.getElementById('btn-downloads').addEventListener('click', function () { navigate('downloads'); });
  document.getElementById('btn-programs').addEventListener('click', function () { ws.openProgramDir(); });
  document.getElementById('btn-hide').addEventListener('click', function () { ws.hideWindow(); });
  document.getElementById('btn-quit').addEventListener('click', function () { ws.quitApp(); });

  ws.onNavigate(function (name) {
    if (name === 'about') navigate('about');
  });

  async function boot() {
    const data = await ws.loadCatalog();
    state.site = data.site;
    state.categories = data.categories;
    state.stats = data.stats;
    state.version = data.version;
    renderNav();
    renderHome();
  }

  boot().catch(function (err) {
    viewEl.innerHTML = '<div class="page"><div class="empty">加载内容失败：' + esc(String(err && err.message ? err.message : err)) + '</div></div>';
  });
})();