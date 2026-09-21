#![forbid(unsafe_code)]

#[cfg(feature="native-audio")]
pub mod native;

#[derive(Debug,Clone,Copy,PartialEq,Eq)]
pub enum BackendPreference{Default,Asio}
