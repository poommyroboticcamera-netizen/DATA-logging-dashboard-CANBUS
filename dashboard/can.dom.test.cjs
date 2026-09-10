// Run the real dashboard against a bounded fake DOM/API, without CAN hardware.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
class Element {
  constructor(){this.children=[];this.textContent='';this.value='';this.classList={toggle(){}};}
  append(...nodes){this.children.push(...nodes);}
  replaceChildren(...nodes){this.children=[...nodes];}
  setAttribute(){}
  addEventListener(){}
}
const html=fs.readFileSync(__dirname+'/index.html','utf8');
const elements=new Map([...html.matchAll(/id="([^"]+)"/g)].map(m=>[m[1],new Element()]));
const workspace=new Element(), requests=[];
const packet={
  mode:'LISTEN_ONLY',active:true,enabled:true,requested_enabled:true,driver_state:'LISTENING',
  acquiring:true,bitrate:500000,tx_gpio:25,rx_gpio:26,capacity:16,frames:4,
  rx_session_frames:4,rx_standard:3,rx_extended:1,rx_rtr:1,last_rx_age_ms:20,
  log_state:'STOPPED',report_revision:1,candidates:[],ids:[
    {id:0x100,extended:false,rtr:false,dlc:4,count:1,hz:50,data:[0,0,0,37]},
    {id:0x100,extended:true,rtr:false,dlc:2,count:1,hz:50,data:[170,255]},
    {id:0x154,extended:false,rtr:false,dlc:0,count:1,hz:1,data:[]},
    {id:0x200,extended:false,rtr:true,dlc:8,count:1,hz:1,data:[]}
  ]
};
const context={
  document:{hidden:false,activeElement:null,getElementById:id=>{
    assert.ok(elements.has(id),'Missing HTML element: '+id);return elements.get(id);
  },querySelector:()=>workspace,querySelectorAll:()=>[],createElement:()=>new Element()},
  window:{},console,AbortSignal,URLSearchParams,setTimeout(){},
  fetch:async(path,options)=>{
    requests.push({path,options});
    return {ok:true,json:async()=>packet,text:async()=>'Candidate report'};
  }
};
vm.runInNewContext(fs.readFileSync(__dirname+'/can.js','utf8'),context);
(async()=>{
  for(let n=0;n<4;n++)await new Promise(setImmediate);
  const rows=elements.get('can-ids').children;
  assert.equal(rows.length,4);
  assert.equal(rows[0].children[0].textContent,'0x100');
  assert.equal(rows[1].children[1].textContent,'EXT');
  assert.equal(rows[2].children[5].textContent,'Empty payload');
  assert.match(rows[3].children[5].textContent,/Remote request/);
  assert.match(elements.get('can-diagnosis').textContent,/พบ CAN traffic/);
  await elements.get('can-acquire').onclick();
  assert.ok(requests.some(r=>r.options?.body?.get('command')==='STOP'));
  packet.rx_session_frames=0;
  await elements.get('can-status').onclick();
  assert.match(elements.get('can-diagnosis').textContent,/ยังไม่มีเฟรม/);
  // The actual fetch path reports disconnection instead of inventing zero traffic.
  const originalFetch=context.fetch;
  context.fetch=async(path,options)=>{
    if(path==='/api/can')throw Error('offline');
    return originalFetch(path,options);
  };
  await elements.get('can-status').onclick();
  assert.match(elements.get('can-diagnosis').textContent,/ข้อมูลเก่า/);
  console.log('PASS: real UI renders STD/EXT collision, zero DLC, RTR, controls and disconnected state');
})().catch(error=>{console.error(error);process.exitCode=1;});
