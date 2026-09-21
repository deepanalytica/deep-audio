import React from 'react';

function Icon({ children, size = 18, ...props }) {
  return <svg className="ui-icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{children}</svg>;
}

export const MapIcon = () => <Icon><path d="m3 6 5-2 8 2 5-2v14l-5 2-8-2-5 2Z"/><path d="M8 4v14M16 6v14"/></Icon>;
export const PowerIcon = () => <Icon><path d="M12 3v9"/><path d="M7.1 5.9a8 8 0 1 0 9.8 0"/></Icon>;
export const UsersIcon = () => <Icon><circle cx="9" cy="8" r="3"/><path d="M3.5 20a5.5 5.5 0 0 1 11 0M16 5.2a3 3 0 0 1 0 5.6M17 14.4a5.5 5.5 0 0 1 3.5 5.1"/></Icon>;
export const LibraryIcon = () => <Icon><rect x="3" y="4" width="5" height="16" rx="1"/><rect x="9.5" y="4" width="5" height="16" rx="1"/><path d="m16 5 3.5-1 2.2 14.5-3.5.5Z"/></Icon>;
export const HarmonyIcon = () => <Icon><path d="M5 4v12.5a2.5 2.5 0 1 1-2-2.45V7l9-2v9.5a2.5 2.5 0 1 1-2-2.45V4.9"/><path d="m15 8 6-1.5v7a2 2 0 1 1-2-1.95V7"/></Icon>;
export const RoomIcon = () => <Icon><path d="m4 19 8 3 8-3V5l-8-3-8 3Z"/><path d="M12 2v20M4 5l8 3 8-3"/></Icon>;
export const EquipmentIcon = () => <Icon><path d="M4 4h16v16H4z"/><path d="M8 8h8M8 12h8M8 16h4"/><circle cx="17" cy="16" r="1"/></Icon>;
export const StopIcon = () => <Icon size={16}><rect x="6" y="6" width="12" height="12" rx="1" fill="currentColor" stroke="none"/></Icon>;
export const PlayIcon = () => <Icon size={20}><path d="m8 5 11 7-11 7Z" fill="currentColor" stroke="none"/></Icon>;
export const PauseIcon = () => <Icon size={20}><path d="M8 5v14M16 5v14" strokeWidth="3"/></Icon>;
export const RecordIcon = () => <Icon size={15}><circle cx="12" cy="12" r="6" fill="currentColor" stroke="none"/></Icon>;
export const AddTrackIcon = () => <Icon><path d="M4 6h10M4 12h10M4 18h7M18 10v8M14 14h8"/></Icon>;
export const DownloadIcon = () => <Icon><path d="M12 3v12M7 10l5 5 5-5M4 20h16"/></Icon>;
export const CloseIcon = () => <Icon><path d="m6 6 12 12M18 6 6 18"/></Icon>;
export const ArrowIcon = () => <Icon size={15}><path d="M7 17 17 7M8 7h9v9"/></Icon>;
