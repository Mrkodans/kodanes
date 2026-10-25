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

// API: Submit Request
app.post('/api/submit', (req, res) => {
    const { name, category, urgency, message } = req.body;
    if (!name || !category || !urgency || !message) {
        return res.status(400).json({ error: 'Tüm alanlar zorunludur.' });
    }

    const db = getDB();
    const newSub = {
        id: 'sub_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        name,
        category,
        urgency,
        message,
        date: new Date().toLocaleString('tr-TR'),
        status: 'Beklemede',
        adminNote: ''
    };

    db.submissions.push(newSub);
    saveDB(db);

    res.json({ success: true, submission: newSub });
});

// API: Get All Submissions (Admin & Client)
app.get('/api/submissions', (req, res) => {
    const db = getDB();
    res.json(db.submissions);
});

// API: Update Status & Admin Note (Admin)
app.post('/api/update-status', (req, res) => {
    const { id, status, adminNote } = req.body;
    if (!id || !status) {
        return res.status(400).json({ error: 'Geçersiz parametreler.' });
    }

    const db = getDB();
    let found = false;
    db.submissions = db.submissions.map(sub => {
        if (sub.id === id) {
            sub.status = status;
            if (adminNote !== undefined) {
                sub.adminNote = adminNote;
            }
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


// API: Delete Submission
app.post('/api/delete-submission', (req, res) => {
    const { id } = req.body;
    if (!id) {
        return res.status(400).json({ error: 'Geçersiz ID.' });
    }

    const db = getDB();
    const initialLen = db.submissions.length;
    db.submissions = db.submissions.filter(sub => sub.id !== id);

    if (db.submissions.length === initialLen) {
        return res.status(404).json({ error: 'Talep bulunamadı.' });
    }

    saveDB(db);
    res.json({ success: true });
});

app.listen(PORT, () => {
    console.log(`Kodanes Aile Meclisi server running at http://localhost:${PORT}`);
});
