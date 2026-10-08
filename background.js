/* Pixel mountains. Off-thread drawing keeps input handlers lightweight. */
(() => {
  'use strict';
  let canvas=document.getElementById('mountain-background');
  if(!canvas)return;
  const motion=window.matchMedia('(prefers-reduced-motion: reduce)');
  const sample=document.createElement('canvas');
  const sampleCtx=sample.getContext('2d',{willReadFrequently:true});
  if(!sampleCtx)return;
  const image=new Image();
  let worker=null,renderer=null,loaded=false,setup=null,pointerFrame=0,resizeFrame=0,startupTimer=null;
  let pointer={x:.79,y:.23};
  function createRenderer(surface, clock) {
  const ctx = surface.getContext('2d', { alpha: false });
  if (!ctx) throw new Error('Canvas rendering unavailable');
  const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
  const quantize = n => clamp(Math.round(n / 4) * 4, 0, 255);
  const palette=new Map();
  function color(key){
    let value=palette.get(key);
    if(value===undefined){
      value=key===0xffdc78?'#ffdc78':key===0xf5dfa0?'#f5dfa0':'rgb('+(key>>>16)+','+((key>>>8)&255)+','+(key&255)+')';
      // Bound memory during long sessions with continuously changing light.
      if(palette.size>=16384)palette.clear();
      palette.set(key,value);
    }
    return value;
  }
  const clouds = [
    {x:.12,y:.16,w:.18,h:.045,speed:.0015},
    {x:.50,y:.29,w:.23,h:.055,speed:.0010},
    {x:.85,y:.09,w:.14,h:.035,speed:.0018}
  ];
  let width=0,height=0,tile=0,columns=0,rows=0,cells=[],covered;
  let skyColors,mountainColors,edgesX=[],edgesY=[],skyRows=[],px=[],py=[],bands=[];
  const cloudX=new Float64Array(clouds.length),cloudV=new Float64Array(clouds.length);
  let sun={x:.79,y:.23},target={...sun};
  let reduced=false,hidden=false,frame=null,lastTime=null,skyTime=0,ready=false;

  function resize(data) {
    ({width,height,columns,rows}=data);
    tile=width/columns;
    // CSS-resolution backing preserves the 1px gutters without 4x HiDPI drawing.
    surface.width=width;surface.height=height;ctx.imageSmoothingEnabled=false;
    edgesX=Array.from({length:columns+1},(_,x)=>Math.round(x*tile));
    edgesY=Array.from({length:rows+1},(_,y)=>Math.round(y*tile));
    covered=new Uint8Array(columns*rows);
    skyColors=new Int32Array(columns*rows).fill(-1);
    mountainColors=new Int32Array(columns*rows).fill(-1);
    palette.clear();cells=[];
    const pixels=data.pixels;
      const brightness = (x, y) => {
        const index = (y * columns + clamp(x, 0, columns - 1)) * 4;
        return pixels[index + 3] > 120 ? (pixels[index] + pixels[index + 1] + pixels[index + 2]) / 3 : 120;
      };
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < columns; x++) {
          const index = (y * columns + x) * 4;
          if (pixels[index + 3] < 150) continue;
          covered[y * columns + x] = 1;
          const insetLeft=Math.round(x*tile+.5),insetTop=Math.round(y*tile+.5);
          cells.push({ x, y, index:y*columns+x,r: pixels[index], g: pixels[index + 1], b: pixels[index + 2],
            nx: clamp((brightness(x - 1, y) - brightness(x + 1, y)) / 100, -0.85, 0.85),
            left:edgesX[x],top:edgesY[y],width:edgesX[x+1]-edgesX[x],height:edgesY[y+1]-edgesY[y],
            insetLeft,insetTop,insetWidth:Math.max(1,Math.round((x+1)*tile-.5)-insetLeft),
            insetHeight:Math.max(1,Math.round((y+1)*tile-.5)-insetTop) });
        }
      }
    px=Float64Array.from({length:columns},(_,x)=>(x+.5)/columns);
    py=Float64Array.from({length:rows},(_,y)=>(y+.5)*tile/height);
    bands=Float64Array.from(py,value=>clamp(value,0,1));
    skyRows=Array.from({length:rows},(_,y)=>{
      const visible=[];for(let x=0;x<columns;x++)if(!covered[y*columns+x])visible.push(x);
      return visible;
    });
    wake();
  }
  function paint() {
    const daylight = 1 - clamp((sun.y - 0.28) / 0.58, 0, 1);
    const topR=128+59*daylight,topG=139+76*daylight,topB=175+57*daylight;
    const horizonR=249-4*daylight,horizonG=185+46*daylight,horizonB=151+53*daylight;
    const cloudG=245-(1-daylight)*22,cloudB=230-(1-daylight)*28;
    const lightX = sun.x * columns - 0.5;
    const lightY = sun.y * height / tile - 0.5;
    const sunRadius = Math.max(2.75, Math.min(width, height) * 0.065 / tile);
    const glowRange=Math.max(width,height)*.65,lightRange=Math.max(width,height)*.76;
    for(let i=0;i<clouds.length;i++){
      const c=clouds[i];cloudX[i]=((c.x+skyTime*c.speed+c.w)%(1+c.w*2))-c.w;
    }
    // Sun height shifts the whole sky between blue daylight and peach dusk.
    for (let y = 0; y < rows; y++) {
      const band=bands[y],rowR=topR+(horizonR-topR)*band,rowG=topG+(horizonG-topG)*band,rowB=topB+(horizonB-topB)*band;
      const dy=y-lightY,dySquared=dy*dy;
      for(let i=0;i<clouds.length;i++)cloudV[i]=(py[y]-clouds[i].y)/clouds[i].h;
      for (const x of skyRows[y]) {
        const dx=x-lightX,distance=Math.sqrt(dx*dx+dySquared);
        // Draw the sun only in sky tiles, leaving the mountain silhouette opaque.
        let key;
        if(distance<=sunRadius)key=0xffdc78;
        else if(distance<=sunRadius+.85)key=0xf5dfa0;
        else {
        const glow=Math.max(0,1-distance*tile/glowRange);
        let r=rowR+glow*26,g=rowG+glow*13,b=rowB-glow*13;
        for(let i=0;i<clouds.length;i++){
          const cloud=clouds[i],u=(px[x]-cloudX[i])/cloud.w,v=cloudV[i];
          // Overlapping round lobes create chunky cloud edges without soft blur.
          if (Math.abs(u) < 1 && Math.abs(v) < 1) {
            const a=(u+.42)/.55,av=v/.64,d=u/.64,dv=(v+.15)/.92,e=(u-.44)/.53,ev=(v-.08)/.63;
            const squared=Math.min(a*a+av*av,d*d+dv*dv,e*e+ev*ev);
            if(squared<1){
              const amount=Math.min(.58,(1-Math.sqrt(squared))*1.8);
              r+=(255-r)*amount;g+=(cloudG-g)*amount;b+=(cloudB-b)*amount;
            }
          }
        }
        key=(quantize(r)<<16)|(quantize(g)<<8)|quantize(b);
        }
        const index=y*columns+x;
        if(skyColors[index]===key)continue;
        skyColors[index]=key;ctx.fillStyle=color(key);
        ctx.fillRect(edgesX[x],edgesY[y],edgesX[x+1]-edgesX[x],edgesY[y+1]-edgesY[y]);
      }
    }
    for (const cell of cells) {
      const dx = (lightX - cell.x) * tile;
      const dy = (lightY - cell.y) * tile;
      const distance = Math.max(1, Math.sqrt(dx*dx+dy*dy));
      const nearby = Math.max(0, 1 - distance / lightRange);
      const facing = Math.max(0, (cell.nx * dx - 0.85 * dy) / distance);
      const light = nearby * 0.75 + facing * 0.25;
      const shade = 0.64 + light * 0.37;
      const r = quantize(cell.r * shade + light * 34);
      const g = quantize(cell.g * shade + light * 21);
      const b = quantize(cell.b * shade - light * 12);
      const key=(r<<16)|(g<<8)|b;
      if(mountainColors[cell.index]===key)continue;
      mountainColors[cell.index]=key;
      const backing=(Math.round(r*.90+12)<<16)|(Math.round(g*.90+12)<<8)|Math.round(b*.90+12);
      ctx.fillStyle=color(backing);ctx.fillRect(cell.left,cell.top,cell.width,cell.height);
      ctx.fillStyle=color(key);ctx.fillRect(cell.insetLeft,cell.insetTop,cell.insetWidth,cell.insetHeight);
    }
  }


  function tick() {
    frame=null;
    if(hidden||!width)return;
    const time=clock.now(),elapsed=lastTime===null?16:Math.min(time-lastTime,160);
    lastTime=time;
    if(!reduced)skyTime+=elapsed/1000;
    const ease=reduced?1:1-Math.exp(-elapsed/55);
    sun.x+=(target.x-sun.x)*ease;sun.y+=(target.y-sun.y)*ease;
    const start=clock.now();paint();
    if(!ready){ready=true;clock.onReady?.();}
    if(!reduced){
      const moving=Math.abs(sun.x-target.x)+Math.abs(sun.y-target.y)>.0005;
      const interval=moving?clock.activeInterval:125,cost=clock.now()-start;
      // No paint backlog: slow devices get breathing room between draws.
      frame=clock.schedule(tick,Math.max(0,interval-cost,cost*.5));
    }
  }
  function wake(){
    if(hidden||!width)return;
    if(frame!==null)clock.cancel(frame);
    frame=clock.schedule(tick,0);
  }
  return {update(data){
    if(data.type==='resize')resize(data);
    else if(data.type==='pointer'&&!reduced){target={x:clamp(data.x,0,1),y:clamp(data.y,0,1)};wake();}
    else if(data.type==='state'){
      reduced=data.reduced;hidden=data.hidden;
      if(reduced)target={x:.79,y:.23};
      if(hidden){if(frame!==null)clock.cancel(frame);frame=null;lastTime=null;}
      else wake();
    }
  }};
  }

  function send(data){if(worker)worker.postMessage(data);else renderer?.update(data);}
  function state(){send({type:'state',reduced:motion.matches,hidden:document.hidden});}
  function fallback(replace=false){
    if(startupTimer!==null){clearTimeout(startupTimer);startupTimer=null;}
    if(worker){worker.terminate();worker=null;}
    if(replace){const replacement=canvas.cloneNode(false);canvas.replaceWith(replacement);canvas=replacement;}
    canvas.dataset.renderer='fallback';
    renderer=createRenderer(canvas,{now:()=>performance.now(),schedule:(fn,delay)=>setTimeout(fn,delay),cancel:id=>clearTimeout(id),activeInterval:1000/30});
    state();if(setup)renderer.update(setup);
    if(!motion.matches)renderer.update({type:'pointer',...pointer});
  }
  // Blob workers also keep the downloaded, self-contained HTML portable.
  if(typeof Worker!=='undefined'&&canvas.transferControlToOffscreen){
    let url,transferred=false;
    try{
      const code='const createRenderer='+createRenderer.toString()+';let renderer;self.onmessage=({data})=>{if(data.type==="init"){renderer=createRenderer(data.canvas,{now:()=>performance.now(),schedule:(fn,delay)=>setTimeout(fn,delay),cancel:id=>clearTimeout(id),activeInterval:1000/60,onReady:()=>self.postMessage({type:"ready"})});}else renderer.update(data);};';
      url=URL.createObjectURL(new Blob([code],{type:'text/javascript'}));worker=new Worker(url);
      const offscreen=canvas.transferControlToOffscreen();transferred=true;
      worker.onerror=()=>{fallback(true);return true;};
      worker.onmessage=({data})=>{if(data.type==='ready'&&startupTimer!==null){clearTimeout(startupTimer);startupTimer=null;}};
      worker.postMessage({type:'init',canvas:offscreen},[offscreen]);canvas.dataset.renderer='worker';
      startupTimer=setTimeout(()=>{startupTimer=null;if(worker)fallback(true);},1500);
    }catch{fallback(transferred);}
    finally{if(url)URL.revokeObjectURL(url);}
  }else fallback();
  function resize(){
    resizeFrame=0;
    const width=window.innerWidth,height=window.innerHeight;
    const columns=Math.max(64,Math.min(256,Math.round(width/(width<720?6:8)))),rows=Math.ceil(height/(width/columns));
    sample.width=columns;sample.height=rows;sampleCtx.imageSmoothingEnabled=false;sampleCtx.clearRect(0,0,columns,rows);
    if(loaded){const imageRows=Math.round(rows*(width<720?.76:.94));sampleCtx.drawImage(image,0,rows-imageRows,columns,imageRows);}
    setup={type:'resize',width,height,columns,rows,pixels:sampleCtx.getImageData(0,0,columns,rows).data};send(setup);
  }
  window.addEventListener('pointermove',event=>{
    if(motion.matches||document.hidden)return;
    pointer={x:event.clientX/window.innerWidth,y:event.clientY/window.innerHeight};
    if(!pointerFrame)pointerFrame=requestAnimationFrame(()=>{pointerFrame=0;send({type:'pointer',...pointer});});
  },{passive:true});
  window.addEventListener('pointerleave',()=>{pointer={x:.79,y:.23};if(!motion.matches)send({type:'pointer',...pointer});});
  window.addEventListener('resize',()=>{if(!resizeFrame)resizeFrame=requestAnimationFrame(resize);},{passive:true});
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden){cancelAnimationFrame(pointerFrame);pointerFrame=0;cancelAnimationFrame(resizeFrame);resizeFrame=0;}
    state();if(!document.hidden)resize();
  });
  motion.addEventListener('change',state);
  image.onload=()=>{loaded=true;resize();};
  resize();state();image.src=window.PORTFOLIO.background.src;
})();
