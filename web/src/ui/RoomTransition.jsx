import React from 'react';
import { useStudioStore } from '../store.js';
import { ROOMS } from '../data.js';

export default function RoomTransition(){
  const transition=useStudioStore((s)=>s.roomTransition);
  if(!transition.active)return null;
  const room=ROOMS[transition.target]||ROOMS.practice;

  return <div className="room-transition" aria-live="polite">
    <div className="room-transition-glow"/>
    <div className="room-transition-center">
      <span className="room-transition-number">{room.number}</span>
      <small>DEEP MUSIC PRODUCER</small>
      <b>{room.label}</b>
      <i/>
    </div>
  </div>;
}
