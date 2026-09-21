#![forbid(unsafe_code)]

use deep_dsp::{AudioBlockMut,AudioProcessor,ProcessContext};
use deep_rt::{channel,RtReceiver,RtSender};

pub struct ProcessorNode{pub id:u32,processor:Box<dyn AudioProcessor>}
impl ProcessorNode{pub fn new(id:u32,processor:impl AudioProcessor+'static)->Self{Self{id,processor:Box::new(processor)}}}

#[derive(Default)]
pub struct GraphPlan{nodes:Vec<ProcessorNode>}
impl GraphPlan{
    pub fn new()->Self{Self::default()}
    pub fn push(&mut self,node:ProcessorNode){self.nodes.push(node);}
    pub fn prepare(&mut self,sample_rate:f32,max_block:usize){for node in &mut self.nodes{node.processor.prepare(sample_rate,max_block);}}
    #[inline] pub fn process(&mut self,block:&mut AudioBlockMut<'_>,ctx:ProcessContext){for node in &mut self.nodes{node.processor.process(block,ctx);}}
}

pub struct GraphController{pending_tx:RtSender<GraphPlan>,retired_rx:RtReceiver<GraphPlan>}
impl GraphController{
    pub fn try_publish(&mut self,plan:GraphPlan)->Result<(),GraphPlan>{self.pending_tx.try_send(plan)}
    pub fn reclaim_retired(&mut self)->usize{let mut n=0;while self.retired_rx.try_recv().is_some(){n+=1;}n}
}

pub struct GraphRuntime{active:GraphPlan,pending_rx:RtReceiver<GraphPlan>,retired_tx:RtSender<GraphPlan>,pending_retire:Option<GraphPlan>}
impl GraphRuntime{
    fn service_swap(&mut self){
        if let Some(old)=self.pending_retire.take(){
            if let Err(old)=self.retired_tx.try_send(old){self.pending_retire=Some(old);return;}
        }
        if let Some(next)=self.pending_rx.try_recv(){
            let old=std::mem::replace(&mut self.active,next);
            if let Err(old)=self.retired_tx.try_send(old){self.pending_retire=Some(old);}
        }
    }
    pub fn process(&mut self,block:&mut AudioBlockMut<'_>,ctx:ProcessContext){self.service_swap();self.active.process(block,ctx);}
}

pub fn graph_runtime(initial:GraphPlan)->(GraphController,GraphRuntime){
    let(pending_tx,pending_rx)=channel(2); let(retired_tx,retired_rx)=channel(2);
    (GraphController{pending_tx,retired_rx},GraphRuntime{active:initial,pending_rx,retired_tx,pending_retire:None})
}
