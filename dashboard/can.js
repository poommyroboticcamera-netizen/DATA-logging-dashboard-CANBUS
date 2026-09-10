/* Exclusive CAN workspace. No raw-frame history or CAN CSV is buffered in browser RAM. */
const CanDashboardCore = (() => {
  const hex = n => '0x' + Number(n).toString(16).toUpperCase();
  const states = {STOPPED:'ปิดไฟล์แล้ว',OPENING:'กำลังสร้างไฟล์',RECORDING:'กำลังบันทึกลง SD',CLOSING:'กำลังเขียนข้อมูลค้างและปิดไฟล์',MOUNT_FAILED:'เปิด SD ไม่สำเร็จ · ตรวจการ์ดและสาย',OPEN_FAILED:'สร้างไฟล์ CSV ไม่สำเร็จ',WRITE_FAILED:'เขียน SD ไม่สำเร็จ · ข้อมูลบางส่วนอาจสูญหาย',STOPPED_WITH_ERRORS:'ปิดไฟล์แล้ว แต่พบข้อผิดพลาดการเขียน'};
  const driverStates = {DISABLED:'CAN ปิดอยู่',STARTING:'กำลังเปิด CAN',LISTENING:'เปิดตัวรับแล้ว · Listen-only',STOPPING:'กำลังปิด CAN',START_FAILED:'เปิด CAN ไม่สำเร็จ'};
  function diagnosis(p) {
    if(p.driver_state==='START_FAILED')return 'เปิดตัวรับไม่สำเร็จ · error '+p.start_error;
    if(!p.enabled)return 'CAN ยังไม่เปิดรับ · เลือก bitrate แล้วกดเปิด CAN';
    if(!p.acquiring)return 'พักการวิเคราะห์อยู่ · กดเริ่มวิเคราะห์ต่อ';
    if(!p.rx_session_frames)return 'ยังไม่มีเฟรมเข้าตั้งแต่เปิด CAN · ตรวจตัวส่ง, bitrate, RX26 และสายบัส';
    if(p.last_rx_age_ms>2000)return 'เคยรับเฟรมแล้ว แต่ไม่มีเฟรมใหม่เกิน 2 วินาที · อาจเป็น traffic ที่ส่งไม่ต่อเนื่อง';
    return 'พบ CAN traffic · รับทุก Standard/Extended ID และ DATA/RTR';
  }
  function packet(p) {
    if(!p || p.mode!=='LISTEN_ONLY' || !Array.isArray(p.ids) || p.ids.length>128)throw Error('รูปแบบข้อมูล CAN ไม่ตรงกับเฟิร์มแวร์');
    return p;
  }
  return {hex,states,driverStates,packet,diagnosis};
})();
if(typeof module!=='undefined')module.exports=CanDashboardCore;
if(typeof document!=='undefined')(() => {
  'use strict';
  const $=id=>document.getElementById(id), C=CanDashboardCore;
  let mode='dashboard', changing=false, busy=false, closing=false, lastSuccess=0, lastPacket=null;
  let previousFrames=0, previousSampleAt=Date.now(), recordingStartedAt=0;
  const trendRate=[], trendRaw=[];
  window.DashboardModes={current:()=>mode,interval:()=>mode==='dashboard'?250:1000};
  function note(text,error=false) { $('mode-status').textContent=text;$('mode-status').classList.toggle('mode-error',error); }
  function showMode(next) {
    mode=next;
    document.querySelector('.workspace').hidden=mode!=='dashboard';
    $('mode-can').hidden=mode!=='can';
    document.querySelectorAll('[data-mode]').forEach(b=>{const selected=b.dataset.mode===mode;b.classList.toggle('selected',selected);b.setAttribute('aria-selected',String(selected));});
    document.querySelectorAll('.sidebar nav a').forEach(a=>{const selected=mode==='can'?a.id==='nav-can':a.getAttribute('href')==='#overview';a.classList.toggle('active',selected);if(selected)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});
  }
  async function post(path, values) {
    const response=await fetch(path,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded','X-Dashboard-Request':'1'},body:new URLSearchParams(values),signal:AbortSignal.timeout(5000)});
    if(!response.ok)throw Error(await response.text());return response.json();
  }
  async function select(next) {
    if(changing || !['dashboard','can'].includes(next))return;
    if(next===mode)return;
    changing=true;
    document.querySelectorAll('[data-mode]').forEach(b=>b.disabled=true);
    try {
      await post('/api/can/mode',{mode:next});
      const previous=mode;closing=previous==='can' && next!=='can';showMode(next);
      note(mode==='can'?'เข้า CAN Analyzer แล้ว · เลือก bitrate และกดเปิด CAN':closing?'กำลังปิด CAN และไฟล์ CSV ก่อนกลับ Overview':'Overview');
      if(mode==='can')pollCan();
    } catch(error) { note('เปลี่ยนโหมดไม่สำเร็จ: '+error.message,true); }
    finally {changing=false;document.querySelectorAll('[data-mode]').forEach(b=>b.disabled=false);}
  }
  async function send(command) {
    try {await post('/api/can/command',{command});note('ส่งคำสั่งแล้ว · รอผลจากบอร์ด');await pollCan();}
    catch(error){note(error.message,true);}
  }
  function cell(row,text) {const td=document.createElement('td');td.textContent=text;row.append(td);return td;}
  function gauge(id,value,max) {
    const element=$(id);if(element?.style?.setProperty)element.style.setProperty('--level',String(Math.max(0,Math.min(100,max?value/max*100:0))));
  }
  function drawTrend() {
    const canvas=$('can-trend');if(!canvas || typeof canvas.getContext!=='function')return;
    const ratio=window.devicePixelRatio||1,width=Math.max(320,canvas.clientWidth),height=180;
    if(canvas.width!==Math.round(width*ratio)||canvas.height!==Math.round(height*ratio)){canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);}
    const ctx=canvas.getContext('2d');ctx.setTransform(ratio,0,0,ratio,0,0);ctx.clearRect(0,0,width,height);
    const plot=(values,max,color)=>{if(values.length<2)return;ctx.beginPath();values.forEach((value,index)=>{const x=index/59*width,y=height-10-Math.min(1,value/max)*(height-20);index?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.strokeStyle=color;ctx.lineWidth=2;ctx.stroke();};
    plot(trendRate,1000,'#5d9ff5');plot(trendRaw,255,'#b184ea');
  }
  function renderReadings(p) {
    const now=Date.now(),seconds=Math.max(.001,(now-previousSampleAt)/1000),rate=Math.max(0,(Number(p.frames)-previousFrames)/seconds);
    previousFrames=Number(p.frames);previousSampleAt=now;
    const load=Math.min(100,(p.ids||[]).reduce((sum,item)=>sum+Number(item.hz||0)*((item.extended?67:47)+(item.rtr?0:8*Number(item.dlc||0))),0)/Math.max(1,Number(p.bitrate))*100);
    const busiest=[...(p.ids||[])].sort((a,b)=>Number(b.count)-Number(a.count))[0];
    const raw=busiest&&!busiest.rtr&&busiest.data?.length?Number(busiest.data[0]):0;
    $('can-rate').textContent=rate.toFixed(1);$('can-load').textContent=load.toFixed(1);$('can-active-ids').textContent=p.ids.length;$('can-id-scale').textContent=p.capacity;$('can-raw').textContent=raw;
    $('can-raw-source').textContent=busiest?`${C.hex(busiest.id)} · byte 0 · candidate เท่านั้น`:'ยังไม่มี candidate';
    gauge('can-gauge-rate',rate,1000);gauge('can-gauge-load',load,100);gauge('can-gauge-ids',p.ids.length,p.capacity);gauge('can-gauge-raw',raw,255);
    trendRate.push(rate);trendRaw.push(raw);if(trendRate.length>60)trendRate.shift();if(trendRaw.length>60)trendRaw.shift();drawTrend();
    const active=p.log_state==='RECORDING';if(active&&!recordingStartedAt)recordingStartedAt=now;if(!active)recordingStartedAt=0;
    $('can-recording-rows').textContent=Number(p.rows).toLocaleString();$('can-recording-badge').textContent=active?'กำลังเก็บ':'พร้อม';$('can-recording-badge').className='pill '+(active?'on':'');document.querySelector('.recording-card')?.classList.toggle('active',active);
    const elapsed=recordingStartedAt?Math.floor((now-recordingStartedAt)/1000):0,h=String(Math.floor(elapsed/3600)).padStart(2,'0'),m=String(Math.floor(elapsed%3600/60)).padStart(2,'0'),s=String(elapsed%60).padStart(2,'0');
    $('can-recording-time').textContent=active?`เวลาที่บันทึก ${h}:${m}:${s} · ทุก valid frame`:p.file?`ไฟล์ล่าสุด ${p.file}`:'CSV logger หยุดอยู่';
  }
  function renderCan(p) {
    if(p.demo){closing=false;note('ตัวอย่างหน้าเว็บเท่านั้น · ไม่มีเฟรม CAN หรือไฟล์ SD จริง');}
    $('can-log-state').textContent=C.states[p.log_state]||p.log_state;
    $('can-log-state').className='pill '+(p.log_state==='RECORDING'?'on':'');
    const requested=!!p.requested_enabled, listening=!!p.enabled;
    $('can-enable').textContent=requested?'ปิด CAN':'เปิด CAN';
    $('can-enable').setAttribute('aria-pressed',String(requested));
    $('can-enable').className=requested?'secondary':'primary';
    $('can-enable').disabled=['STARTING','STOPPING'].includes(p.driver_state);
    $('can-driver-state').textContent=C.driverStates[p.driver_state]||p.driver_state;
    $('can-driver-state').className='pill '+(listening?'on':'');
    $('can-diagnosis').textContent=C.diagnosis(p);
    $('can-rx-count').textContent=Number(p.rx_session_frames||0).toLocaleString();
    $('can-rx-types').textContent='STD '+(p.rx_standard||0)+' · EXT '+(p.rx_extended||0)+' · RTR '+(p.rx_rtr||0)+' (RTR รวมอยู่ใน STD/EXT)';
    $('can-last-rx').textContent=p.last_rx_age_ms>=0 ? 'เฟรมล่าสุด '+(p.last_rx_age_ms/1000).toFixed(2)+' วินาทีที่แล้ว' : 'ยังไม่มีเฟรม';
    $('can-errors').textContent='REC '+(p.rx_error_counter||0)+' · TEC '+(p.tx_error_counter||0)+' · bus errors สะสม '+(p.bus_errors||0)+' · invalid '+(p.invalid_frames||0);
    $('can-acquire').disabled=!listening;
    $('can-acquire').textContent=p.acquiring?'พักการวิเคราะห์':'เริ่มวิเคราะห์ต่อ';
    $('can-capacity').textContent='ติดตามได้ '+p.capacity+' traffic records (แยก STD/EXT และ DATA/RTR) · เฟรมที่ไม่มีช่องเก็บสถิติ '+p.db_full+' · SD ยังรับเฟรมเหล่านี้ได้';
    if(document.activeElement!==$('can-bitrate'))$('can-bitrate').value=String(p.bitrate);
    const changingDriver=requested || listening || ['STARTING','STOPPING'].includes(p.driver_state);
    $('can-bitrate').disabled=changingDriver;$('can-bitrate-apply').disabled=changingDriver;
    $('can-log-start').disabled=!listening || !p.acquiring;
    $('can-file').textContent=p.file||'ยังไม่มีไฟล์';
    $('can-frame-count').textContent=Number(p.frames).toLocaleString();
    $('can-id-count').textContent=`${p.ids.length} / ${p.capacity}`;
    $('can-drops').textContent=`RX ${p.driver_missed+p.driver_overruns} · วิเคราะห์ ${p.analysis_drops} · CSV ${p.log_drops}`;
    $('can-memory').textContent=p.demo?'ไม่วัด RAM ในหน้า demo':`ว่าง ${Math.round(p.free_heap/1024)} KiB · ต่ำสุด ${Math.round(p.min_heap/1024)} KiB`;
    renderReadings(p);
    $('can-wiring').textContent=`${p.bitrate/1000} kbit/s · TX GPIO${p.tx_gpio} / RX GPIO${p.rx_gpio} · ตรวจสายก่อนต่อรถ`;
    $('can-rows').textContent=`รับเข้า buffer/เขียนแล้ว ${Number(p.rows).toLocaleString()} แถว · write errors ${p.write_errors} · database-full frames ${p.db_full}`;
    const tbody=$('can-ids');tbody.replaceChildren();
    [...p.ids].sort((a,b)=>b.count-a.count).forEach(item=>{
      const row=document.createElement('tr');cell(row,C.hex(item.id));cell(row,(item.extended?'EXT':'STD')+(item.rtr?' RTR':''));
      cell(row,item.dlc);cell(row,Number(item.count).toLocaleString());cell(row,Number(item.hz).toFixed(1));
      cell(row,item.rtr?'Remote request · ไม่มี payload':(item.data||[]).map(v=>Number(v).toString(16).padStart(2,'0').toUpperCase()).join(' ')||'Empty payload');
      cell(row,item.rtr?'RTR':'DATA');tbody.append(row);
    });
    $('can-empty').hidden=p.ids.length>0;
    if(p.write_errors || /FAILED|ERRORS/.test(p.log_state))note(C.states[p.log_state]||'มีข้อผิดพลาด SD · ตรวจข้อมูลตกหล่นก่อนใช้ผล',true);
    else if(closing && p.log_state==='STOPPED'){closing=false;note(`ปิดไฟล์ CAN แล้ว: ${p.file || 'ไม่มีไฟล์'}`);}
    else if(mode==='can' && p.log_state==='RECORDING')note(`CAN รับแบบ Listen-only · กำลังเก็บ CSV ${p.file}`);
    else if(mode==='can')note(C.diagnosis(p),p.driver_state==='START_FAILED');
    if(closing && !p.log && ['STOPPED_WITH_ERRORS','MOUNT_FAILED','OPEN_FAILED','WRITE_FAILED'].includes(p.log_state))closing=false;
  }
  async function pollCan() {
    if(busy || (mode!=='can'&&!closing) || document.hidden)return;
    busy=true;
    try {
      const r=await fetch('/api/can',{cache:'no-store',signal:AbortSignal.timeout(2500)});if(!r.ok)throw Error(await r.text());
      lastPacket=C.packet(await r.json());lastSuccess=Date.now();renderCan(lastPacket);
    } catch(error){note('ยังยืนยันสถานะ CAN ไม่ได้: '+error.message,true);$('can-log-state').textContent='ขาดการเชื่อมต่อ · สถานะล่าสุดอาจเก่า';$('can-diagnosis').textContent='ติดต่อบอร์ดไม่ได้ · ค่าที่แสดงเป็นข้อมูลเก่า';}
    finally{busy=false;}
  }
  document.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>select(b.dataset.mode)));
  document.querySelectorAll('.sidebar a[href^="#"]').forEach(a=>a.addEventListener('click',async event=>{
    if(a.id==='nav-can'){event.preventDefault();await select('can');return;}
    if(mode!=='dashboard'){event.preventDefault();await select('dashboard');document.querySelector(a.getAttribute('href'))?.scrollIntoView();}
  }));
  $('can-log-start').onclick=()=>send('LOG START');$('can-log-stop').onclick=()=>send('LOG STOP');
  $('can-enable').onclick=async()=>{
    try{const enable=!(lastPacket?.requested_enabled||lastPacket?.enabled);await post('/api/can/control',{enabled:enable?'1':'0'});note(enable?'กำลังเปิด CAN แบบ Listen-only':'กำลังปิด CAN และไฟล์ CSV');await pollCan();}
    catch(error){note(error.message,true);}
  };
  $('can-bitrate-apply').onclick=async()=>{
    try{await post('/api/can/bitrate',{bitrate:$('can-bitrate').value});note('บันทึก Bitrate แล้ว · กดเปิด CAN เพื่อเริ่มรับข้อมูล');await pollCan();}
    catch(error){note(error.message,true);}
  };
  $('can-status').onclick=()=>send('STATUS');
  $('can-acquire').onclick=()=>send(lastPacket?.acquiring?'STOP':'START');
  $('can-reset').onclick=()=>send('RESET');
  async function next(){await pollCan();setTimeout(next,1000);}
  async function synchronizeMode() {
    try {
      const response=await fetch('/api/can',{cache:'no-store',signal:AbortSignal.timeout(2500)});
      if(response.ok) {
        lastPacket=C.packet(await response.json());
        if(lastPacket.active) {
          showMode('can');
          renderCan(lastPacket);
          note(C.diagnosis(lastPacket));
        }
      }
    } catch {}
    next();
  }
  synchronizeMode();
})();
