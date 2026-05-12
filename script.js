window.addEventListener('load',()=>{

setTimeout(()=>{

const loader =
document.querySelector('.loader');

if(loader){

loader.style.display = 'none';

}

},2500);

});

let currentUser = null;
let currentContext = "";
let documentsUploaded = 0;
let questionsAsked = 0;

/* BACKEND URL */

const API_BASE =
"https://sigmadoxs-1.onrender.com";

/* CURSOR */

const cursor = document.querySelector('.cursor');
const cursorBlur = document.querySelector('.cursor-blur');

if(cursor && cursorBlur){

window.addEventListener('mousemove',(e)=>{

cursor.style.left = e.clientX + 'px';
cursor.style.top = e.clientY + 'px';

cursorBlur.style.left = e.clientX + 'px';
cursorBlur.style.top = e.clientY + 'px';

});

}

/* GSAP */

window.addEventListener('load',()=>{

setTimeout(()=>{

if(typeof gsap !== 'undefined'){

gsap.from('.sidebar',{
x:-80,
opacity:0,
duration:1.2,
ease:'power4.out'
});

gsap.from('.main-area',{
y:40,
opacity:0,
duration:1.2,
ease:'power4.out'
});

}

},2200);

});

/* PARTICLES */

tsParticles.load('particles',{

particles:{

number:{
value:50
},

size:{
value:2
},

move:{
speed:1
},

links:{
enable:true,
color:'#00bfff'
},

color:{
value:'#00bfff'
}

}

});

/* LOGIN */

async function login(){

const user =
document.getElementById('username').value.trim();

const pass =
document.getElementById('password').value.trim();

if(!user || !pass){

alert('Enter username and password');

return;

}

try{

const res = await fetch(
`${API_BASE}/login`,
{
method:'POST',

headers:{
'Content-Type':'application/json'
},

body:JSON.stringify({
username:user,
password:pass
})

}
);

if(res.ok){

const data = await res.json();

currentUser = data.username;

localStorage.setItem(
'currentUser',
currentUser
);

document.getElementById(
'auth-section'
).style.display = 'none';

document.getElementById(
'main-section'
).style.display = 'block';

document.getElementById(
'user-display'
).innerText = currentUser;

document.getElementById(
'token-count'
).innerText = data.tokens;

}else{

alert('Invalid credentials');

}

}catch(err){

console.error(err);

alert('Backend server not running');

}

}

/* LOGOUT */

function logout(){

localStorage.clear();

location.reload();

}

/* UPLOAD */

const uploadBtn =
document.getElementById('uploadBtn');

const pdfFile =
document.getElementById('pdfFile');

const uploadZone =
document.getElementById('uploadZone');

if(uploadBtn){

uploadBtn.addEventListener('click',()=>{

pdfFile.click();

});

}

if(uploadZone){

uploadZone.addEventListener('click',()=>{

pdfFile.click();

});

uploadZone.addEventListener('dragover',(e)=>{

e.preventDefault();

uploadZone.style.border =
'2px solid #00bfff';

});

uploadZone.addEventListener('dragleave',()=>{

uploadZone.style.border = 'none';

});

uploadZone.addEventListener('drop',(e)=>{

e.preventDefault();

const file =
e.dataTransfer.files[0];

if(file){

pdfFile.files =
e.dataTransfer.files;

uploadPDF();

}

});

}

if(pdfFile){

pdfFile.addEventListener(
'change',
uploadPDF
);

}

/* PDF UPLOAD */

