const express = require('express');
const passport = require('passport');
const supabase = require('../config/supabase');
const jwt = require('jsonwebtoken');

const router = express.Router();

router.get('/kakao', passport.authenticate('kakao'));

router.get('/kakao/callback', passport.authenticate('kakao', { failureRedirect: '/' }), async (req, res) => {
  try {
    const { id, kakao_account } = req.user;
    const email = kakao_account?.email || null;
    const nickname = kakao_account?.profile?.nickname || 'Unknown';
    const provider = 'kakao';

    const { data, error } = await supabase.from('USER').upsert(
      [
        {
          id: Number(id),
          uId: nickname,
          email: email,
          provider: provider,
          password: null,
          created_at: new Date().toISOString(),
        },
      ],
      { onConflict: ['id'] }
    );

    if (error) {
      console.error('❌ Supabase 저장 오류:', error);
      return res.status(500).send('Supabase 저장 실패');
    }

    const { data: userData, error: selectError } = await supabase.from('USER').select('*').eq('id', Number(id)).single();

    if (selectError) {
      console.error('❌ Supabase 조회 오류:', selectError);
      return res.status(500).send('Supabase 조회 실패');
    }

    // JWT 토큰 생성
    const token = jwt.sign({ userId: userData.id, email: userData.email }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // 프론트엔드로 리다이렉트 (토큰 포함)
    res.redirect(`http://localhost:5500/map.html?token=${token}`);
  } catch (err) {
    console.error('❌ 카카오 로그인 처리 중 오류:', err);
    res.redirect('http://localhost:5500/index.html');
    return;
  }
});

module.exports = router;
