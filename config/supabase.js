require('dotenv').config();  // .env 파일 로드

const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;

console.log("Supabase URL:", supabaseUrl);
console.log("Supabase Key:", supabaseKey ? "✅ 키 로드 성공" : "❌ 키 로드 실패");
