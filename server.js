const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'database.json');

app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// Helper to read DB
function getDB() {
    if (!fs.existsSync(DB_FILE)) {
        const initial = { submissions: [] };
        fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2));
        return initial;
    }
    try {
        const data = fs.readFileSync(DB_FILE, 'utf8');
        return JSON.parse(data);
    } catch (e) {
        return { submissions: [] };
    }
}

// Helper to write DB
function saveDB(data) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// API: Submit Project Request
app.post('/api/submit', (req, res) => {
    const { name, projectType, message } = req.body;
    if (!name || !projectType || !message) {
        return res.status(400).json({ error: 'Tüm alanlar zorunludur.' });
    }

    const db = getDB();
    const newSub = {
        id: 'sub_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        name,
        projectType,
        message,
        date: new Date().toLocaleString('tr-TR'),
        status: 'Beklemede'
    };

    db.submissions.push(newSub);
    saveDB(db);

    res.json({ success: true, submission: newSub });
});

// API: Get All Submissions (Admin)
app.get('/api/submissions', (req, res) => {
    const db = getDB();
    res.json(db.submissions);
});

// API: Update Status (Admin Approve / Reject)
app.post('/api/update-status', (req, res) => {
    const { id, status } = req.body;
    if (!id || !status) {
        return res.status(400).json({ error: 'Geçersiz parametreler.' });
    }

    const db = getDB();
    let found = false;
    db.submissions = db.submissions.map(sub => {
        if (sub.id === id) {
            sub.status = status;
            found = true;
        }
        return sub;
    });

    if (!found) {
        return res.status(404).json({ error: 'Talep bulunamadı.' });
    }

    saveDB(db);
    res.json({ success: true });
});

// API: Admin Login
app.post('/api/login', (req, res) => {
    const { password } = req.body;
    if (password === '5461') {
        return res.json({ success: true, token: 'admin_auth_token_secret' });
    }
    res.status(401).json({ success: false, error: 'Hatalı şifre!' });
});

app.listen(PORT, () => {
    console.log(`Kodanes server running at http://localhost:${PORT}`);
});