async function uploadPDF(){

const file = pdfFile.files[0];

if(!file) return;

const formData = new FormData();

formData.append('file',file);

try{

uploadZone.innerHTML = `

<div class="typing-indicator">
<span></span>
<span></span>
<span></span>
</div>

<h3>
Analyzing PDF...
</h3>

`;

const res = await fetch(

`${API_BASE}/upload?username=${currentUser}`,

{
method:'POST',
body:formData
}

);

const data = await res.json();

currentContext = data.full_text;

document.getElementById(
'summary-text'
).innerText = data.summary;

document.getElementById(
'file-name-display'
).innerText = file.name;

documentsUploaded++;

document.getElementById(
'documents-count'
).innerText = documentsUploaded;

uploadZone.innerHTML = `

<div class="success-upload">
✅ PDF Uploaded Successfully
</div>

`;

addAIMessage(
'PDF analyzed successfully. You can now ask questions about the document.'
);

}catch(err){

console.error(err);

alert('PDF upload failed');

}

}

/* CHAT */

async function askQuestion(){

const input =
document.getElementById('chat-input');

const msg =
input.value.trim();

if(!msg) return;

addUserMessage(msg);

input.value = '';

showTypingIndicator();

try{

const res = await fetch(

`${API_BASE}/chat`,

{
method:'POST',

headers:{
'Content-Type':'application/json'
},

body:JSON.stringify({

username:currentUser,
message:msg,
context:currentContext

})

}

);

const data = await res.json();

questionsAsked++;

document.getElementById(
'questions-count'
).innerText = questionsAsked;

document.getElementById(
'token-count'
).innerText = data.remaining_tokens;

removeTypingIndicator();

addAIMessage(data.reply);

}catch(err){

console.error(err);

removeTypingIndicator();

addAIMessage(
'AI response failed.'
);

}

}

/* USER MESSAGE */

function addUserMessage(text){

const chatWindow =
document.getElementById('chat-window');

const div =
document.createElement('div');

div.className =
'message user-message';

div.innerText = text;

chatWindow.appendChild(div);

chatWindow.scrollTop =
chatWindow.scrollHeight;

}

/* AI MESSAGE */

function addAIMessage(text){

const chatWindow =
document.getElementById('chat-window');

const div =
document.createElement('div');

div.className =
'message ai-message';

chatWindow.appendChild(div);

let index = 0;

const interval =
setInterval(()=>{

if(index < text.length){

div.innerHTML +=
text.charAt(index);

index++;

chatWindow.scrollTop =
chatWindow.scrollHeight;

}else{

clearInterval(interval);

}

},12);

}

/* TYPING */

function showTypingIndicator(){

const chatWindow =
document.getElementById('chat-window');

const typing =
document.createElement('div');

typing.className =
'typing-indicator';

typing.id =
'aiTyping';

typing.innerHTML = `

<span></span>
<span></span>
<span></span>

`;

chatWindow.appendChild(typing);

chatWindow.scrollTop =
chatWindow.scrollHeight;

}

function removeTypingIndicator(){

const typing =
document.getElementById('aiTyping');

if(typing){

typing.remove();

}

}

/* ENTER KEY */

const input =
document.getElementById('chat-input');

if(input){

input.addEventListener('keypress',(e)=>{

if(e.key === 'Enter'){

askQuestion();

}

});

}

/* SIDEBAR */

const menuItems =
document.querySelectorAll('.menu-item');

const dashboardSection =
document.getElementById('dashboard-section');

const chatSection =
document.getElementById('chat-section');

const documentsSection =
document.getElementById('documents-section');

const analyticsSection =
document.getElementById('analytics-section');

const settingsSection =
document.getElementById('settings-section');

menuItems.forEach((item,index)=>{

item.addEventListener('click',()=>{

menuItems.forEach(i=>
i.classList.remove('active-menu')
);

item.classList.add('active-menu');

dashboardSection.style.display = 'none';
chatSection.style.display = 'none';
documentsSection.style.display = 'none';
analyticsSection.style.display = 'none';
settingsSection.style.display = 'none';

if(index === 0){

dashboardSection.style.display = 'grid';
chatSection.style.display = 'grid';

}

if(index === 1){

documentsSection.style.display = 'block';

}

if(index === 2){

chatSection.style.display = 'grid';

}

if(index === 3){

analyticsSection.style.display = 'block';

}

if(index === 4){

settingsSection.style.display = 'block';

}

});

});
