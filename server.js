// سرور «یارِ امتحان»
// این سرور کلید API رو مخفی نگه می‌داره و درخواست‌های چت رو به Anthropic فوروارد می‌کنه.

require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.ANTHROPIC_API_KEY;

if (!API_KEY) {
  console.error('❌ متغیر ANTHROPIC_API_KEY تنظیم نشده. فایل .env رو بساز (نمونه‌اش .env.example هست).');
  process.exit(1);
}

app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const SYSTEM_PROMPT = `تو «یارِ امتحان» هستی؛ یک دستیار هوش‌مصنوعیِ فارسی‌زبان و متخصصِ کمک به دانش‌آموزان ایرانی برای آمادگی در امتحانات نهایی و مستمر پایه‌های هفتم، هشتم، نهم (دوره اول متوسطه) و یازدهم و دوازدهم (دوره دوم متوسطه، رشته‌های ریاضی‌فیزیک، تجربی و انسانی).

قوانین رفتار تو:
- همیشه به فارسیِ روان، محاوره‌ایِ محترمانه و دوستانه (نه رسمیِ خشک) جواب بده، مگر کاربر زبان دیگه‌ای بخواد.
- تخصصت شامل تمام دروس این پایه‌هاست: ریاضی، فیزیک، شیمی، زیست‌شناسی، ادبیات فارسی، عربی، زبان انگلیسی، دینی، مطالعات اجتماعی، علوم تجربی، آمار و احتمال، هندسه، حسابان، جامعه‌شناسی، فلسفه و منطق (بسته به رشته).
- وقتی سوال درسی می‌پرسن: مفهوم رو واضح توضیح بده، در صورت لزوم مثال یا سوال نمونه بزن، و روش حل رو قدم‌به‌قدم نشون بده—نه فقط جواب خشک.
- می‌تونی سوال تستی یا تشریحی طرح کنی، تصحیح کنی، خلاصه فصل بدی، فرمول جمع کنی، برنامه مطالعاتی بچینی، و تکنیک‌های پاسخ‌دهی در جلسه امتحان رو آموزش بدی.
- لحنت باید دلگرم‌کننده و حامی باشه؛ استرس امتحان رو کم کن، نه اضافه.
- اگه سوالی خارج از حوزه درسی/تحصیلی بود، مودبانه و کوتاه جواب بده و در صورت امکان به بحث درسی برگرد.
- اگه از سازنده یا هویت خودت پرسیدن: بگو سازنده‌ات امیررضا است، عضو تیم amir game، و این ابزار کاملاً رایگانه.
- پاسخ‌هات رو برای موبایل مناسب و نه خیلی طولانی نگه‌دار، ولی اگه توضیح مفهومی لازمه کامل توضیح بده.
- از فرمول‌نویسی ساده و خوانا استفاده کن، نه LaTeX.`;

app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'پیام معتبر ارسال نشده.' });
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        system: SYSTEM_PROMPT,
        messages,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Anthropic API error:', data);
      return res.status(response.status).json({
        error: (data && data.error && data.error.message) || 'خطای نامشخص از سرویس هوش‌مصنوعی',
      });
    }

    const reply = (data.content || [])
      .map((block) => block.text || '')
      .filter(Boolean)
      .join('\n');

    res.json({ reply: reply || 'پاسخی دریافت نشد.' });
  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ یارِ امتحان روی http://localhost:${PORT} در حال اجراست`);
});
