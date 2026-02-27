const express = require("express");
const mysql = require("mysql2/promise");
const crypto = require("crypto");
const bcrypt = require("bcrypt");

const app = express();
app.use(express.json());
// simple CORS support without external dependency
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS,PATCH,DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.use(express.static("."));  // serve all files from root directory
app.use('/operator', express.static('operator'));
app.use('/admin', express.static('admin'));

// DB connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASS || "",
  database: process.env.DB_NAME || "suvidha",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

function maskMobile(m){
  if(!m) return "";
  const s = m.replace(/[^0-9]/g,"");
  return s.length>4 ? "XXXXX" + s.slice(-4) : s;
}

function randomCode(){
  return "CODE-" + crypto.randomBytes(3).toString("hex").toUpperCase();
}

function randomId(prefix){
  return prefix + Math.floor(100000 + Math.random()*900000);
}

// simple in‑memory rate limiter
const rateMap = {};
function rateLimit(ip){
  const now=Date.now();
  let entry = rateMap[ip] || {count:0,ts:now};
  if(now-entry.ts>60000){ entry.count=0; entry.ts=now; }
  entry.count++;
  rateMap[ip]=entry;
  return entry.count>10;
}

// token verification middleware (Bearer token equals username)
async function verifyToken(req,res,next){
  const h = req.headers['authorization'];
  if(!h||!h.startsWith('Bearer ')) return res.status(401).json({error:'unauth'});
  const token = h.slice(7);
  try{
    const conn = await pool.getConnection();
    const [rows] = await conn.query('SELECT * FROM admins WHERE username=?',[token]);
    conn.release();
    if(rows.length===0) return res.status(401).json({error:'unauth'});
    req.user = rows[0];
    next();
  }catch(e){console.error(e);res.status(500).json({error:'server'});}  
}

app.post("/api/certificates/check", async (req,res)=>{
  if(rateLimit(req.ip)) return res.status(429).json({error:'rate limit'});
  const { application_id, name, father_name, dob } = req.body;
  try{
    let q, vals;
    if(application_id){
      q = "SELECT id, status, registered_mobile FROM certificates WHERE application_id=? LIMIT 1";
      vals = [application_id];
    } else {
      q = "SELECT id, status, registered_mobile FROM certificates WHERE person_name=? AND father_name=? AND dob=? LIMIT 1";
      vals = [name, father_name, dob];
    }
    const conn = await pool.getConnection();
    const [rows] = await conn.query(q, vals);
    conn.release();
    if(rows.length===0) return res.json({ found:false });
    const row = rows[0];
    return res.json({ found:true, status:row.status, certificate_id:row.id, mobile_mask: maskMobile(row.registered_mobile) });
  }catch(e){ console.error(e); res.status(500).json({error:"server"}); }
});

app.post("/api/certificates/request-otp", async (req,res)=>{
  const { certificate_id, mobile } = req.body;
  if(!certificate_id || !mobile) return res.status(400).json({error:"missing"});
  try{
    const conn = await pool.getConnection();
    const [cert] = await conn.query("SELECT registered_mobile FROM certificates WHERE id=?",[certificate_id]);
    if(cert.length===0) { conn.release(); return res.status(404).json({error:"not found"}); }
    const reg = cert[0].registered_mobile || mobile;
    const otp = (""+Math.floor(100000 + Math.random()*900000));
    const expires_at = new Date(Date.now()+10*60*1000);
    const id = crypto.randomUUID();
    const [result] = await conn.query("INSERT INTO otps(id, certificate_id, otp, expires_at) VALUES(?,?,?,?)",[id, certificate_id, otp, expires_at]);
    conn.release();
    console.log(`[SMS SIM] Sending OTP ${otp} to ${reg}`);
    // Return OTP for demo/testing purposes (since SMS is simulated)
    return res.json({ request_id: id, otp: otp, expires_in_minutes: 10 });
  }catch(e){console.error(e);res.status(500).json({error:"server"});}
});

app.post("/api/certificates/verify-otp", async (req,res)=>{
  const { request_id, otp } = req.body;
  if(!request_id || !otp) return res.status(400).json({error:"missing"});
  try{
    const conn = await pool.getConnection();
    const [rows] = await conn.query("SELECT * FROM otps WHERE id=?",[request_id]);
    if(rows.length===0) { conn.release(); return res.status(404).json({error:"not found"}); }
    const row = rows[0];
    if(row.used) { conn.release(); return res.status(400).json({error:"used"}); }
    if(new Date(row.expires_at) < new Date()) { conn.release(); return res.status(400).json({error:"expired"}); }
    if(row.otp !== otp) { conn.release(); return res.status(400).json({error:"invalid otp"}); }
    await conn.query("UPDATE otps SET used=true WHERE id=?",[request_id]);
    const code = randomCode();
    const expires_at = new Date(Date.now() + 48*60*60*1000);
    await conn.query("INSERT INTO retrieval_codes(certificate_id, code, mobile, expires_at) VALUES(?,?,?,?)",[row.certificate_id, code, row.mobile || null, expires_at]);
    conn.release();
    console.log(`[SMS SIM] Sending retrieval code ${code} for certificate ${row.certificate_id}`);
    return res.json({ success:true, code, expires_at });
  }catch(e){console.error(e);res.status(500).json({error:"server"});}
});

