#![forbid(unsafe_code)]

use rtrb::{Consumer, Producer, RingBuffer};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub struct RtParameterId(pub u32);

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TransportState { Stopped, Playing, Recording }

#[derive(Debug, Clone, Copy, PartialEq)]
pub enum RtCommand {
    SetParameter { id: RtParameterId, value: f32 },
    SetTransport(TransportState),
    Reset,
}

pub struct RtSender<T> { inner: Producer<T> }
impl<T> RtSender<T> {
    #[inline]
    pub fn try_send(&mut self, value: T) -> Result<(), T> {
        self.inner.push(value).map_err(|err| match err { rtrb::PushError::Full(value) => value })
    }
}

pub struct RtReceiver<T> { inner: Consumer<T> }
impl<T> RtReceiver<T> {
    #[inline]
    pub fn try_recv(&mut self) -> Option<T> { self.inner.pop().ok() }
}

pub fn channel<T>(capacity: usize) -> (RtSender<T>, RtReceiver<T>) {
    assert!(capacity > 0);
    let (producer, consumer) = RingBuffer::new(capacity);
    (RtSender { inner: producer }, RtReceiver { inner: consumer })
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn round_trip() {
        let (mut tx, mut rx) = channel(2);
        tx.try_send(7_u32).unwrap();
        assert_eq!(rx.try_recv(), Some(7));
        assert_eq!(rx.try_recv(), None);
    }
}
