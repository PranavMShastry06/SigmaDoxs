let currentUser = null;
let currentContext = "";

async function login() {
    const user = document.getElementById('username').value;
    const pass = document.getElementById('password').value;
    
    const res = await fetch('http://127.0.0.1:8000/login', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({username: user, password: pass})
    });
    
    if (res.ok) {
        const data = await res.json();
        currentUser = data.username;
        document.getElementById('auth-section').style.display = 'none';
        document.getElementById('main-section').style.display = 'block';
        document.getElementById('user-display').innerText = currentUser;
        document.getElementById('token-count').innerText = data.tokens;
    } else {
        alert("Login failed");
    }
}

async function uploadPDF() {
    const fileInput = document.getElementById('pdfFile');
    const formData = new FormData();
    formData.append('file', fileInput.files[0]);

    const res = await fetch(`http://127.0.0.1:8000/upload?username=${currentUser}`, {
        method: 'POST',
        body: formData
    });
    const data = await res.json();
    document.getElementById('summary-text').innerText = data.summary;
    currentContext = data.full_text;
}

async function askQuestion() {
    const msg = document.getElementById('chat-input').value;
    const res = await fetch('http://127.0.0.1:8000/chat', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({username: currentUser, message: msg, context: currentContext})
    });
    const data = await res.json();
    
    const win = document.getElementById('chat-window');
    win.innerHTML += `<p><strong>You:</strong> ${msg}</p>`;
    win.innerHTML += `<p><strong>Bot:</strong> ${data.reply}</p>`;
    document.getElementById('token-count').innerText = data.remaining_tokens;
    document.getElementById('chat-input').value = "";
}