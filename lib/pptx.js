'use strict';

const { createZip } = require('./zip');

const EMU_W = 12192000;
const EMU_H = 6858000;

const NS_A = 'http://schemas.openxmlformats.org/drawingml/2006/main';
const NS_R = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
const NS_P = 'http://schemas.openxmlformats.org/presentationml/2006/main';

const FONT_LATIN = '+mj-lt';
const FONT_EA = '微软雅黑';

function esc(text) {
  return String(text == null ? '' : text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function fill(color) {
  return '<a:solidFill><a:srgbClr val="' + color + '"/></a:solidFill>';
}

function roundRect(id, x, y, cx, cy, color, radius) {
  const adj = radius == null ? 50000 : radius;
  return '<p:sp><p:nvSpPr><p:cNvPr id="' + id + '" name="Shape ' + id + '"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>'
    + '<p:spPr><a:xfrm><a:off x="' + x + '" y="' + y + '"/><a:ext cx="' + cx + '" cy="' + cy + '"/></a:xfrm>'
    + '<a:prstGeom prst="roundRect"><a:avLst><a:gd name="adj" fmla="val ' + adj + '"/></a:avLst></a:prstGeom>'
    + fill(color)
    + '<a:ln><a:noFill/></a:ln></p:spPr>'
    + '<p:txBody><a:bodyPr/><a:lstStyle/><a:p/></p:txBody></p:sp>';
}

function textBox(id, name, x, y, cx, cy, paragraphs, anchor) {
  return '<p:sp><p:nvSpPr><p:cNvPr id="' + id + '" name="' + esc(name) + '"/><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr>'
    + '<p:spPr><a:xfrm><a:off x="' + x + '" y="' + y + '"/><a:ext cx="' + cx + '" cy="' + cy + '"/></a:xfrm>'
    + '<a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/><a:ln><a:noFill/></a:ln></p:spPr>'
    + '<p:txBody><a:bodyPr wrap="square" lIns="0" tIns="0" rIns="0" bIns="0" anchor="' + (anchor || 't') + '">'
    + '<a:normAutofit/></a:bodyPr><a:lstStyle/>' + paragraphs.join('') + '</p:txBody></p:sp>';
}

function run(text, size, color, bold) {
  return '<a:r><a:rPr lang="zh-CN" altLang="en-US" sz="' + size + '" b="' + (bold ? 1 : 0) + '" dirty="0">'
    + fill(color)
    + '<a:latin typeface="' + FONT_LATIN + '"/><a:ea typeface="' + FONT_EA + '"/><a:cs typeface="' + FONT_LATIN + '"/>'
    + '</a:rPr><a:t>' + esc(text) + '</a:t></a:r>';
}

function para(text, opts) {
  const o = opts || {};
  const size = o.size || 1600;
  const color = o.color || 'D6DCF0';
  const level = o.level || 0;
  const marL = 228600 + 342900 * level;
  const indent = o.bullet === false ? 0 : -228600;
  const bullet = o.bullet === false
    ? '<a:buNone/>'
    : '<a:buFont typeface="Arial"/><a:buChar char="' + (o.char || '•') + '"/><a:buSzPct val="90000"/>';
  const spcBef = '<a:spcBef><a:spcPts val="' + (o.spaceBefore == null ? 400 : o.spaceBefore) + '"/></a:spcBef>';
  const align = o.align ? ' algn="' + o.align + '"' : '';
  return '<a:p><a:pPr marL="' + marL + '" indent="' + indent + '" lvl="' + level + '"' + align + '>'
    + spcBef
    + '<a:lnSpc><a:spcPct val="' + (o.lineSpacing || 104000) + '"/></a:lnSpc>'
    + '<a:buClr><a:srgbClr val="' + color + '"/></a:buClr>'
    + bullet
    + '</a:pPr>' + run(text, size, color, o.bold) + '</a:p>';
}

function buildSlideXml(slide, index, total, accent, deckTitle) {
  const shapes = [];
  let id = 1;

  shapes.push(roundRect(id += 1, 0, 0, EMU_W, 146050, accent, 0));
  if (index > 0) {
    shapes.push(roundRect(id += 1, 838200, 685800, 91440, 457200, accent, 30000));
  }

  const head = [];
  if (slide.kicker) {
    head.push(para(String(slide.kicker), { size: 1200, color: accent, bullet: false, bold: true, spaceBefore: 0 }));
  }
  head.push(para(slide.title || '', {
    size: index === 0 ? 4000 : 2800,
    color: 'FFFFFF',
    bold: true,
    bullet: false,
    spaceBefore: index === 0 ? 600 : 400
  }));
  if (slide.subtitle) {
    head.push(para(slide.subtitle, { size: 1400, color: '9AA6C4', bullet: false, spaceBefore: 700 }));
  }

  if (index === 0) {
    shapes.push(roundRect(id += 1, 838200, 2514600, 640080, 91440, accent, 30000));
    shapes.push(textBox(id += 1, 'Title', 838200, 1181100, EMU_W - 1676400, 1219200, head));
  } else {
    shapes.push(textBox(id += 1, 'Title', 838200, 824200, EMU_W - 1676400, 1097280, head));
  }

  if (Array.isArray(slide.bullets) && slide.bullets.length) {
    const body = slide.bullets.map(function (item) {
      if (typeof item === 'string') {
        return para(item, { size: 1550, color: 'D6DCF0', spaceBefore: 620 });
      }
      return para(item.text, {
        size: item.level ? 1325 : 1550,
        color: item.level ? '9AA6C4' : 'D6DCF0',
        level: item.level || 0,
        bold: item.bold === true,
        spaceBefore: item.level ? 300 : 640,
        char: item.level ? '–' : '•'
      });
    });
    const bodyTop = index === 0 ? 3429000 : 2438400;
    shapes.push(textBox(id += 1, 'Body', 838200, bodyTop, EMU_W - 1676400, EMU_H - bodyTop - 640080, body));
  }

  shapes.push(textBox(id += 1, 'Footer', 838200, EMU_H - 503000, EMU_W - 2400000, 274320, [
    para(deckTitle || '进阶工作台', { size: 1000, color: '5D6885', bullet: false, spaceBefore: 0 })
  ]));
  shapes.push(textBox(id += 1, 'PageNo', EMU_W - 1371600, EMU_H - 503000, 838200, 274320, [
    para((index + 1) + ' / ' + total, { size: 1000, color: '5D6885', bullet: false, spaceBefore: 0, align: 'r' })
  ]));

  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\r\n'
    + '<p:sld xmlns:a="' + NS_A + '" xmlns:r="' + NS_R + '" xmlns:p="' + NS_P + '"><p:cSld>'
    + '<p:bg><p:bgPr>' + fill('0E1220') + '<a:effectLst/></p:bgPr></p:bg>'
    + '<p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>'
    + '<p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>'
    + shapes.join('')
    + '</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sld>';
}

const THEME = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\r\n'
  + '<a:theme xmlns:a="' + NS_A + '" name="AdvancedWorkbench"><a:themeElements>'
  + '<a:clrScheme name="LW"><a:dk1><a:sysClr val="windowText" lastClr="000000"/></a:dk1>'
  + '<a:lt1><a:sysClr val="window" lastClr="FFFFFF"/></a:lt1>'
  + '<a:dk2><a:srgbClr val="0E1220"/></a:dk2><a:lt2><a:srgbClr val="E8ECF8"/></a:lt2>'
  + '<a:accent1><a:srgbClr val="4F7CFF"/></a:accent1><a:accent2><a:srgbClr val="22C1A4"/></a:accent2>'
  + '<a:accent3><a:srgbClr val="FF8A3D"/></a:accent3><a:accent4><a:srgbClr val="C86BFF"/></a:accent4>'
  + '<a:accent5><a:srgbClr val="FFC53D"/></a:accent5><a:accent6><a:srgbClr val="FF5C7A"/></a:accent6>'
  + '<a:hlink><a:srgbClr val="4F7CFF"/></a:hlink><a:folHlink><a:srgbClr val="C86BFF"/></a:folHlink></a:clrScheme>'
  + '<a:fontScheme name="LW"><a:majorFont><a:latin typeface="+mj-lt"/><a:ea typeface="' + FONT_EA + '"/><a:cs typeface="+mj-lt"/></a:majorFont>'
  + '<a:minorFont><a:latin typeface="+mn-lt"/><a:ea typeface="' + FONT_EA + '"/><a:cs typeface="+mn-lt"/></a:minorFont></a:fontScheme>'
  + '<a:fmtScheme name="LW">'
  + '<a:fillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill>'
  + '<a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:fillStyleLst>'
  + '<a:lnStyleLst><a:ln w="6350" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:prstDash val="solid"/></a:ln>'
  + '<a:ln w="12700" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:prstDash val="solid"/></a:ln>'
  + '<a:ln w="19050" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:prstDash val="solid"/></a:ln></a:lnStyleLst>'
  + '<a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst>'
  + '<a:bgFillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill>'
  + '<a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:bgFillStyleLst>'
  + '</a:fmtScheme></a:themeElements><a:objectDefaults/><a:extraClrSchemeLst/></a:theme>';

const SLIDE_MASTER = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\r\n'
  + '<p:sldMaster xmlns:a="' + NS_A + '" xmlns:r="' + NS_R + '" xmlns:p="' + NS_P + '">'
  + '<p:cSld><p:bg><p:bgPr>' + fill('0E1220') + '<a:effectLst/></p:bgPr></p:bg>'
  + '<p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>'
  + '<p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>'
  + '</p:spTree></p:cSld>'
  + '<p:clrMap bg1="dk1" tx1="lt1" bg2="dk2" tx2="lt2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/>'
  + '<p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId1"/></p:sldLayoutIdLst>'
  + '<p:txStyles><p:titleStyle><a:lvl1pPr algn="l"><a:defRPr sz="3200" b="1"/></a:lvl1pPr></p:titleStyle>'
  + '<p:bodyStyle><a:lvl1pPr algn="l"><a:defRPr sz="1800"/></a:lvl1pPr></p:bodyStyle>'
  + '<p:otherStyle><a:defRPr sz="1800"/></p:otherStyle></p:txStyles></p:sldMaster>';

const SLIDE_LAYOUT = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\r\n'
  + '<p:sldLayout xmlns:a="' + NS_A + '" xmlns:r="' + NS_R + '" xmlns:p="' + NS_P + '" type="blank" preserve="1">'
  + '<p:cSld name="Blank"><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>'
  + '<p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>'
  + '</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sldLayout>';

function buildPptx(deck) {
  const accent = String(deck.accent || '#4F7CFF').replace('#', '').toUpperCase();
  const deckTitle = deck.title || '进阶工作台';
  const slides = (deck.slides && deck.slides.length) ? deck.slides : [{ title: deckTitle }];
  const total = slides.length;
  const entries = [];

  let overrides = '';
  for (let i = 0; i < total; i += 1) {
    overrides += '<Override PartName="/ppt/slides/slide' + (i + 1) + '.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>';
  }

  entries.push({
    name: '[Content_Types].xml',
    data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\r\n'
      + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
      + '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
      + '<Default Extension="xml" ContentType="application/xml"/>'
      + '<Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>'
      + '<Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>'
      + '<Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>'
      + '<Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>'
      + overrides + '</Types>'
  });

  entries.push({
    name: '_rels/.rels',
    data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\r\n'
      + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
      + '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>'
      + '</Relationships>'
  });

  let sldIds = '';
  let presRels = '';
  for (let i = 0; i < total; i += 1) {
    sldIds += '<p:sldId id="' + (256 + i) + '" r:id="rId' + (i + 2) + '"/>';
    presRels += '<Relationship Id="rId' + (i + 2) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide' + (i + 1) + '.xml"/>';
  }

  entries.push({
    name: 'ppt/presentation.xml',
    data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\r\n'
      + '<p:presentation xmlns:a="' + NS_A + '" xmlns:r="' + NS_R + '" xmlns:p="' + NS_P + '">'
      + '<p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst>'
      + '<p:sldIdLst>' + sldIds + '</p:sldIdLst>'
      + '<p:sldSz cx="' + EMU_W + '" cy="' + EMU_H + '" type="screen16x9"/><p:notesSz cx="6858000" cy="9144000"/>'
      + '<p:defaultTextStyle><a:defPPr><a:defRPr lang="zh-CN"/></a:defPPr></p:defaultTextStyle>'
      + '</p:presentation>'
  });

  entries.push({
    name: 'ppt/_rels/presentation.xml.rels',
    data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\r\n'
      + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
      + '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/>'
      + presRels + '</Relationships>'
  });

  entries.push({ name: 'ppt/theme/theme1.xml', data: THEME });
  entries.push({ name: 'ppt/slideMasters/slideMaster1.xml', data: SLIDE_MASTER });
  entries.push({
    name: 'ppt/slideMasters/_rels/slideMaster1.xml.rels',
    data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\r\n'
      + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
      + '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>'
      + '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="../theme/theme1.xml"/>'
      + '</Relationships>'
  });
  entries.push({ name: 'ppt/slideLayouts/slideLayout1.xml', data: SLIDE_LAYOUT });
  entries.push({
    name: 'ppt/slideLayouts/_rels/slideLayout1.xml.rels',
    data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\r\n'
      + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
      + '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="../slideMasters/slideMaster1.xml"/>'
      + '</Relationships>'
  });

  slides.forEach(function (slide, i) {
    entries.push({ name: 'ppt/slides/slide' + (i + 1) + '.xml', data: buildSlideXml(slide, i, total, accent, deckTitle) });
    entries.push({
      name: 'ppt/slides/_rels/slide' + (i + 1) + '.xml.rels',
      data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\r\n'
        + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
        + '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>'
        + '</Relationships>'
    });
  });

  return createZip(entries);
}

module.exports = { buildPptx };