app.post("/api/complaints", async (req,res)=>{
  if(rateLimit(req.ip)) return res.status(429).json({error:'rate limit'});
  const { name, mobile, ward, area, landmark, category, description } = req.body;
  if(!name || !mobile || !ward || !category) return res.status(400).json({error:"missing"});
  try{
    const complaint_id = randomId("MC-");
    const conn = await pool.getConnection();
    await conn.query("INSERT INTO complaints(complaint_id,name,mobile,ward,area,landmark,category,description) VALUES(?,?,?,?,?,?,?,?)",[complaint_id,name,mobile,ward,area,landmark,category,description]);
    conn.release();
    console.log(`[SMS SIM] Complaint ${complaint_id} created for ${mobile}`);
    return res.json({ complaint_id });
  }catch(e){console.error(e);res.status(500).json({error:"server"});}
});

// fetch complaints (admin) with optional filters
app.get("/api/complaints", verifyToken, async (req,res)=>{
  const { ward, category, status } = req.query;
  try{
    let q = "SELECT * FROM complaints WHERE 1=1";
    const vals = [];
    if(ward){ q += " AND ward=?"; vals.push(ward); }
    if(category){ q += " AND category=?"; vals.push(category); }
    if(status){ q += " AND status=?"; vals.push(status); }
    const conn = await pool.getConnection();
    const [rows] = await conn.query(q, vals);
    conn.release();
    res.json(rows);
  }catch(e){console.error(e);res.status(500).json({error:"server"});}
});

// update complaint status
app.patch("/api/complaints/:id/status", verifyToken, async (req,res)=>{
  const { id } = req.params;
  const { status } = req.body;
  if(!['pending','in_progress','resolved'].includes(status)) return res.status(400).json({error:'bad status'});
  try{
    const conn = await pool.getConnection();
    const [result] = await conn.query("UPDATE complaints SET status=?,updated_at=NOW() WHERE id=?",[status,id]);
    conn.release();
    if(result.affectedRows===0) return res.status(404).json({error:'not found'});
    res.json({success:true});
  }catch(e){console.error(e);res.status(500).json({error:'server'});}  
});

// authentication
app.post('/auth/login', async (req,res)=>{
  const { username, password } = req.body;
  if(!username || !password) return res.status(400).json({error:'missing'});
  try{
    const conn = await pool.getConnection();
    const [rows] = await conn.query('SELECT * FROM admins WHERE username=?',[username]);
    conn.release();
    if(rows.length===0) return res.status(401).json({error:'invalid'});
    const admin = rows[0];
    // assume password_hash stored by bcrypt
    const ok = await bcrypt.compare(password, admin.password_hash);
    if(!ok) return res.status(401).json({error:'invalid'});
    // return token equal to username
    res.json({token: username});
  }catch(e){console.error(e);res.status(500).json({error:'server'});}  
});

app.post("/op/verify-code", async (req,res)=>{
  const { code } = req.body;
  if(!code) return res.status(400).json({error:"missing"});
  try{
    const conn = await pool.getConnection();
    const [rows] = await conn.query("SELECT rc.*, c.person_name, c.type FROM retrieval_codes rc JOIN certificates c ON rc.certificate_id=c.id WHERE rc.code=? LIMIT 1",[code]);
    conn.release();
    if(rows.length===0) return res.status(404).json({error:"not found"});
    const row = rows[0];
    if(row.used) return res.status(400).json({error:"already used"});
    if(new Date(row.expires_at) < new Date()) return res.status(400).json({error:"expired"});
    return res.json({ certificate_id: row.certificate_id, person_name: row.person_name, type: row.type, issued_at: row.issued_at });
  }catch(e){console.error(e);res.status(500).json({error:"server"});}
});

app.post("/op/use-code", async (req,res)=>{
  const { code, operator } = req.body;
  if(!code || !operator) return res.status(400).json({error:"missing"});
  try{
    const conn = await pool.getConnection();
    const [result] = await conn.query("UPDATE retrieval_codes SET used=true, used_at=NOW(), used_by=? WHERE code=? AND used=false",[operator, code]);
    conn.release();
    if(result.affectedRows===0) return res.status(400).json({error:"invalid or already used"});
    return res.json({ success:true });
  }catch(e){console.error(e);res.status(500).json({error:"server"});}
});

app.get("/health", (req,res)=>res.send("ok"));

// ensure there is at least one admin user (username: admin / password: admin123)
async function ensureDefaultAdmin(){
  try{
    const conn = await pool.getConnection();
    const [rows] = await conn.query('SELECT COUNT(*) as c FROM admins');
    if(rows[0].c===0){
      const hash = await bcrypt.hash('admin123',10);
      await conn.query('INSERT INTO admins(id,username,password_hash) VALUES(?,?,?)',[
        require('crypto').randomUUID(),'admin',hash
      ]);
      console.log('created default admin / password admin123');
    }
    conn.release();
  }catch(e){console.error('error ensuring admin',e);}  
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, async ()=>{
  console.log("Server running on",PORT);
  await ensureDefaultAdmin();
});
