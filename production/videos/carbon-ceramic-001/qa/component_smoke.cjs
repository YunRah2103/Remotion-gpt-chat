#!/usr/bin/env node
/* Execute Agent D compiled JSX with local React/Remotion API test shims.
 * Exercises component render path and frame timing, NOT native Remotion output.
 * Run from repo root: npm ci && node production/videos/carbon-ceramic-001/qa/component_smoke.cjs
 */
const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('node:assert/strict');
const ts=require('typescript');
const source=fs.readFileSync('src/brakes001/graphics/index.tsx','utf8');
const out=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,moduleResolution:ts.ModuleResolutionKind.NodeJs,esModuleInterop:true,jsx:ts.JsxEmit.ReactJSX,resolveJsonModule:true},reportDiagnostics:true});
assert.equal((out.diagnostics||[]).length,0,'TSX transpilation diagnostics');
let frame=0;
const Fragment=Symbol.for('react.fragment');
const jsx=(type,props)=>({type,props:props||{}});
const mockReact={__esModule:true,default:{Fragment},Fragment};
const mockRemotion={AbsoluteFill:({children,style})=>jsx('div',{children,style}),useCurrentFrame:()=>frame,useVideoConfig:()=>({width:1080,height:1920})};
const loaded={exports:{}};
const req=(p)=>{
  if(p==='react')return mockReact;
  if(p==='react/jsx-runtime')return {jsx,jsxs:jsx,Fragment};
  if(p==='remotion')return mockRemotion;
  if(p==='./graphics-cues.json')return require(path.resolve('src/brakes001/graphics/graphics-cues.json'));
  throw Error('unexpected import '+p);
};
vm.runInNewContext(out.outputText,{exports:loaded.exports,module:loaded,require:req}, {filename:'graphics/index.tsx'});
const {TitleOverlays,PartLabels,activeGraphicsAt}=loaded.exports;
assert.equal(typeof TitleOverlays,'function');assert.equal(typeof PartLabels,'function');
const collect=(tree,props=[])=>{
  if(tree===null||tree===false||tree===undefined)return props;
  if(Array.isArray(tree))return tree.reduce((a,b)=>collect(b,a),props);
  if(typeof tree!=='object')return props;
  if(typeof tree.type==='function')return collect(tree.type(tree.props),props);
  if(tree.props?.['data-overlay-id'])props.push(['graphic',tree.props['data-overlay-id']]);
  if(tree.props?.['data-brake-part'])props.push(['part',tree.props['data-brake-part']]);
  return collect(tree.props?.children,props);
};
let visible=0;
for(frame=0;frame<750;frame++){
  const a=collect(TitleOverlays({})),b=collect(PartLabels({}));
  const expected=activeGraphicsAt(frame);
  for(const row of a)assert(expected.graphics.some(e=>e.id===row[1]),'Unexpected title at frame '+frame);
  for(const row of b)assert(expected.labels.some(e=>e.part===row[1]),'Unexpected part at frame '+frame);
  assert(b.length<=2,'Crowded labels at frame '+frame);
  visible+=a.length+b.length;
}
frame=321;
assert(collect(TitleOverlays({})).some(a=>a[1]==='thermal-qualifier'),'Thermal disclaimer absent');
console.log('JSX_COMPONENT_SMOKE PASS: 750 frames, '+visible+' rendered cue instances; frame321 disclaimer; render hooks mocked');
