import React from 'react';
import {AbsoluteFill,Audio,Composition,Img,OffthreadVideo,Sequence,
  interpolate,staticFile,useCurrentFrame,useVideoConfig} from 'remotion';
import data from '../timeline.json';

type Beat = {scene:string,title:string,label:string,spot:string,pos:[number,number],
mode:string,effect:string,startSec:number,durationSec:number,kind:string,n:number};
const FPS=24;
const RED='#FF3B3B',BG='#0B0D0F',FG='#F5F4EF';
const pct=(v:number)=>Math.round(v*100)+'%';
const ease=(f:number,n:number)=>interpolate(f,[0,n],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
const Shot:React.FC<{beat:Beat}> = ({beat})=>{
 const f=useCurrentFrame();
 const {fps}=useVideoConfig();
 const beatFrames=Math.max(1,Math.round(beat.durationSec*fps));
 const enter=ease(f,9);
 const escape=Math.min(1,f/beatFrames);
 const point=beat.pos;
 const detail=beat.mode==='detail'||beat.mode==='focus';
 const inverted=beat.mode==='invert';
 const kinetic=beat.mode==='kinetic';
 const coverX=626,coverY=94,coverSize=530;
 const targetX=coverX+point[0]*coverSize;
 const targetY=coverY+point[1]*coverSize;
 const pulse=1+0.12*Math.sin(f*.22);
 const showMarker=beat.spot!=='cover';
 const jitter=(beat.effect==='flash'&&f<3)?2-f:0;
 const backdrop={
  background:'radial-gradient(circle at 69% 42%, #25323E 0%, #0B0D0F 65%, #000 100%)',
  color:FG,fontFamily:'Inter,Arial,sans-serif'
 };
 const clipScale=interpolate(f,[0,beatFrames],[1.0,1.075],{extrapolateRight:'clamp'});
 return <AbsoluteFill style={backdrop as React.CSSProperties}>
  <div style={{position:'absolute',left:0,top:0,width:'100%',height:'100%',
   opacity:.13,backgroundImage:'linear-gradient(rgba(255,255,255,.12) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.12) 1px,transparent 1px)',
   backgroundSize:'65px 65px',transform:'translate(-2px,-2px)'}}/>
  <div style={{position:'absolute',left:96,top:26,fontSize:23,fontWeight:900,letterSpacing:3}}>
   <span style={{color:RED,fontWeight:900,fontSize:27}}>/// </span>WE ARE LOGIC
  </div>
  <div style={{position:'absolute',left:96,top:84,fontSize:15,letterSpacing:3,color:'#F3A6A8'}}>
    ANÁLISIS VISUAL • 2027
  </div>
  <div style={{position:'absolute',left:96,top:154,width:495,opacity:enter,
      transform:'translateY('+((1-enter)*15)+'px)'}}>
    <div style={{color:RED,fontSize:17,fontWeight:850,letterSpacing:2,marginBottom:25}}>{beat.kind}</div>
    <div style={{fontSize:Math.min(54,beat.label.length>22?39:54),lineHeight:1.04,fontWeight:900,
      textTransform:'uppercase',letterSpacing:-1,wordBreak:'normal'}}>{beat.label}</div>
    <div style={{marginTop:26,height:5,width:Math.min(210,80+160*escape),
      background:RED,borderRadius:4}}/>
    <div style={{fontSize:24,marginTop:32,lineHeight:1.2,fontWeight:650,color:'#D4D1C8'}}>
      {kinetic?'OBSERVAR. COMPARAR. COMPROBAR.':beat.title}
    </div>
  </div>
  <div style={{position:'absolute',right:16,top:12,opacity:.50,fontSize:13,letterSpacing:2}}>
    THE WORLD AHEAD • FUENTE ORIGINAL
  </div>
  {/** The entire exact source remains visible for orientation. **/}
  <div style={{position:'absolute',left:coverX,top:coverY,width:coverSize,height:coverSize,
   boxShadow:'0 0 42px rgba(0,0,0,.70)',border:'1px solid rgba(255,255,255,.28)',overflow:'hidden',
   borderRadius:8,transform:'translateX('+jitter+'px)'}}>
   <Img src={staticFile('cover.png')} style={{width:'100%',height:'100%',objectFit:'contain',
     filter:inverted?'invert(1) contrast(1.2)':'none',transform:'scale('+(kinetic?clipScale:1)+')',
     opacity:beat.mode==='reveal'?enter:1}}/>
  </div>
  {showMarker&&<React.Fragment>
    <div style={{position:'absolute',left:targetX-45,top:targetY-45,
      width:90,height:90,border:'5px solid '+RED,borderRadius:'50%',pointerEvents:'none',
      boxShadow:'0 0 25px rgba(255,60,67,.8),inset 0 0 18px rgba(255,60,67,.32)',
      transform:'scale('+(pulse*(0.72+enter*.28))+')',opacity:enter}}/>
    <div style={{position:'absolute',left:targetX-11,top:targetY-11,
      width:22,height:22,borderRadius:'50%',background:RED,opacity:enter}}/>
    <div style={{position:'absolute',left:targetX,top:targetY,width:Math.max(0,690-targetX),height:2,
       background:'linear-gradient(90deg,#FF3B3B,transparent)',opacity:.65}}/>
  </React.Fragment>}
  {detail&&<div style={{position:'absolute',left:396,top:410,width:282,height:255,
    borderRadius:14,border:'5px solid '+RED,overflow:'hidden',boxShadow:'0 12px 35px rgba(0,0,0,.82)',
    opacity:enter,transform:'scale('+(0.80+enter*.2)+')'}}>
    <Img src={staticFile('cover.png')} style={{
      position:'absolute',width:780,height:780,maxWidth:'none',
      left:150-point[0]*780,top:127-point[1]*780,
      filter:'contrast(1.16)'
    }}/>
    <div style={{position:'absolute',bottom:0,left:0,right:0,background:'rgba(0,0,0,.85)',
    color:FG,fontSize:18,padding:8,fontWeight:900}}>DETALLE REAL · SIN RECREACIÓN</div>
  </div>}
  {beat.mode==='pov'&&<div style={{position:'absolute',left:coverX+15,top:coverY+15,width:coverSize-30,height:coverSize-30,
     pointerEvents:'none',border:'2px dashed rgba(255,60,60,.55)',borderRadius:8}}>
    <div style={{position:'absolute',right:15,top:15,color:RED,fontWeight:850,fontSize:18}}>● ANALIZANDO</div>
  </div>}
  {beat.effect==='flash'&&f<2&&<AbsoluteFill style={{backgroundColor:'#F5F4EF',opacity:f===0?.72:.24,pointerEvents:'none'}}/>}
  {beat.effect==='zoom'&&f<4&&<AbsoluteFill style={{background:'rgba(255,59,59,.12)',pointerEvents:'none',opacity:(4-f)/4}}/>}
  {beat.effect==='whoosh'&&f<5&&<AbsoluteFill style={{backdropFilter:'blur('+(5-f)*1.1+'px)',pointerEvents:'none'}}/>}
  <div style={{position:'absolute',left:96,bottom:28,color:'#B1B5B9',letterSpacing:2,fontSize:13}}>
    WE ARE LOGIC // EVIDENCIA · INTERPRETACIÓN · ESCENARIOS
  </div>
 </AbsoluteFill>;
};

const Main:React.FC = () => <AbsoluteFill style={{background:BG}}>
 <Audio src={staticFile('master.wav')} />
 <Sequence from={0} durationInFrames={3*FPS}>
  <OffthreadVideo src={staticFile('intro.mp4')} muted volume={0}
     style={{width:1280,height:720,objectFit:'cover'}}/>
 </Sequence>
 {(data.beats as Beat[]).map((beat,i)=>{
   const from=Math.max(0,Math.round(beat.startSec*FPS));
   const length=Math.max(2,Math.round(beat.durationSec*FPS)+1);
   return <Sequence key={i} from={from} durationInFrames={length}>
    <Shot beat={beat}/>
   </Sequence>;
 })}
</AbsoluteFill>;

export const Root:React.FC = () => <Composition id="WeAreLogicFilm" component={Main}
 width={1280} height={720} fps={FPS}
 durationInFrames={Math.ceil(data.durationSec*FPS)}/>;
