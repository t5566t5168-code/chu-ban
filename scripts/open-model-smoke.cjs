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
  const hy = process.env.MODEL_ENGINE === 'hy';
  await page.locator('#translation-engine').selectOption(hy ? 'hy' : 'local');
  await page.locator('#translation-example').click();
  if (hy) {
    await page.locator('#translation-source').fill('The weather is nice today.');
    await page.locator('#translation-language').selectOption('ja');
  }
  await page.locator('#translate-run').click();
  const started=Date.now();
  let last='';
  for(let i=0;i<900;i++){
    const status=await page.locator('#translation-result').textContent();
    if(status!==last){console.log(status);last=status;}
    if(await page.locator('#translate-run').isEnabled())break;
    await page.locator('#translation-source').evaluate(el=>el.dataset.responsive='yes');
    await new Promise(r=>setTimeout(r,1000));
  }
  const translated=await page.locator('#translation-result').textContent();
  assert((hy ? /[\u3040-\u30ff]/.test(translated) : /[A-Za-z]{3}/.test(translated)) && !/失敗|下載|正在|無法/.test(translated),translated);
  assert(external.every(r=>['GET', 'HEAD'].includes(r.method)),'External requests must only retrieve assets or their metadata: ' + JSON.stringify(external));
  await page.screenshot({path:'test-results/open-model.png',fullPage:true});
  console.log(JSON.stringify({translated,elapsedMs:Date.now()-started,externalRequests:external.length}));
  if (hy) {
    await page.locator('#translation-source').fill('今天的天氣很好，我想去公園散步。');
    await page.locator('#translation-source-language').selectOption('zh-Hant');
    await page.locator('#translation-language').selectOption('en');
    await page.locator('#translate-run').click();
    await page.waitForFunction(() => !document.querySelector('#translate-run').disabled, null, {timeout:180000});
    const english = await page.locator('#translation-result').textContent();
    assert(/park|walk/i.test(english), english);
    console.log('Chinese to English:', english);
  }
  await page.locator('#translation-source').fill('你好，世界。'); await page.locator('#translate-run').click();
  await page.locator('#translation-stop').click();
  assert((await page.locator('#translation-result').textContent()).includes('已停止'));
 }finally{await browser?.close();server.kill();}
})().catch(error=>{console.error(error);process.exitCode=1;});
