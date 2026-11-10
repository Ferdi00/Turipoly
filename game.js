const spaces = [
  {name:'Via del Cartellino',emoji:'🚪',type:'start',description:'Si timbra e si ricomincia. Incassa €200 quando passi di qui.'},
  {name:'Scrivania vicino alla finestra',emoji:'🪟',type:'property',price:120,rent:24,color:'#91ae78'},
  {name:'La macchinetta del caffè',emoji:'☕',type:'event',event:'coffee'},
  {name:'Postazione con doppio monitor',emoji:'🖥️',type:'property',price:160,rent:32,color:'#91ae78'},
  {name:'Stampante in sciopero',emoji:'🖨️',type:'event',event:'printer'},
  {name:'Riunione che poteva essere un’email',emoji:'📅',type:'event',event:'meeting'},
  {name:'Sala riunioni panoramica',emoji:'🪴',type:'property',price:200,rent:40,color:'#81a57c'},
  {name:'Smart working dal divano',emoji:'🛋️',type:'event',event:'remote'},
  {name:'Angolo snack',emoji:'🍪',type:'property',price:220,rent:44,color:'#81a57c'},
  {name:'Parcheggi nel posto riservato del direttore',emoji:'🚗',type:'event',event:'parking'},
  {name:'Riunione urgente con Turi',emoji:'👔',type:'jail',description:'Turi ti vuole vedere. Salta un turno e prepara una slide.'},
  {name:'Progetto “per ieri”',emoji:'⏰',type:'property',price:260,rent:52,color:'#d7a85a'},
  {name:'Il capo scrive “hai un minuto?”',emoji:'💬',type:'event',event:'boss'},
  {name:'Ufficio con aria condizionata',emoji:'❄️',type:'property',price:280,rent:56,color:'#d7a85a'},
  {name:'Distributore di snack',emoji:'🥨',type:'property',price:300,rent:60,color:'#d7a85a'},
  {name:'Venerdì, ore 16:59',emoji:'🕔',type:'event',event:'friday'},
  {name:'La sala riunioni è libera',emoji:'🔑',type:'property',price:320,rent:64,color:'#ce8769'},
  {name:'Pranzo di team',emoji:'🍝',type:'event',event:'lunch'},
  {name:'Il tuo progetto preferito',emoji:'💡',type:'property',price:340,rent:68,color:'#ce8769'},
  {name:'Bonus: obiettivo centrato',emoji:'🎯',type:'event',event:'bonus'},
  {name:'Ferie approvate',emoji:'🏖️',type:'rest',description:'Una giornata senza notifiche. Incassa €100 di serenità.'},
  {name:'Postazione del capo',emoji:'🪑',type:'property',price:380,rent:76,color:'#a987ad'},
  {name:'La macchinetta si mangia la moneta',emoji:'🪙',type:'event',event:'coin'},
  {name:'Ufficio tutto per te',emoji:'🏢',type:'property',price:420,rent:84,color:'#a987ad'},
  {name:'Fine mese: report spese',emoji:'🧾',type:'event',event:'expenses'},
  {name:'La stampante finalmente funziona',emoji:'✅',type:'event',event:'printerWin'},
  {name:'Terrazza aziendale',emoji:'🌿',type:'property',price:460,rent:92,color:'#568a8b'},
  {name:'Turi offre il caffè',emoji:'☕',type:'event',event:'turiCoffee'},
  {name:'Ufficio vista mare (quasi)',emoji:'🌊',type:'property',price:500,rent:100,color:'#568a8b'},
  {name:'Promozione: da lunedì!',emoji:'📈',type:'event',event:'promotion'},
  {name:'Festa aziendale',emoji:'🎉',type:'rest',description:'Hai fatto networking vicino al buffet. Incassa €150.'},
  {name:'Sala del consiglio',emoji:'🏛️',type:'property',price:560,rent:112,color:'#5472a0'},
  {name:'Imprevisto',emoji:'🎲',type:'event',event:'chance'},
  {name:'L’ufficio di Turi',emoji:'👔',type:'property',price:620,rent:124,color:'#5472a0'},
  {name:'Team building obbligatorio',emoji:'🧗',type:'event',event:'team'},
  {name:'Giardino segreto dell’ufficio',emoji:'🌳',type:'property',price:680,rent:136,color:'#5472a0'},
  {name:'Messaggio: “ci sentiamo lunedì”',emoji:'📨',type:'event',event:'monday'},
  {name:'Parcheggio VIP',emoji:'🅿️',type:'property',price:740,rent:148,color:'#6f849b'},
  {name:'Revisione budget',emoji:'📉',type:'event',event:'budget'},
  {name:'Parcheggio coperto',emoji:'🚘',type:'property',price:780,rent:156,color:'#6f849b'}
];
const colors=['#3274a1','#d76246','#8c64a7','#d1a339'];
const tokens=['🧑‍💻','🧑‍🔧','🧑‍🎨','🧑‍🚀'];
let players=[];let current=0;let owners={};let skipTurns={};let busy=false;let pendingSpace=null;
const $=id=>document.getElementById(id);
function init(){players=[{name:'Collega 1',cash:1500,pos:0},{name:'Collega 2',cash:1500,pos:0}];current=0;owners={};skipTurns={};busy=false;pendingSpace=null;render();$('center-hint').textContent='Che la settimana lavorativa abbia inizio.';}
function coords(i){if(i<10)return[10,10-i,'bottom'];if(i<20)return[20-i,0,'left'];if(i<30)return[0,i-20,'top'];return[i-30,10,'right'];}
const tileLabels={
  'Via del Cartellino':'Ingresso',
  'Scrivania vicino alla finestra':'Scrivania finestra',
  'La macchinetta del caffè':'Macchinetta caffè',
  'Postazione con doppio monitor':'Doppio monitor',
  'Stampante in sciopero':'Stampante KO',
  'Riunione che poteva essere un’email':'Riunione-email',
  'Sala riunioni panoramica':'Sala panoramica',
  'Smart working dal divano':'Smart working',
  'Angolo snack':'Angolo snack',
  'Parcheggi nel posto riservato del direttore':'Parcheggio capo',
  'Riunione urgente con Turi':'Da Turi!',
  'Progetto “per ieri”':'Progetto urgente',
  'Il capo scrive “hai un minuto?”':'“Hai un minuto?”',
  'Ufficio con aria condizionata':'Aria condizionata',
  'Distributore di snack':'Distributore snack',
  'Venerdì, ore 16:59':'Venerdì 16:59',
  'La sala riunioni è libera':'Sala riunioni libera',
  'Pranzo di team':'Pranzo di team',
  'Il tuo progetto preferito':'Progetto preferito',
  'Bonus: obiettivo centrato':'Obiettivo centrato',
  'Ferie approvate':'Ferie!',
  'Postazione del capo':'Postazione Turi',
  'La macchinetta si mangia la moneta':'Moneta inghiottita',
  'Ufficio tutto per te':'Ufficio tutto tuo',
  'Fine mese: report spese':'Report spese',
  'La stampante finalmente funziona':'Stampante OK',
  'Turi offre il caffè':'Caffè di Turi',
  'Terrazza aziendale':'Terrazza aziendale',
  'Ufficio vista mare (quasi)':'Vista mare',
  'Promozione: da lunedì!':'Promozione',
  'Festa aziendale':'Festa aziendale',
  'Sala del consiglio':'Sala del consiglio',
  'Imprevisto':'Imprevisto!',
  'L’ufficio di Turi':'Ufficio di Turi',
  'Team building obbligatorio':'Team building',
  'Giardino segreto dell’ufficio':'Giardino segreto',
  'Messaggio: “ci sentiamo lunedì”':'Ci sentiamo lunedì',
  'Parcheggio VIP':'Parcheggio VIP',
  'Revisione budget':'Revisione budget'
};
function renderBoard(){const board=$('board');board.querySelectorAll('.space').forEach(n=>n.remove());spaces.forEach((s,i)=>{const [r,c,side]=coords(i);const el=document.createElement('div');el.className=`space ${side} ${[0,10,20,30].includes(i)?'corner':''}`;el.style.gridRow=r+1;el.style.gridColumn=c+1;el.title=`${s.name}${s.price?` · €${s.price}`:''}`;if(owners[i]!==undefined){el.classList.add('owned');el.style.setProperty('--owner-color',colors[owners[i]])}const stripe=document.createElement('span');stripe.className='space-color';stripe.style.background=s.color||({event:'#e6b64c',jail:'#cb5a47',start:'#326b50',rest:'#91ae78'}[s.type]||'#91ae78');const emoji=document.createElement('span');emoji.className='space-emoji';emoji.textContent=s.emoji;const name=document.createElement('span');name.className='space-name';name.textContent=tileLabels[s.name]||s.name;el.append(stripe,emoji,name);if(s.price){const price=document.createElement('span');price.className='space-price';price.textContent=`€${s.price}`;el.append(price)}const row=document.createElement('span');row.className='space-token-row';players.forEach((p,n)=>{if(p.pos===i){const token=document.createElement('span');token.className=`token p${n}`;token.style.background=colors[n];token.textContent=tokens[n];token.setAttribute('aria-label',p.name);row.append(token)}});el.append(row);board.append(el)});}
function renderPlayers(){const list=$('players-list');list.replaceChildren();players.forEach((p,i)=>{const card=document.createElement('div');card.className=`player-card ${i===current?'active':''}`;const avatar=document.createElement('span');avatar.className='avatar';avatar.textContent=tokens[i];avatar.style.background=`${colors[i]}18`;const main=document.createElement('div');main.className='player-main';const name=document.createElement('div');name.className='player-name';name.textContent=p.name;name.title='Clicca per cambiare nome';name.tabIndex=0;name.role='button';name.addEventListener('click',()=>rename(i));name.addEventListener('keydown',e=>{if(e.key==='Enter')rename(i)});const meta=document.createElement('div');meta.className='player-meta';meta.textContent=skipTurns[i]?'In riunione con Turi':`Casella ${p.pos+1} · ${i===current?'Tocca a te':'In attesa'}`;main.append(name,meta);const cash=document.createElement('div');cash.className='player-cash';cash.textContent=`€${p.cash}`;const cashLabel=document.createElement('small');cashLabel.textContent='liquidità';cash.append(cashLabel);card.append(avatar,main,cash);list.append(card)});$('center-player').textContent=players[current]?.name||'—';$('add-player').disabled=players.length>=4;}
function render(){renderBoard();renderPlayers()}
function rename(i){if(busy)return;const n=prompt('Come si chiama questo collega?',players[i].name);if(n&&n.trim()){players[i].name=n.trim().slice(0,22);render();log(`${tokens[i]} ${players[i].name} è pronto a giocare.`)}}
function addPlayer(){if(players.length>=4||busy)return;players.push({name:`Collega ${players.length+1}`,cash:1500,pos:0});render();log(`${tokens[players.length-1]} Un nuovo collega entra in ufficio.`)}
function log(message){const li=document.createElement('li');const dot=document.createElement('span');dot.className='log-dot';const text=document.createElement('span');text.textContent=message;const time=document.createElement('time');time.textContent='ora';li.append(dot,text,time);$('activity-log').prepend(li);while($('activity-log').children.length>8)$('activity-log').lastElementChild.remove()}
function status(icon,title,body){$('status-card').innerHTML='';const e=document.createElement('span');e.className='status-emoji';e.textContent=icon;const box=document.createElement('div');const strong=document.createElement('strong');strong.textContent=title;const p=document.createElement('p');p.textContent=body;box.append(strong,p);$('status-card').append(e,box)}
const money=(i,n,why)=>{players[i].cash+=n;const val=`€${Math.abs(n)}`;if(n>=0)status('💸',`+${val}`,why);else status('🧾',`-${val}`,why)};
function roll(){if(busy)return;busy=true;const p=players[current];if(skipTurns[current]){skipTurns[current]--;log(`${p.name} resta in riunione con Turi: turno saltato.`);status('👔','Ancora in riunione','Turi ha una domanda veloce (che non è veloce).');nextTurn();return}const a=1+Math.floor(Math.random()*6),b=1+Math.floor(Math.random()*6),sum=a+b;$('dice-display').innerHTML=`<span>${['⚀','⚁','⚂','⚃','⚄','⚅'][a-1]}</span><span>${['⚀','⚁','⚂','⚃','⚄','⚅'][b-1]}</span>`;$('center-hint').textContent=`${a} + ${b} = ${sum} caselle. Si va!`;setTimeout(()=>movePlayer(sum),350)}
function movePlayer(amount){const p=players[current];const old=p.pos;p.pos=(old+amount)%spaces.length;if(old+amount>=spaces.length){money(current,200,'Hai completato un altro giro di ufficio. Incassi lo stipendio.');log(`${p.name} passa dal cartellino e incassa €200.`)}render();const s=spaces[p.pos];log(`${p.name} arriva su “${s.name}”.`);resolve(s)}
function resolve(s){const p=players[current];if(s.type==='property'){if(owners[p.pos]===undefined){if(p.cash>=s.price){pendingSpace=p.pos;$('dialog-icon').textContent=s.emoji;$('dialog-title').textContent='Nuova postazione!';$('dialog-description').textContent=`${s.name} costa €${s.price}. Se la compri, chi ci capiterà sopra ti dovrà €${s.rent}.`; $('confirm-buy').textContent=`Compra · €${s.price}`;$('choice-dialog').showModal();return}status('💸','Budget insufficiente',`Ti servono €${s.price} per comprare ${s.name}.`)}else if(owners[p.pos]!==current){const owner=owners[p.pos],rent=s.rent;players[current].cash-=rent;players[owner].cash+=rent;status('🏢',`Affitto: €${rent}`,`${p.name} paga ${players[owner].name} per usare ${s.name}.`);log(`${p.name} paga €${rent} a ${players[owner].name} per la postazione.`)}else status('🪑','La tua postazione',`Ti godi ${s.name} senza pagare affitto.`)}else if(s.type==='start'){status('🚪','Inizio del giro','Hai timbrato. Buona giornata lavorativa!')}else if(s.type==='jail'){skipTurns[current]=1;status('👔','Convocazione urgente',s.description);log(`${p.name} viene convocato da Turi. Salta il prossimo turno.`)}else if(s.type==='rest'){money(current,s.name==='Ferie approvate'?100:150,s.description)}else if(doEvent(s.event)===false)return;render();if(!busy)return;setTimeout(nextTurn,1000)}
function doEvent(id){const p=players[current];const events={coffee:()=>{money(current,-2,'La macchinetta si è mangiata la moneta. Almeno il caffè era buono?');log(`${p.name} perde €2 alla macchinetta.`)},printer:()=>{money(current,-50,'La stampante ha inghiottito il report. Toner e pazienza a carico tuo.');log(`${p.name} paga €50 per la stampante.`)},meeting:()=>{money(current,-20,'Riunione di un’ora. Hai perso tempo e ordinato un altro caffè.');log(`${p.name} resta bloccato in riunione.`)},remote:()=>{p.pos=(p.pos+3)%spaces.length;status('🛋️','Smart working!',`${p.name} avanza di 3 caselle dal divano.`);log(`${p.name} avanza di 3 caselle in smart working.`);render();setTimeout(()=>resolve(spaces[p.pos]),650);return false},boss:()=>{money(current,-30,'“Hai un minuto?” diventa una revisione urgente.');log(`${p.name} spende €30 dopo il messaggio di Turi.`)},friday:()=>{money(current,80,'Hai chiuso il laptop alle 17:00 precise. Premio meritato!');log(`${p.name} scappa prima della riunione del venerdì.`)},lunch:()=>{money(current,-25,'Pranzo di team: questa volta hai offerto tu.');log(`${p.name} offre il pranzo al team.`)},bonus:()=>{money(current,150,'Obiettivo centrato. Turi ha detto “bravi tutti”.');log(`${p.name} riceve un bonus di €150.`)},coin:()=>{money(current,-2,'Moneta inghiottita. La macchinetta sa chi sei.');log(`${p.name} perde €2 alla macchinetta.`)},expenses:()=>{money(current,-40,'Il taxi della trasferta non era rimborsabile.');log(`${p.name} paga €40 di spese non rimborsate.`)},printerWin:()=>{money(current,40,'La stampante ha funzionato al primo tentativo: evento rarissimo!');log(`${p.name} riceve €40 per il miracolo della stampante.`)},turiCoffee:()=>{money(current,20,'Turi offre il caffè. Segnalo sul calendario.');log(`${p.name} riceve un caffè offerto da Turi.`)},promotion:()=>{money(current,200,'La promozione parte da lunedì. Naturalmente.');log(`${p.name} riceve €200 di aumento promesso.`)},team:()=>{money(current,-35,'Team building: il karaoke aziendale ha un costo.');log(`${p.name} paga €35 per il team building.`)},monday:()=>{money(current,60,'“Ci sentiamo lunedì” — e lunedì è andata meglio del previsto.');log(`${p.name} incassa €60 dopo il weekend.`)},budget:()=>{money(current,-75,'Revisione budget: tagli su tutto, soprattutto sul tuo bonus.');log(`${p.name} perde €75 nella revisione budget.`)},chance:()=>{const list=[['good',100,'Hai trovato una gift card dimenticata nel cassetto.'],['bad',-60,'Hai rotto le cuffie durante la call.'],['good',50,'Un collega ti deve ancora il pranzo.'],['bad',-40,'La call poteva essere un’email, ma il taxi no.']];const [kind,amount,desc]=list[Math.floor(Math.random()*list.length)];money(current,amount,desc);log(`${p.name}: imprevisto ${amount>0?'fortunato':'sfortunato'}.`)}};const result=events[id]?.();if(result===false)return;}
function nextTurn(){current=(current+1)%players.length;render();busy=false;$('center-hint').textContent=`Tocca a ${players[current].name}. Tira i dadi!`}
function buy(){if(pendingSpace===null)return;const s=spaces[pendingSpace];players[current].cash-=s.price;owners[pendingSpace]=current;log(`${players[current].name} compra “${s.name}” per €${s.price}.`);status('🔑','Postazione acquistata',`${players[current].name} ora possiede ${s.name}.`);$('choice-dialog').close();pendingSpace=null;render();setTimeout(nextTurn,700)}
function decline(){if(pendingSpace!==null)log(`${players[current].name} rinuncia a “${spaces[pendingSpace].name}”.`);pendingSpace=null;$('choice-dialog').close();setTimeout(nextTurn,400)}
$('roll-dice').addEventListener('click',roll);$('add-player').addEventListener('click',addPlayer);$('new-game').addEventListener('click',()=>{if(confirm('Iniziare una nuova partita? Tutti i progressi attuali saranno azzerati.'))init()});$('confirm-buy').addEventListener('click',buy);$('decline-buy').addEventListener('click',decline);$('choice-dialog').addEventListener('cancel',e=>{e.preventDefault();decline()});init();
