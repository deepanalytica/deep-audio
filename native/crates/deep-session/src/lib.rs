#![forbid(unsafe_code)]

use deep_params::ParameterId;
use serde::{Deserialize,Serialize};

pub const CURRENT_SCHEMA_VERSION:u32=2;

#[derive(Debug,Clone,Serialize,Deserialize)]
pub struct Session{
    pub schema_version:u32,
    pub name:String,
    pub sample_rate:u32,
    pub active_room:RoomId,
    pub transport:TransportSnapshot,
    pub devices:Vec<DeviceState>,
    #[serde(default)]
    pub tracks:Vec<TrackState>,
    #[serde(default)]
    pub exports:Vec<ExportState>,
}
impl Session{
    pub fn new(name:impl Into<String>)->Self{
        Self{
            schema_version:CURRENT_SCHEMA_VERSION,
            name:name.into(),
            sample_rate:48_000,
            active_room:RoomId::Practice,
            transport:TransportSnapshot::default(),
            devices:Vec::new(),
            tracks:vec![TrackState::new("input-1","Input 1")],
            exports:Vec::new(),
        }
    }

    pub fn set_parameter(&mut self,device_type:&str,id:ParameterId,value:f32){
        let device=match self.devices.iter_mut().find(|device|device.device_type==device_type){
            Some(device)=>device,
            None=>{
                self.devices.push(DeviceState{
                    instance_id:format!("{device_type}-01"),
                    device_type:device_type.to_string(),
                    parameters:Vec::new(),
                });
                self.devices.last_mut().expect("device just inserted")
            }
        };
        if let Some(parameter)=device.parameters.iter_mut().find(|parameter|parameter.id==id){
            parameter.value=value;
        }else{
            device.parameters.push(ParameterValue{id,value});
        }
    }

    pub fn append_recording(&mut self,clip:ClipState){
        if self.tracks.is_empty(){self.tracks.push(TrackState::new("input-1","Input 1"));}
        self.tracks[0].clips.push(clip);
    }
}

#[derive(Debug,Clone,Copy,Serialize,Deserialize,PartialEq,Eq)]
#[serde(rename_all="snake_case")]
pub enum RoomId{Practice,Recording,Production,Mix,Mastering}

impl RoomId{
    pub fn parse(value:&str)->Option<Self>{
        match value{
            "practice"=>Some(Self::Practice),
            "record"=>Some(Self::Recording),
            "production"=>Some(Self::Production),
            "mix"=>Some(Self::Mix),
            "master"=>Some(Self::Mastering),
            _=>None,
        }
    }
}

#[derive(Debug,Clone,Serialize,Deserialize)]
pub struct TransportSnapshot{pub playing:bool,pub recording:bool,pub position_samples:u64,pub bpm:f64}
impl Default for TransportSnapshot{fn default()->Self{Self{playing:false,recording:false,position_samples:0,bpm:120.0}}}

#[derive(Debug,Clone,Serialize,Deserialize)]
pub struct DeviceState{pub instance_id:String,pub device_type:String,pub parameters:Vec<ParameterValue>}

#[derive(Debug,Clone,Copy,Serialize,Deserialize)]
pub struct ParameterValue{pub id:ParameterId,pub value:f32}

#[derive(Debug,Clone,Serialize,Deserialize)]
pub struct TrackState{
    pub id:String,
    pub name:String,
    pub armed:bool,
    pub muted:bool,
    pub solo:bool,
    pub gain_db:f32,
    pub clips:Vec<ClipState>,
}
impl TrackState{
    pub fn new(id:impl Into<String>,name:impl Into<String>)->Self{
        Self{id:id.into(),name:name.into(),armed:true,muted:false,solo:false,gain_db:0.0,clips:Vec::new()}
    }
}

#[derive(Debug,Clone,Serialize,Deserialize)]
pub struct ClipState{
    pub id:String,
    pub path:String,
    pub start_sample:u64,
    pub length_samples:u64,
    pub sample_rate:u32,
    pub channels:u16,
}

#[derive(Debug,Clone,Serialize,Deserialize)]
pub struct ExportState{
    pub path:String,
    pub created_unix:u64,
    pub format:String,
}

#[cfg(test)]
mod tests{
    use super::*;

    #[test]
    fn round_trip(){
        let s=Session::new("Proof");
        let j=serde_json::to_string(&s).unwrap();
        let d:Session=serde_json::from_str(&j).unwrap();
        assert_eq!(d.schema_version,CURRENT_SCHEMA_VERSION);
        assert_eq!(d.tracks.len(),1);
    }

    #[test]
    fn parameter_updates_are_stable(){
        let mut s=Session::new("Proof");
        s.set_parameter("deep_glue",ParameterId(2001),-22.0);
        s.set_parameter("deep_glue",ParameterId(2001),-18.0);
        assert_eq!(s.devices[0].parameters.len(),1);
        assert_eq!(s.devices[0].parameters[0].value,-18.0);
    }
}
