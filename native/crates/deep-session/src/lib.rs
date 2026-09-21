#![forbid(unsafe_code)]

use deep_params::ParameterId;
use serde::{Deserialize,Serialize};

pub const CURRENT_SCHEMA_VERSION:u32=1;

#[derive(Debug,Clone,Serialize,Deserialize)]
pub struct Session{
    pub schema_version:u32,
    pub name:String,
    pub sample_rate:u32,
    pub active_room:RoomId,
    pub transport:TransportSnapshot,
    pub devices:Vec<DeviceState>,
}
impl Session{
    pub fn new(name:impl Into<String>)->Self{
        Self{schema_version:CURRENT_SCHEMA_VERSION,name:name.into(),sample_rate:48_000,active_room:RoomId::Practice,transport:TransportSnapshot::default(),devices:Vec::new()}
    }
}

#[derive(Debug,Clone,Copy,Serialize,Deserialize)]
#[serde(rename_all="snake_case")]
pub enum RoomId{Practice,Recording,Production,Mix,Mastering}

#[derive(Debug,Clone,Serialize,Deserialize)]
pub struct TransportSnapshot{pub playing:bool,pub recording:bool,pub position_samples:u64,pub bpm:f64}
impl Default for TransportSnapshot{fn default()->Self{Self{playing:false,recording:false,position_samples:0,bpm:120.0}}}

#[derive(Debug,Clone,Serialize,Deserialize)]
pub struct DeviceState{pub instance_id:String,pub device_type:String,pub parameters:Vec<ParameterValue>}

#[derive(Debug,Clone,Copy,Serialize,Deserialize)]
pub struct ParameterValue{pub id:ParameterId,pub value:f32}

#[cfg(test)]
mod tests{use super::*;#[test]fn round_trip(){let s=Session::new("Proof");let j=serde_json::to_string(&s).unwrap();let d:Session=serde_json::from_str(&j).unwrap();assert_eq!(d.schema_version,CURRENT_SCHEMA_VERSION);}}
