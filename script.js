const API_URL = "http://127.0.0.1:8000";

// Page Navigation
function showPage(pageId, element) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active-page'));
    document.querySelectorAll('.nav-item').forEach(l => l.classList.remove('active'));
    
    if(element) element.classList.add('active');
    
    const targetPage = document.getElementById(pageId);
    targetPage.classList.add('active-page');
    
    // Entrance Animation
    gsap.fromTo(targetPage, {opacity: 0, y: 15}, {opacity: 1, y: 0, duration: 0.6});
}

// Authentication Toggle
function updateUI() {
    const user = localStorage.getItem('currentUser');
    const signinBtn = document.getElementById('signinBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    
    if(user) {
        signinBtn.style.display = 'none';
        logoutBtn.style.display = 'block';
        document.getElementById('tokenCount').innerText = "500";
    } else {
        signinBtn.style.display = 'block';
        logoutBtn.style.display = 'none';
    }
}

document.getElementById('signinBtn').onclick = () => document.getElementById('loginModal').style.display = 'flex';

document.getElementById('loginBtn').onclick = () => {
    const user = document.getElementById('username').value;
    if(!user) return;
    localStorage.setItem('currentUser', user);
    document.getElementById('loginModal').style.display = 'none';
    updateUI();
};

document.getElementById('logoutBtn').onclick = () => {
    localStorage.removeItem('currentUser');
    updateUI();
};

// Chat Interaction
async function handleChat() {
    const input = document.getElementById('chatInput');
    const msg = input.value.trim();
    if(!msg) return;

    const chatBox = document.getElementById('chatContainer');
    chatBox.innerHTML += `
        <div class="message user-message">
            <span>${msg}</span>
        </div>
    `;
    
    input.value = "";
    chatBox.scrollTop = chatBox.scrollHeight;

    // Simulated Response
    setTimeout(() => {
        chatBox.innerHTML += `
            <div class="message ai-message">
                <ion-icon name="hardware-chip-outline"></ion-icon>
                <span>Query processed. Ready for next data packet.</span>
            </div>
        `;
        chatBox.scrollTop = chatBox.scrollHeight;
    }, 800);
}

document.getElementById('sendBtn').onclick = handleChat;
document.getElementById('chatInput').onkeypress = (e) => e.key === 'Enter' && handleChat();

// Smooth Cursor Movement
window.onmousemove = (e) => {
    gsap.to('.cursor', { x: e.clientX, y: e.clientY, duration: 0.1 });
    gsap.to('.cursor-blur', { x: e.clientX, y: e.clientY, duration: 0.4 });
};

// Auto-upload simulation
document.getElementById('uploadBtn').onclick = () => document.getElementById('pdfUpload').click();
document.getElementById('pdfUpload').onchange = (e) => {
    if(e.target.files[0]) {
        gsap.to('body', {opacity: 0.5, duration: 0.2, repeat: 3, yoyo: true});
        setTimeout(() => showPage('summaryPage'), 1000);
    }
};

updateUI();