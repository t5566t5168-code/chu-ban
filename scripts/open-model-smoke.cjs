const { chromium } = require('@playwright/test');
const { spawn } = require('node:child_process');
const { writeFile, mkdir } = require('node:fs/promises');
const assert = require('node:assert/strict');
(async () => {
 await mkdir('test-results', {recursive:true});
 const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--config','vite.renderer.config.mjs','--outDir','out/web','--host','127.0.0.1','--port','4180'],{stdio:'ignore',windowsHide:true});
 let browser;
 try {
  for(let i=0;i<40;i++){try{if((await fetch('http://127.0.0.1:4180')).ok)break;}catch{} await new Promise(r=>setTimeout(r,250));}
  browser=await chromium.launch({channel:'chrome',headless:true});
  const page=await browser.newPage();
  page.on('pageerror',error=>console.log('PAGE ERROR',error.message));
  page.on('console',message=>{if(message.type()==='error')console.log('CONSOLE',message.text().slice(0,400));});
  page.on('requestfailed',r=>console.log('FAILED',r.url().split('?')[0],r.failure()));
  const external=[];
  page.on('request',r=>{if(!r.url().startsWith('http://127.0.0.1'))external.push({method:r.method(),url:r.url().split('?')[0]});});
  await page.goto('http://127.0.0.1:4180');
  const picker=page.waitForEvent('filechooser'); await page.locator('[data-open]').first().click();
  await (await picker).setFiles({name:'sample.txt',mimeType:'text/plain',buffer:Buffer.from('今天的天气很好。我想去公园散步。')});
  await page.locator('#translation-toggle').click();
  assert.equal(external.length,0,'No model download before translate');
  await page.locator('#translation-example').click();
  await page.locator('#translate-run').click();
  const started=Date.now();
  let last='';
  for(let i=0;i<360;i++){
    const status=await page.locator('#translation-result').textContent();
    if(status!==last){console.log(status);last=status;}
    if(await page.locator('#translate-run').isEnabled())break;
    await page.locator('#translation-source').evaluate(el=>el.dataset.responsive='yes');
    await new Promise(r=>setTimeout(r,1000));
  }
  const translated=await page.locator('#translation-result').textContent();
  assert(/[A-Za-z]{3}/.test(translated) && !/失敗|下載|正在|無法/.test(translated),translated);
  assert(external.every(r=>r.method==='GET'),'External requests must only download assets');
  await page.screenshot({path:'test-results/open-model.png',fullPage:true});
  console.log(JSON.stringify({translated,elapsedMs:Date.now()-started,externalRequests:external.length}));
  await page.locator('#translation-source').fill('你好，世界。'); await page.locator('#translate-run').click();
  await page.locator('#translation-stop').click();
  assert((await page.locator('#translation-result').textContent()).includes('已停止'));
 }finally{await browser?.close();server.kill();}
})().catch(error=>{console.error(error);process.exitCode=1;});
