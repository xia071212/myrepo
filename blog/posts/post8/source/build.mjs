/** Build the website's interactive article. Statistical replication lives in blog8repo. */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {run,stats} from './simulation.mjs';
import {figures} from './charts.mjs';
const source=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(source,'..');
const read=name=>fs.readFileSync(path.join(source,name),'utf8');
const d=run(), rendered=figures(d);
const summary={coverage:d.coverage.filter(x=>x.covers).length/d.parameters.R};
let html=read('article.html');
html=html.replace('{{illustration}}','data:image/png;base64,'+fs.readFileSync(path.join(root,'illustration.png')).toString('base64'));
// Populate prose from actual baseline outputs rather than maintaining copied numbers.
const articleValues={covered:d.coverage.filter(x=>x.covers).length,coverage_pct:(100*summary.coverage).toFixed(1),ci_dollars:d.ci.map(x=>'$'+Math.round(x).toLocaleString('en-US')).join('–'),pvalue_number:d.test.pvalue.toFixed(3)};
for(const [key,value] of Object.entries(articleValues)) html=html.replaceAll('{{'+key+'}}',String(value));
for(const [key,svg] of Object.entries(rendered))html=html.replace('{{'+key+'}}',svg);
const engine=read('simulation.mjs').replaceAll('export ','');
const charts=read('charts.mjs').replaceAll('export ','');
html=html.replace('/*STYLE*/',()=>read('style.css')).replace('/*ENGINE*/',()=>engine)
 .replace('/*BASELINE*/',()=>'const BASELINE='+JSON.stringify(d)+';\n'+engine+'\n'+charts)
 .replace('/*APP*/',()=>read('app.js'));

// The Quarto page supplies the title, introduction and illustration.
html=html.replace(/<header>[\s\S]*?<\/header>/,'')
 .replace(/<p class="prose lead">[\s\S]*?<\/p>/,'')
 .replace(/<figure class="hero">[\s\S]*?<\/figure>/,'')
 .replace('../README.md','README.md')
 .replace('</style>','html,body{background:#fbf8f1}body{max-width:none;box-shadow:none}main{max-width:none;padding:0 2px}section:first-child{margin-top:0}</style>');
fs.writeFileSync(path.join(root,'interactive.html'),html);
console.log('Built interactive.html');

// Expose the existing article headings to Quarto's native table of contents.
// Raw blocks preserve prose, controls and SVGs; only section wrappers change.
const mainContent=html.match(/<main>([\s\S]*?)<\/main>/)[1];
const sections=[...mainContent.matchAll(/<section(?: id="([^"]+)")?><h2>([^<]+)<\/h2>([\s\S]*?)<\/section>/g)];
let demo='';
for(const [_,id,title,body] of sections){
 demo+='## '+title+' {#'+(id||'conclusion')+'}\n\n```{=html}\n'+body.trim()+'\n```\n\n';
}
const footer=mainContent.match(/<footer>[\s\S]*?<\/footer>/)[0];
let scripts=html.slice(html.indexOf('</main>')+7).replace('</body></html>','');
scripts=scripts.replace('<script>','<script>(()=>{').replace(/<\/script>\s*$/, '\n})();</script>');
demo+='```{=html}\n'+footer+'\n'+scripts+'\n```\n';
fs.writeFileSync(path.join(root,'_demo.qmd'),demo);
