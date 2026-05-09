const pages = document.querySelectorAll('.page');

function showPage(pageId){
pages.forEach((page)=>{
page.classList.remove('active-page');
});

document.getElementById(pageId).classList.add('active-page');
window.scrollTo(0,0);
}

const loginModal = document.getElementById('loginModal');
const signinBtn = document.getElementById('signinBtn');
const signupBtn = document.getElementById('signupBtn');
const logoutBtn = document.getElementById('logoutBtn');
const loginBtn = document.getElementById('loginBtn');

signinBtn.addEventListener('click',()=>{
loginModal.style.display = 'flex';
});

signupBtn.addEventListener('click',()=>{
loginModal.style.display = 'flex';
});

loginModal.addEventListener('click',(e)=>{
if(e.target === loginModal){
loginModal.style.display = 'none';
}
});

loginBtn.addEventListener('click',()=>{
const username = document.getElementById('username').value.trim();
const password = document.getElementById('password').value.trim();

if(!username || !password) return;

localStorage.setItem('currentUser',username);
localStorage.setItem(`tokens_${username}`,8);

updateTokens();
loginModal.style.display = 'none';
});

logoutBtn.addEventListener('click',()=>{
localStorage.removeItem('currentUser');
updateTokens();
alert('Signed out successfully');
});

function updateTokens(){
const currentUser = localStorage.getItem('currentUser');
const tokenCount = document.getElementById('tokenCount');

if(currentUser){
tokenCount.innerText = localStorage.getItem(`tokens_${currentUser}`) || 8;
}else{
tokenCount.innerText = 0;
}
}

updateTokens();

const uploadBtn = document.getElementById('uploadBtn');
const pdfUpload = document.getElementById('pdfUpload');

uploadBtn.addEventListener('click',()=>{
pdfUpload.click();
});

pdfUpload.addEventListener('change',async(e)=>{
const file = e.target.files[0];
if(!file) return;

localStorage.setItem('uploadedFileName',file.name);
document.getElementById('summaryDocName').innerText = file.name;

const reader = new FileReader();

reader.onload = async function(){
const typedarray = new Uint8Array(this.result);
const pdf = await pdfjsLib.getDocument(typedarray).promise;

let fullText = '';

for(let i=1;i<=pdf.numPages;i++){
const page = await pdf.getPage(i);
const content = await page.getTextContent();
const strings = content.items.map(item=>item.str).join(' ');
fullText += strings + ' ';
}

localStorage.setItem('pdfText',fullText);

generateSummary(fullText);
showPage('summaryPage');
};

reader.readAsArrayBuffer(file);
});

function generateSummary(text){
const summaryContent = document.getElementById('summaryContent');
const keywordGrid = document.getElementById('keywordGrid');

const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
summaryContent.innerText = sentences.slice(0,8).join(' ');

const words = text.toLowerCase().replace(/[^\w\s]/g,'').split(/\s+/);
const frequency = {};

words.forEach((word)=>{
if(word.length > 5){
frequency[word] = (frequency[word] || 0) + 1;
}
});

const keywords = Object.entries(frequency)
.sort((a,b)=>b[1]-a[1])
.slice(0,10)
.map(item=>item[0]);

keywordGrid.innerHTML = '';

keywords.forEach((word)=>{
const span = document.createElement('span');
span.innerText = word;
keywordGrid.appendChild(span);
});
}

const sendBtn = document.getElementById('sendBtn');
const chatInput = document.getElementById('chatInput');
const chatContainer = document.getElementById('chatContainer');

sendBtn.addEventListener('click',sendMessage);

chatInput.addEventListener('keypress',(e)=>{
if(e.key === 'Enter'){
sendMessage();
}
});

function sendMessage(){
const text = chatInput.value.trim();
if(!text) return;

const userMessage = document.createElement('div');
userMessage.className = 'message';
userMessage.innerHTML = `<div class="message-content">${text}</div>`;
chatContainer.appendChild(userMessage);

chatInput.value = '';

const pdfText = localStorage.getItem('pdfText') || '';
let response = 'No PDF uploaded yet.';

if(pdfText){
const sentences = pdfText.match(/[^.!?]+[.!?]+/g) || [];
response = sentences.find(sentence=>
sentence.toLowerCase().includes(text.toLowerCase().split(' ')[0])
) || 'I could not find an exact answer in the document.';
}

const aiMessage = document.createElement('div');
aiMessage.className = 'message ai-message';
aiMessage.innerHTML = `<div class="message-content">${response}</div>`;
chatContainer.appendChild(aiMessage);

chatContainer.scrollTop = chatContainer.scrollHeight;
}

const cursor = document.querySelector('.cursor');
const cursorBlur = document.querySelector('.cursor-blur');

window.addEventListener('mousemove',(e)=>{
cursor.style.left = e.clientX + 'px';
cursor.style.top = e.clientY + 'px';
cursorBlur.style.left = e.clientX + 'px';
cursorBlur.style.top = e.clientY + 'px';
});

if(typeof gsap !== 'undefined'){
gsap.from('.hero-left',{
x:-80,
opacity:0,
duration:1.2,
ease:'power4.out'
});

gsap.from('.hero-right',{
x:80,
opacity:0,
duration:1.2,
delay:.2,
ease:'power4.out'
});
}