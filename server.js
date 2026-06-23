const express = require('express');
const path = require('path');
const fs = require('fs');
const webpush = require('web-push');

const VAPID_PUBLIC_KEY = 'BJQyMAGyXa5i5AesbIpiboNpe_D-lQRM5QIrpvLhcxg6yTEB3W30JtpAZi6mb0cAE8vGzcDX0_4rTu_YgmHi_uk';
const VAPID_PRIVATE_KEY = 'ZmzvBUckuvrNeIJHiLublwwnkMUxgp0PHN_P42D89tY';
webpush.setVapidDetails('mailto:cheryl@kpmg.com', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

const app = express();
const PORT = process.env.PORT || 3456;
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'tasks.json');
const SUBS_FILE = path.join(DATA_DIR, 'subscriptions.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

function loadDB() {
  if (!fs.existsSync(DB_FILE)) return { lists: [] };
  try { return JSON.parse(fs.readFileSync(DB_FILE, 'utf8')); }
  catch(e) { return { lists: [] }; }
}
function saveDB(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
}

function loadSubs() {
  if (!fs.existsSync(SUBS_FILE)) return [];
  try { const d = JSON.parse(fs.readFileSync(SUBS_FILE, 'utf8')); return Array.isArray(d) ? d : []; }
  catch(e) { return []; }
}
function saveSubs(subs) {
  fs.writeFileSync(SUBS_FILE, JSON.stringify(subs), 'utf8');
}

let db = loadDB();
let nextTaskId = 19;
let nextListId = 4;

// 首次初始化
if (db.lists.length === 0) {
  db.lists = [
    { id: 1, name: '日常作息', color: '#FF9500', sort_order: 0, tasks: [
      { id: 1, title: '☀️ 起床喝水', content: '先喝一杯温水', priority: 1, due_time: '07:30', repeat_rule: 'Every Day', reminder_time: '07:30', completed: 0, sort_order: 0 },
      { id: 2, title: '🪥 洗漱+踮脚尖30次', content: '刷牙时顺便踮脚尖30次', priority: 1, due_time: '07:35', repeat_rule: 'Every Day', reminder_time: '07:35', completed: 0, sort_order: 1 },
      { id: 3, title: '🥚 吃早餐', content: '蛋+豆浆/牛奶+主食选一样', priority: 1, due_time: '07:45', repeat_rule: 'Every Day', reminder_time: '07:45', completed: 0, sort_order: 2 },
      { id: 4, title: '🍱 午餐（主食减半）', content: '先吃菜和肉→主食只吃一半。饭后散步10分钟', priority: 2, due_time: '12:00', repeat_rule: 'Every Day', reminder_time: '12:00', completed: 0, sort_order: 3 },
      { id: 5, title: '😴 午休闭眼10分钟', content: '手机扣桌上闭眼休息', priority: 1, due_time: '13:00', repeat_rule: 'Every Day', reminder_time: '13:00', completed: 0, sort_order: 4 },
      { id: 6, title: '💧 换无糖茶/美式', content: '下午容易困，少喝含糖饮料', priority: 1, due_time: '16:00', repeat_rule: 'Every Day', reminder_time: '16:00', completed: 0, sort_order: 5 },
      { id: 7, title: '🥜 加餐时间', content: '苹果/一把坚果/一杯酸奶', priority: 1, due_time: '15:00', repeat_rule: 'Every Day', reminder_time: '15:00', completed: 0, sort_order: 6 },
      { id: 8, title: '🥗 晚餐（七八分饱）', content: '先吃菜和肉，主食只吃一半', priority: 2, due_time: '18:30', repeat_rule: 'Every Day', reminder_time: '18:30', completed: 0, sort_order: 7 },
      { id: 9, title: '🧶 钩织时间', content: '钩几针，听播客放松心情', priority: 1, due_time: '00:00', repeat_rule: 'Every Day', reminder_time: '00:00', completed: 0, sort_order: 8 },
      { id: 10, title: '🧘 睡前拉伸3分钟', content: '靠墙站立1分钟+猫式5次+转头各3次', priority: 2, due_time: '00:30', repeat_rule: 'Every Day', reminder_time: '00:30', completed: 0, sort_order: 9 },
      { id: 11, title: '💤 睡觉', content: '晚安😴', priority: 2, due_time: '01:00', repeat_rule: 'Every Day', reminder_time: '01:00', completed: 0, sort_order: 10 },
    ]},
    { id: 2, name: '工作To Do', color: '#4A90D9', sort_order: 1, tasks: [
      { id: 12, title: '📋 整理本周重点工作', content: '本周关键事项推进', priority: 2, due_time: '周一09:00', repeat_rule: 'Every Week on Monday', reminder_time: '周一09:00', completed: 0, sort_order: 0 },
      { id: 13, title: '📋 检查各项目进展', content: '团队安排与进展检查', priority: 2, due_time: '周五17:00', repeat_rule: 'Every Week on Friday', reminder_time: '周五17:00', completed: 0, sort_order: 1 },
    ]},
    { id: 3, name: '个人提升', color: '#34C759', sort_order: 2, tasks: [
      { id: 14, title: '📖 英语阅读', content: '看一段IFRS英文原文，10分钟', priority: 2, due_time: '10:00', repeat_rule: 'Every Weekday', reminder_time: '10:00', completed: 0, sort_order: 0 },
      { id: 15, title: '🎧 英语听力', content: '通勤/钩织时听英文播客', priority: 1, due_time: '08:30', repeat_rule: 'Every Weekday', reminder_time: '08:30', completed: 0, sort_order: 1 },
      { id: 16, title: '🎙️ 英语口语练习', content: '用英文说一句工作思考，录音1分钟', priority: 1, due_time: '周五21:00', repeat_rule: 'Every Week on Friday', reminder_time: '周五21:00', completed: 0, sort_order: 2 },
      { id: 17, title: '📝 专业输出', content: '写一篇文章/研究报告片段', priority: 2, due_time: '周日15:00', repeat_rule: 'Every Week on Sunday', reminder_time: '周日15:00', completed: 0, sort_order: 3 },
      { id: 18, title: '📚 专业阅读', content: '看一篇行业研究报告或准则更新', priority: 1, due_time: '', repeat_rule: '', reminder_time: '', completed: 0, sort_order: 4 },
    ]},
  ];
  saveDB(db);
}

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/vapid-public-key', (req, res) => res.json({ publicKey: VAPID_PUBLIC_KEY }));

app.post('/api/subscribe', (req, res) => {
  const sub = req.body;
  if (!sub || !sub.endpoint) return res.status(400).json({ error: 'invalid' });
  let subs = loadSubs();
  subs = subs.filter(s => s.endpoint !== sub.endpoint);
  subs.push(sub);
  saveSubs(subs);
  res.json({ success: true });
});

app.get('/api/lists', (req, res) => {
  db = loadDB();
  res.json(db.lists);
});

app.post('/api/tasks', (req, res) => {
  db = loadDB();
  const { list_id, title, content, priority, due_time, repeat_rule, reminder_time } = req.body;
  const list = db.lists.find(l => l.id === list_id);
  if (!list) return res.status(404).json({ error: 'list not found' });
  const task = {
    id: nextTaskId++, title, content: content || '', priority: priority || 1,
    due_time: due_time || '', repeat_rule: repeat_rule || '', reminder_time: reminder_time || '',
    completed: 0, sort_order: list.tasks.length
  };
  list.tasks.push(task); saveDB(db);
  res.json(task);
});

app.patch('/api/tasks/:id/toggle', (req, res) => {
  db = loadDB();
  for (const list of db.lists) {
    const task = list.tasks.find(t => t.id === parseInt(req.params.id));
    if (task) { task.completed = task.completed ? 0 : 1; saveDB(db); return res.json(task); }
  }
  res.status(404).json({ error: 'not found' });
});

app.put('/api/tasks/:id', (req, res) => {
  db = loadDB();
  const { title, content, priority, due_time, repeat_rule, reminder_time, completed } = req.body;
  for (const list of db.lists) {
    const task = list.tasks.find(t => t.id === parseInt(req.params.id));
    if (task) {
      if (title !== undefined) task.title = title;
      if (content !== undefined) task.content = content;
      if (priority !== undefined) task.priority = priority;
      if (due_time !== undefined) task.due_time = due_time;
      if (repeat_rule !== undefined) task.repeat_rule = repeat_rule;
      if (reminder_time !== undefined) task.reminder_time = reminder_time;
      if (completed !== undefined) task.completed = completed;
      saveDB(db); return res.json(task);
    }
  }
  res.status(404).json({ error: 'not found' });
});

app.delete('/api/tasks/:id', (req, res) => {
  db = loadDB();
  for (const list of db.lists) {
    const idx = list.tasks.findIndex(t => t.id === parseInt(req.params.id));
    if (idx !== -1) { list.tasks.splice(idx, 1); saveDB(db); return res.json({ success: true }); }
  }
  res.status(404).json({ error: 'not found' });
});

app.post('/api/lists', (req, res) => {
  db = loadDB();
  const list = { id: nextListId++, name: req.body.name, color: req.body.color || '#4A90D9', sort_order: db.lists.length, tasks: [] };
  db.lists.push(list); saveDB(db);
  res.json(list);
});

app.delete('/api/lists/:id', (req, res) => {
  db = loadDB();
  db.lists = db.lists.filter(l => l.id !== parseInt(req.params.id));
  saveDB(db);
  res.json({ success: true });
});

// 后台推送调度器
function checkAndSend() {
  db = loadDB();
  const now = new Date();
  const t = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
  const day = now.getDay();
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const subs = loadSubs();
  if (subs.length === 0) return;
  for (const list of db.lists) {
    for (const task of list.tasks) {
      if (task.completed || !task.reminder_time) continue;
      let ok = false;
      if (task.repeat_rule === 'Every Day') ok = t === task.reminder_time;
      else if (task.repeat_rule === 'Every Weekday' && day >= 1 && day <= 5) ok = t === task.reminder_time;
      else if (task.repeat_rule === `Every Week on ${days[day]}`) ok = t === task.reminder_time;
      else if (!task.repeat_rule) ok = t === task.reminder_time;
      if (ok) {
        const payload = JSON.stringify({ title: task.title, body: task.content || list.name, icon: '/icon-192.svg' });
        subs.forEach(sub => { webpush.sendNotification(sub, payload).catch(() => {}); });
      }
    }
  }
}
setInterval(checkAndSend, 30000);

setInterval(() => {
  const now = new Date();
  if (now.getHours() === 0 && now.getMinutes() === 0) {
    db = loadDB();
    for (const list of db.lists) {
      for (const task of list.tasks) {
        if (task.repeat_rule === 'Every Day' && task.completed) task.completed = 0;
      }
    }
    saveDB(db);
  }
}, 60000);

console.log('⏰ 推送调度器已启动');
app.listen(PORT, '0.0.0.0', () => console.log(`✅ Cheryl App running at http://0.0.0.0:${PORT}`));
