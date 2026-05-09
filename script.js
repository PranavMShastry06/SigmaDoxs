const API_URL = "http://127.0.0.1:8000";

// --- Navigation ---
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active-page'));
    document.getElementById(pageId).classList.add('active-page');
    // Force focus on input if moving to Q&A
    if(pageId === 'qaPage') setTimeout(() => document.getElementById('chatInput').focus(), 200);
}

// --- Auth Handling ---
function updateUI() {
    const user = localStorage.getItem('currentUser');
    document.getElementById('signinBtn').style.display = user ? 'none' : 'block';
    document.getElementById('logoutBtn').style.display = user ? 'block' : 'none';
    document.getElementById('tokenCount').innerText = localStorage.getItem(`tokens_${user}`) || 0;
}

document.getElementById('loginBtn').onclick = async () => {
    const user = document.getElementById('username').value.trim();
    if (!user) return;
    const fd = new FormData();
    fd.append("username", user);
    const res = await fetch(`${API_URL}/login`, { method: "POST", body: fd });
    const data = await res.json();
    localStorage.setItem('currentUser', data.username);
    localStorage.setItem(`tokens_${data.username}`, data.tokens);
    document.getElementById('loginModal').style.display = 'none';
    updateUI();
};

document.getElementById('logoutBtn').onclick = () => {
    localStorage.removeItem('currentUser');
    updateUI();
    showPage('homePage');
};

// --- PDF & Q&A ---
const pdfUpload = document.getElementById('pdfUpload');
document.getElementById('uploadBtn').onclick = () => pdfUpload.click();

pdfUpload.onchange = async (e) => {
    const file = e.target.files[0];
    const user = localStorage.getItem('currentUser');
    if(!user) return alert("Sign in first.");

    const fd = new FormData();
    fd.append("username", user);
    fd.append("file", file);

    await fetch(`${API_URL}/upload`, { method: "POST", body: fd });
    
    // Simple reader for UI
    const reader = new FileReader();
    reader.onload = async function() {
        const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(this.result) }).promise;
        let text = "";
        for (let i = 1; i <= Math.min(pdf.numPages, 3); i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            text += content.items.map(s => s.str).join(' ');
        }
        document.getElementById('summaryDocName').innerText = file.name;
        document.getElementById('summaryContent').innerText = text.slice(0, 1000) + "...";
        showPage('summaryPage');
    };
    reader.readAsArrayBuffer(file);
};

// Q&A Execution
const chatInput = document.getElementById('chatInput');
const sendBtn = document.getElementById('sendBtn');

async function handleChat() {
    const msg = chatInput.value.trim();
    const user = localStorage.getItem('currentUser');
    if(!msg || !user) return;

    const chatBox = document.getElementById('chatContainer');
    chatBox.innerHTML += `<div class="message user-message"><b>YOU:</b> ${msg}</div>`;
    chatInput.value = "";

    const fd = new FormData();
    fd.append("username", user);
    fd.append("message", msg);

    const res = await fetch(`${API_URL}/chat`, { method: "POST", body: fd });
    const data = await res.json();
    chatBox.innerHTML += `<div class="message ai-message"><b>SIGMA:</b> ${data.response}</div>`;
    chatBox.scrollTop = chatBox.scrollHeight;
}

sendBtn.onclick = handleChat;
chatInput.addEventListener('keypress', (e) => { if(e.key === 'Enter') handleChat(); });

// Cursor Logic
window.onmousemove = (e) => {
    gsap.to('.cursor', { x: e.clientX, y: e.clientY, duration: 0.1 });
    gsap.to('.cursor-blur', { x: e.clientX, y: e.clientY, duration: 0.3 });
};

updateUI();