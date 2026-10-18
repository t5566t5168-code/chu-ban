const samples = [
  {name:'在山裡，慢下來.txt',text:`離開城市的那天，我沒有帶走太多東西。一件薄外套，一本空白筆記，還有一個很久沒有好好休息的自己。

車沿著山路往上走，窗外的房子漸漸稀疏，取而代之的是一層又一層的綠。訊號時有時無，我索性把手機收進背包。原來不必回覆任何人的時候，時間真的會變得不一樣。

民宿在一條小路的盡頭。門前有棵老樹，樹下放著兩張木椅。主人替我倒了一杯茶，說山裡沒有什麼好玩的，只能走走，看看天。我說，這樣就很好。

第二天，我比鬧鐘更早醒來。

霧還停在窗外，遠處的山只露出一點輪廓。屋子很安靜，安靜到能聽見水壺裡的水慢慢燒開。我抱著杯子坐在門口，第一次沒有急著想今天要完成什麼。

小路上的石頭帶著露水，鞋底踩過落葉，發出細碎的聲音。走到轉彎的地方，一隻不知名的小鳥停在枝頭。我停下來，它也沒有走。我們就那樣看了彼此一會兒，直到風吹動了樹葉。

以前總覺得，旅行一定要去很遠的地方，要看很多風景，拍很多照片，才算沒有白來。可是這一次，我走了不到兩公里，卻覺得心裡空出了很大的一塊地方。

午後下起雨。我坐在窗邊讀書，讀了幾頁，又放下。雨聲替每一個句子留了停頓。偶爾有車經過，聲音從山的這一側，慢慢消失在另一側。

主人問我明天要不要去看日出。我想了一下，說如果醒了就去。說出這句話的時候，我忽然笑了。原來有些事情，也可以不用安排。

離開的早晨，霧散了。山比來時看得更清楚，路邊的草也亮了一些。我把那本幾乎沒寫過的筆記本放回背包。只有第一頁留下了一句話：

慢下來，不是為了走得更遠。只是為了知道，自己正在這裡。

回程的車上，手機重新有了訊號。我沒有立刻打開。窗外的陽光剛好落在手背上，溫溫的。我想先把這一刻，安安靜靜地讀完。`},
  {name:'城市睡著以後.txt',text:`十點半，巷口的麵包店熄了燈。老闆把最後一張椅子收進門裡，鐵門緩緩落下，替這條街畫了一道很輕的句點。

我提著一袋剛買的牛奶，沒有直接回家。夜裡的城市像一本翻到後半部的書，少了一些熱鬧，卻多了許多白天看不見的細節。

路口的紅燈亮著，一個人也沒有。便利商店的店員正在整理貨架，玻璃上映出一排整齊的光。遠處有人牽著狗，走得很慢，像是誰也不急著結束今天。

白天走過這裡，總是看著手機，想著下一個約定。直到今晚才發現，牆角有一株從磚縫裡長出來的小花。沒有人照顧它，它也好好地開了。

橋上的風有點涼。河水映著燈，碎成一條一條金色的線。我靠在欄杆旁，聽見身後單車的鈴聲，又很快遠去。

城市並沒有真的睡著。只是那些催促我們的聲音，暫時變小了。

我想起小時候，夏天常在門口乘涼。大人說著聽不懂的事，我坐在小板凳上，看飛蛾繞著燈轉。那時候一個晚上很長，長到可以什麼也不做。

現在我們有了更多可以做的事，卻好像忘了，什麼也不做也是一種選擇。

回到巷口，樓上的窗還亮著一盞燈。有人在等另一個人，有人在讀最後一頁書，也有人只是忘了關燈。我不必知道答案。

鑰匙轉動，門輕輕打開。我把牛奶放進冰箱，給自己倒了一杯水。今天沒有發生什麼特別的事。但我忽然覺得，這樣的一天，也值得被記住。`}
];
const $=id=>document.getElementById(id);let reading=false;let toastTimer;
function openPicker(){ $('picker-error').hidden=true;$('picker').showModal(); }
function notify(message){clearTimeout(toastTimer);$('toast').textContent=message;$('toast').hidden=false;toastTimer=setTimeout(()=>$('toast').hidden=true,3000);}
function showError(message){$('picker-error').textContent=message;$('picker-error').hidden=false;}
function loadText(name,text){
  if(!text.trim()){showError('這是一份空白檔案，請選擇其他文字檔。');return;}
  $('filename').textContent=name;$('reading-title').textContent=name.replace(/\.txt$/i,'');
  $('word-count').textContent=`${text.replace(/\s/g,'').length.toLocaleString()} 字`;
  $('reading-content').textContent=text;$('welcome').hidden=true;$('reader').hidden=false;reading=true;
  $('open-top').innerHTML='更換文字檔 <span aria-hidden="true">↗</span>';
  if($('picker').open)$('picker').close();window.scrollTo(0,0);$('reading-title').focus({preventScroll:true});notify('文字已開啟，慢慢讀。');
}
function goHome(event){event?.preventDefault();$('reader').hidden=true;$('welcome').hidden=false;reading=false;$('open-top').innerHTML='開啟文字檔 <span aria-hidden="true">↗</span>';window.scrollTo(0,0);$('open-main').focus({preventScroll:true});}
['open-top','open-main','open-end'].forEach(id=>$(id).addEventListener('click',openPicker));
document.querySelectorAll('[data-sample]').forEach(button=>button.addEventListener('click',()=>{const sample=samples[Number(button.dataset.sample)];loadText(sample.name,sample.text);}));
$('home').addEventListener('click',goHome);$('back').addEventListener('click',goHome);
$('empty-demo').addEventListener('click',()=>loadText('空白.txt',''));
$('error-demo').addEventListener('click',()=>showError('無法讀取這份檔案。請重試或選擇其他 TXT 檔案，目前的閱讀內容不會改變。'));
$('local-open').addEventListener('click',()=>{$('file-input').value='';$('file-input').click();});
$('file-input').addEventListener('change',async event=>{
  const file=event.target.files[0];if(!file)return;
  if(!/\.txt$/i.test(file.name)){showError('請選擇副檔名為 .txt 的文字檔。');return;}
  try{const text=new TextDecoder('utf-8',{fatal:true}).decode(await file.arrayBuffer());loadText(file.name,text);}
  catch{showError('讀取失敗。請確認檔案使用 UTF-8 編碼，再試一次。');}
});
$('picker').addEventListener('click',event=>{if(event.target===$('picker')){const rect=$('picker').getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)$('picker').close();}});
