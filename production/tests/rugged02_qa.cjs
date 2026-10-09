/* Full-frame mechanical proof for the actual Polish02 remotion solver, not an unrelated mock. */
const ts=require('typescript'),fs=require('node:fs'),path=require('node:path');
require.extensions['.ts']=(mod,filename)=>{
 const source=fs.readFileSync(filename,'utf8');
 const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 mod._compile(js,filename);
};
const terrain=require('../../src/suspension/polish02/terrain.ts');
const k=require('../../src/suspension/polish02/motion.ts');
const {CORNERS,FRAMES,FPS,RADIUS,SPEED}=terrain;
const norm=(a,b)=>Math.abs(a-b);
const outdir='out/rugged02/physics';fs.mkdirSync(outdir,{recursive:true});
let maxContactError=0,maxLinkError=0,maxJump=0,maxAngularVelocity=0,minSpring=Infinity,maxSpring=-Infinity;
let maxBodyRoll=0,maxBump=0,maxDroop=0,independence=0,hero={left:0,right:0,roll:0,frame:-1};
let prev=null,rows=['frame,time_s,corner,tyre_contact_error_m,upper_arm_error_m,lower_arm_error_m,knuckle_error_m,spring_length_m,shock_length_m,travel_m,hub_x,hub_y,body_roll_rad'];
const samples=[];
for(let frame=0;frame<FRAMES;frame++){
 const pose=k.poseAt(frame);const values=[];
 maxBodyRoll=Math.max(maxBodyRoll,Math.abs(pose.roll));
 for(const corner of CORNERS){
  const s=terrain.wheelSide(corner),w=pose.wheels[corner],l=w.link,z=terrain.wheelZ(corner);
  const uc=k.upperChassis(s,z),lc=k.lowerChassis(s,z);
  const le1=norm(k.distance(l.upper,uc),k.UPPER_ARM);
  const le2=norm(k.distance(l.lower,lc),k.LOWER_ARM);
  const le3=norm(k.distance(l.upper,l.lower),k.KNUCKLE);
  const max=Math.max(le1,le2,le3);maxLinkError=Math.max(maxLinkError,max);
  const contact=Math.abs(w.contactError);maxContactError=Math.max(maxContactError,contact);
  const spring=k.distance(l.springTop,l.springBottom),shock=k.distance(l.damperTop,l.damperBottom);
  minSpring=Math.min(minSpring,spring);maxSpring=Math.max(maxSpring,spring);
  maxBump=Math.max(maxBump,w.travel);maxDroop=Math.min(maxDroop,w.travel);
  maxAngularVelocity=Math.max(maxAngularVelocity,Math.abs(w.angularSpeed));
  if(prev)maxJump=Math.max(maxJump,Math.abs(w.travel-prev.wheels[corner].travel));
  values.push(w.travel);
  rows.push([frame,(frame/FPS).toFixed(3),corner,contact.toFixed(5),le1.toFixed(7),
   le2.toFixed(7),le3.toFixed(7),spring.toFixed(5),shock.toFixed(5),w.travel.toFixed(5),
   w.wheelCentreWorld[0].toFixed(5),w.wheelCentreWorld[1].toFixed(5),pose.roll.toFixed(5)].join(','));
 }
 independence=Math.max(independence,Math.max(...values)-Math.min(...values));
 if(frame>=170&&frame<=243){
  const left=pose.wheels.FL.travel,right=pose.wheels.FR.travel;
  if(left-right>hero.left-hero.right)hero={left,right,roll:pose.roll,frame};
 }
 if(frame%30===0)samples.push({frame,roll:pose.roll,pitch:pose.pitch,contacts:CORNERS.map(c=>pose.wheels[c].contactError)});
 prev=pose;
}
const issues=[];
if(maxContactError>.105)issues.push('Ground clearance exceeds 10.5cm at some frames');
if(maxLinkError>.0001)issues.push('A control-arm/knuckle length changed');
if(maxJump>.13)issues.push('Frame-to-frame travel jumped by more than 13cm');
if(independence<.38)issues.push('Four-wheel differential articulation below 38cm');
if(hero.left-hero.right<.30)issues.push('Front-left rock vs front-right rut insufficient motion');
if(!(hero.roll<-.02))issues.push('Hero chassis does not roll toward front-left obstacle');
if(maxSpring-minSpring<.12)issues.push('Spring travel cannot be seen: length variation under 12cm');
if(Math.abs(k.poseAt(FRAMES-1).wheels.FL.spin-SPEED*(FRAMES-1)/FPS/RADIUS)>1e-7)issues.push('Rolling rotation mismatch');
const report={status:issues.length?'FAIL':'PASS',source:'src/suspension/polish02/motion.ts',
 frames:FRAMES,linkLengthErrorMetres:maxLinkError,contactMaxErrorMetres:maxContactError,
 maxTravelChangePerFrameMetres:maxJump,springLengthRange:[minSpring,maxSpring],
 maxWheelTravelBumpMetres:maxBump,maxWheelTravelDroopMetres:maxDroop,
 independentWheelSpreadMetres:independence,maxBodyRollRadians:maxBodyRoll,
 heroObstacle:hero,maxAngularVelocityRadiansPerSecond:maxAngularVelocity,
 model:'4-bar kinematic and damped sprung chassis, not independently validated full-force suspension simulation',
 issues,samples};
fs.writeFileSync(path.join(outdir,'mechanical-qa.json'),JSON.stringify(report,null,2)+'\n');
fs.writeFileSync(path.join(outdir,'telemetry.csv'),rows.join('\n')+'\n');
console.log(JSON.stringify(report,null,2));
if(issues.length)process.exitCode=1;
