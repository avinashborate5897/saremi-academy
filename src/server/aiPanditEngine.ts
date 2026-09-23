import { GoogleGenAI } from '@google/genai';

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

const SYSTEM_INSTRUCTION = `You are "Saremi AI Pandit", an esteemed and enlightened musical maestro and digital mentor at Saremi Academy.
You are an authority on Indian Classical Music (Hindustani & Carnatic), Western Music, World Instruments (Harmonium, Piano, Guitar, Tabla, Flute, Ukulele, Vocals), and all Saremi Academy programs, admissions, and fee structures.

Guidelines:
1. Answer questions on musical concepts (Ragas, Taals, Swaras, Alankars, Riyaaz, Chords, Scales, Voice culture, Technique).
2. Answer questions about Saremi Academy courses, fees, packages, 1:1 live online classes, free trial bookings, and faculty.
3. Tone: Respectful, knowledgeable, warm, encouraging, with classical reverence ("Namaste", "Swara", "Riyaaz").
4. If a user asks about non-musical subjects (coding, sports, politics, weather, finance etc.), politely decline: state that you are devoted exclusively to music and Saremi Academy, and offer to explain a raga, instrument, or fee option instead.
5. Keep answers clear, structured with bullet points where helpful, and engaging.`;

// Track if Gemini API quota/credits are exhausted to prevent spamming 429 requests
let quotaExhaustedCooldownUntil = 0;

export async function handleAIPanditQuery(messages: ChatMessage[]): Promise<string> {
  const latestMessage = messages.length > 0 ? messages[messages.length - 1].text : '';

  // 1. Try Gemini API first if key exists and cooldown is inactive
  if (process.env.GEMINI_API_KEY && Date.now() > quotaExhaustedCooldownUntil) {
    try {
      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      // Gemini multi-turn requires:
      // 1. First turn must be 'user'
      // 2. Roles should alternate or be normalized
      const validContents: Array<{ role: 'user' | 'model'; parts: [{ text: string }] }> = [];
      let foundFirstUser = false;

      for (const msg of messages) {
        if (!foundFirstUser && msg.role === 'user') {
          foundFirstUser = true;
        }
        if (foundFirstUser) {
          validContents.push({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text }],
          });
        }
      }

      // If no user message was found in history, use the latest
      if (validContents.length === 0) {
        validContents.push({
          role: 'user',
          parts: [{ text: latestMessage || 'Namaste' }],
        });
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: validContents,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          temperature: 0.7,
        },
      });

      if (response && response.text && response.text.trim()) {
        return response.text.trim();
      }
    } catch (err: any) {
      const errorMsg = String(err?.message || err || '');
      if (errorMsg.includes('429') || errorMsg.includes('RESOURCE_EXHAUSTED') || errorMsg.includes('credits are depleted')) {
        // Set a 15-minute cooldown so we don't repeatedly hit 429 or spam logs
        quotaExhaustedCooldownUntil = Date.now() + 15 * 60 * 1000;
      }
      // Silently fall back to built-in Saremi Knowledge Engine
    }
  }

  // 2. Fallback to Saremi Classical & Western Music + Fees Intelligence Engine
  return generateMusicKnowledgeResponse(latestMessage);
}

/**
 * Robust, highly comprehensive offline knowledge engine for Indian Classical & Western Music + Academy Fees
 */
function generateMusicKnowledgeResponse(query: string): string {
  const q = (query || '').toLowerCase().trim();

  // --- Greetings ---
  if (/^(hi|hello|hey|namaste|pranam|namaskar|salaam|good morning|good evening|kese ho|kaise ho|who are you)/i.test(q) && q.length < 35) {
    return `Namaste! 🙏 I am **Saremi AI Pandit**, your dedicated musical mentor and academy guide.

I can assist you with:
• **Indian Classical Music**: Ragas (Yaman, Bhairav, Bhairavi, etc.), Taals (Teentaal, Ektaal, Rupak), Swara knowledge, and Riyaaz routines.
• **Western Music**: Chords, scales, arpeggios, vocal warmups, and ear training.
• **Instruments**: Vocals, Harmonium, Piano/Keyboard, Acoustic & Electric Guitar, Tabla, and Flute.
• **Saremi Academy Fees & Admissions**: 1:1 Live Online class plans, schedules, and booking your **Free 30-Min Live Trial**.

What would you like to explore today?`;
  }

  // --- Fees & Pricing Queries ---
  if (
    q.includes('fee') ||
    q.includes('price') ||
    q.includes('pricing') ||
    q.includes('cost') ||
    q.includes('charge') ||
    q.includes('package') ||
    q.includes('plan') ||
    q.includes('how much') ||
    q.includes('kitna') ||
    q.includes('discount')
  ) {
    return `🎶 **Saremi Academy Course & Fee Structure**

At Saremi Academy, all training is conducted in **1:1 Live Interactive Sessions** with dedicated master gurus.

**1. 100% Free Live Trial Session:**
• **Duration**: 30 Minutes (1:1 with an expert faculty member).
• **Cost**: **₹0 (Completely Free)**. Includes skill assessment and personalized curriculum guidance.

**2. Authoritative Tuition & Package Plans:**
• **Standard 1:1 (4 Sessions / Month • 1x/week):**
  - **1 Month**: ₹2,499 ($35)
  - **2 Months (Save 10%)**: ₹4,598 (₹2,299/mo)
  - **3 Months (Save 15%)**: ₹5,997 (₹1,999/mo)
• **Standard 1:1 (8 Sessions / Month • 2x/week • Recommended ⭐):**
  - **1 Month**: ₹4,499 ($60)
  - **2 Months (Save 10%)**: ₹8,598 (₹4,299/mo)
  - **3 Months (Save 15% • Best Value 👑)**: ₹11,997 (₹3,999/mo) — Includes Level Certification
• **Group Batches (8 Sessions / Month • Hindustani Vocals):**
  - **1 Month**: ₹1,899 ($25)
  - **2 Months (Save 10%)**: ₹3,418 (₹1,709/mo)
  - **3 Months (Save 15%)**: ₹4,842 (₹1,614/mo)
• **Premium 1:1 (Violin / Flute Master Faculty):**
  - **4 Sessions/Month**: From ₹2,699/mo (₹2,699 / ₹4,858 / ₹6,897)
  - **8 Sessions/Month**: From ₹4,249/mo (₹4,999 / ₹8,998 / ₹12,747)

💡 *Every fee plan includes access to recorded lesson recaps, interactive digital whiteboards, Tanpura/Tuner Practice Studio, and personal Guru chat.*

👉 Would you like me to guide you to **Book your Free Trial** or discuss a specific instrument?`;
  }

  // --- Trial / Booking Queries ---
  if (
    q.includes('trial') ||
    q.includes('demo') ||
    q.includes('book') ||
    q.includes('register') ||
    q.includes('admission') ||
    q.includes('enroll') ||
    q.includes('join')
  ) {
    return `✨ **How to Book a Free Trial at Saremi Academy**

1. Click the **"Book Free Trial"** button on the homepage navigation bar.
2. Select your musical passion (Classical Singing, Light Vocal, Piano, Guitar, Harmonium, Tabla, or Flute).
3. Choose your preferred day and time slot.
4. Meet your guru 1:1 via our in-browser live virtual classroom — no special software required!

The 30-minute trial is **100% Free** with zero obligation. You'll receive a live vocal or instrumental evaluation and custom learning roadmap.`;
  }

  // --- Ragas Queries ---
  if (q.includes('yaman') || q.includes('kalyan')) {
    return `🎵 **Raga Yaman (Kalyan Thaat)**

• **Thaat**: Kalyan
• **Swaras**: All notes are Shuddha, except **Teevra Madhyam (M')**.
• **Vadi Swara**: Gandhar (Ga)
• **Samvadi Swara**: Nishad (Ni)
• **Jati**: Sampurna - Sampurna (Shadav in ascending phrase often omitting Sa or Pa: 'N R G M' D N S')
• **Time of Performance (Samay)**: First Prahar of Night (Early Evening / 6 PM - 9 PM)
• **Mood (Rasa)**: Shringara (Romantic), Shanta (Peaceful), and Devotional.
• **Aroha**: 'N R G, M' D N S'
• **Avroha**: S' N D P, M' G R S
• **Pakad (Catch phrase)**: 'N R G, M' D P, M' G, R G R S

💡 *Guru's Riyaaz Tip*: Give special emphasis and sustain (*nyas*) on **Ga** and **Ni**. Avoid direct Sa in the ascent ('N-R-G).`;
  }

  if (q.includes('bhairav') && !q.includes('bhairavi')) {
    return `🌅 **Raga Bhairav (King of Morning Ragas)**

• **Thaat**: Bhairav
• **Swaras**: **Rishabh (Re)** and **Dhaivat (Dha)** are **Komal (Flat)**; Gandhar, Madhyam, and Nishad are Shuddha.
• **Vadi Swara**: Dhaivat (komal Dha)
• **Samvadi Swara**: Rishabh (komal Re)
• **Time of Performance**: Pratahkal (Early Morning / Dawn: 4 AM - 7 AM)
• **Mood**: Bhakti (Profound devotion), solemnity, and spiritual awakening.
• **Aroha**: S r G m P d N S'
• **Avroha**: S' N d P m G r S
• **Pakad**: G m d, d P, m G r, r S

💡 *Guru's Riyaaz Tip*: Master the characteristic slow oscillatory shake (*Andolan*) on **komal Re** and **komal Dha** for authentic Bhairav flavor.`;
  }

  if (q.includes('bhairavi')) {
    return `🌸 **Raga Bhairavi (Queen of Ragas)**

• **Thaat**: Bhairavi
• **Swaras**: All four swaras are **Komal**: **r, g, d, n** (Komal Re, Ga, Dha, Ni). Ma and Pa are Shuddha.
• **Vadi Swara**: Madhyam (Ma)
• **Samvadi Swara**: Shadja (Sa)
• **Time of Performance**: Traditionally morning, but universal custom permits it to be sung as the grand finale of any classical concert at any hour!
• **Mood**: Pathos, Karuna (Compassion), deep nostalgia, and divine peace.
• **Aroha**: S r g m P d n S'
• **Avroha**: S' n d P m g r S

💡 In semi-classical renditions (Thumri, Dadra, Bhajan), maestros often weave in all 12 swaras (*Mishra Bhairavi*) with exquisite grace.`;
  }

  if (q.includes('bilawal') || q.includes('alhaiya bilawal')) {
    return `☀️ **Raga Bilawal (The Foundation of Swaras)**

• **Thaat**: Bilawal (The parent shuddha scale of North Indian classical music, identical to the Western Major scale: C-D-E-F-G-A-B).
• **Swaras**: All 7 Swaras are **Shuddha** (Sa, Re, Ga, Ma, Pa, Dha, Ni).
• **Vadi Swara**: Dhaivat (Dha)
• **Samvadi Swara**: Gandhar (Ga)
• **Time of Performance**: Late morning (9 AM - 12 PM)
• **Mood**: Joyous, cheerful, energetic, and triumphant.
• **Aroha**: S R G m P D N S'
• **Avroha**: S' N D P m G R S

💡 Beginners at Saremi Academy always begin their swara orientation with Bilawal alankars to solidify pure pitch recognition.`;
  }

  if (q.includes('kafi')) {
    return `🌧️ **Raga Kafi**

• **Thaat**: Kafi
• **Swaras**: **Gandhar (Ga)** and **Nishad (Ni)** are Komal (flat); all others are Shuddha.
• **Vadi / Samvadi**: Pancham (Pa) / Shadja (Sa)
• **Samay**: Midnight (or anytime during the Monsoon season / Shravan).
• **Mood**: Playful, romantic, celebrating spring (Holi) or monsoon showers. Very popular in Thumri, Hori, and Tappa.
• **Aroha**: S R g m P D n S'
• **Avroha**: S' n D P m g R S`;
  }

  if (q.includes('bhoopali') || q.includes('bhupali') || q.includes('bhopali')) {
    return `🌄 **Raga Bhoopali (Audav Raga)**

• **Thaat**: Kalyan
• **Jati**: Audav - Audav (Pentatonic, 5 notes in ascent and descent).
• **Varjit Swaras (Omitted notes)**: **Ma** and **Ni** are strictly omitted.
• **Swaras**: S - R - G - P - D (All Shuddha).
• **Vadi**: Gandhar (Ga) | **Samvadi**: Dhaivat (Dha)
• **Samay**: First Prahar of Night (7 PM - 10 PM)
• **Aroha**: S R G P D S'
• **Avroha**: S' D P G R S
• **Pakad**: G R S 'D, S R G, P G, D P G R S

💡 *Note*: Bhoopali shares the same notes as Mohanam in Carnatic music and the Major Pentatonic scale in Western music!`;
  }

  if (q.includes('darbari') || q.includes('malkauns') || q.includes('bageshree') || q.includes('asavari') || q.includes('todi')) {
    return `🎼 **Classical Raga Overview**

Hindustani music classifies ragas into **10 Thaats** created by Pandit Vishnu Narayan Bhatkhande:
1. **Bilawal** (All pure notes)
2. **Kalyan** (Teevra Ma)
3. **Khamaj** (Komal Ni)
4. **Kafi** (Komal Ga, Komal Ni)
5. **Asavari** (Komal Ga, Dha, Ni)
6. **Bhairav** (Komal Re, Dha)
7. **Bhairavi** (Komal Re, Ga, Dha, Ni)
8. **Todi** (Komal Re, Ga, Dha + Teevra Ma)
9. **Poorvi** (Komal Re, Dha + Teevra Ma)
10. **Marwa** (Komal Re + Teevra Ma, no Pa)

At Saremi Academy, students explore these step-by-step with bandishes, taans, and bol-alaap under 1:1 guru guidance. Which specific raga would you like to master?`;
  }

  // --- Taals & Rhythm Queries ---
  if (q.includes('teentaal') || q.includes('teen taal') || q.includes('tintal')) {
    return `🥁 **Teentaal (The King of Taals)**

• **Total Matras (Beats)**: 16
• **Vibhags (Divisions)**: 4 equal divisions of 4 beats each (4 + 4 + 4 + 4).
• **Tali (Claps)**: On beat 1 (Som), beat 5, and beat 13.
• **Khali (Wave of hand)**: On beat 9.

**Theka (Bols):**
\`\`\`
1     2     3     4    | 5     6     7     8
Dha   Dhin  Dhin  Dha  | Dha   Dhin  Dhin  Dha

9     10    11    12   | 13    14    15    16
Dha   Tin   Tin   Ta   | Ta    Dhin  Dhin  Dha
(Khali)                | (Tali 3)
\`\`\`
Som is on **Beat 1 (Dha)**. Teentaal is the benchmark rhythm for Khayal drut bandishes, instrument sitar/sarod gat, and tabla solos.`;
  }

  if (q.includes('taal') || q.includes('tala') || q.includes('rhythm') || q.includes('keharwa') || q.includes('dadra') || q.includes('ektaal') || q.includes('rupak')) {
    return `🥁 **Essential Taals in Indian Music**

1. **Teentaal**: 16 Beats (4-4-4-4). The standard for classical vocal and instrumental gats.
2. **Ektaal**: 12 Beats (2-2-2-2-2-2). Tali on 1, 5, 9, 11; Khali on 3, 7. Used for Bada Khayal & Drut.
3. **Jhaptaal**: 10 Beats (2-3-2-3). Tali on 1, 3, 8; Khali on 6. Classical bandishes.
4. **Rupak (Roopak)**: 7 Beats (3-2-2). Unique: Starts with Khali on Beat 1! (Tin Tin Na | Dhi Na | Dhi Na).
5. **Keharwa**: 8 Beats (4-4). *Dhage Nati Nake Dhin*. Universal in Ghazals, Bhajans, and Bollywood.
6. **Dadra**: 6 Beats (3-3). *Dha Dhi Na | Dha Ti Na*. Folk, Thumri, and light classical.

💡 *Practice Studio*: Saremi Academy includes a built-in interactive **Tabla & Metronome Tool** right in the student portal to practice along!`;
  }

  // --- Vocal Training & Riyaaz Queries ---
  if (
    q.includes('riyaaz') ||
    q.includes('riyaz') ||
    q.includes('practice') ||
    q.includes('kharaj') ||
    q.includes('voice') ||
    q.includes('singing') ||
    q.includes('vocal') ||
    q.includes('pitch') ||
    q.includes('sur')
  ) {
    return `🎤 **Guru's Riyaaz Secrets for Flawless Singing**

1. **Kharaj Ka Riyaaz (Lower Octave Conditioning)**:
   • Practice in the early morning at lower pitches (Mandra Saptak: down to low Pa, Dha, Ni).
   • Hold each note on an open "Aa" or "Om" with sustained, relaxed diaphragmatic breath.
   • Expands your vocal range and bestows resonance and richness to your singing voice.

2. **Alankars & Palte**:
   • Practice 5 foundational patterns in Bilawal scale:
     - Sa Re Ga, Re Ga Ma, Ga Ma Pa...
     - Sa Re Ga Ma, Re Ga Ma Pa...
     - Sa Ga, Re Ma, Ga Pa, Ma Dha...
   • First at Vilambit (slow tempo) to fix pitch accuracy (*Sur*), then accelerate to Madhyalaya (medium) and Drut (fast).

3. **Tanpura Tuning**:
   • Always sing with a resonant Tanpura (set to your natural pitch, e.g., C# for males, G/G# for females).
   • Match your vocal harmonic to the fifth (Pancham) and fundamental (Shadja).

Would you like advice on breath control, high notes (*Taar Saptak*), or vocal vibrato?`;
  }

  // --- Western Music Queries (Piano, Guitar, Chords, Scales) ---
  if (q.includes('piano') || q.includes('keyboard')) {
    return `🎹 **Piano & Keyboard at Saremi Academy**

• **Curriculum**: Covers posture, finger agility (Hanon & Czerny exercises), classical sight-reading, pop chord comping, and improvisation.
• **Core Chords for Beginners**:
  - C Major (C - E - G)
  - G Major (G - B - D)
  - A minor (A - C - E)
  - F Major (F - A - C)
  *(With these 4 chords, you can play hundreds of famous songs!)*
• **Exam Preparation**: Optional Trinity College London or ABRSM graded certification.
• **1:1 Classes**: Available from beginner to advanced with personal sheet music and MIDI feedback.

Would you like to book a **Free 1:1 Piano Trial** with one of our master instructors?`;
  }

  if (q.includes('guitar') || q.includes('chords') || q.includes('strumming')) {
    return `🎸 **Guitar Program at Saremi Academy**

• **Acoustic, Electric & Classical Guitar**:
  - Open Chords (E, Em, A, Am, C, D, G)
  - Smooth chord transitions & rhythm timing
  - Strumming patterns (Down, Down-Up, Up-Down-Up) & Fingerpicking
  - Barre chords (F, Bm) & the CAGED system
  - Scales: Major, Minor Pentatonic, and Blues scales for soloing.
• **Fee**: Included under standard ₹2,499 / ₹4,499 monthly 1:1 packages.

Try practicing 20 minutes daily with a metronome to lock in your rhythm!`;
  }

  if (q.includes('western') || q.includes('scale') || q.includes('chord') || q.includes('harmony')) {
    return `🎼 **Western Music Theory Essentials**

• **Major Scale Formula**: Whole - Whole - Half - Whole - Whole - Whole - Half (W-W-H-W-W-W-H).
  Example in C Major: C - D - E - F - G - A - B - C.
• **Natural Minor Scale**: W - H - W - W - H - W - W.
  Example in A Minor: A - B - C - D - E - F - G - A.
• **Triads**:
  - Major Triad = Root + Major 3rd (4 semitones) + Perfect 5th (7 semitones).
  - Minor Triad = Root + Minor 3rd (3 semitones) + Perfect 5th (7 semitones).
• **Circle of Fifths**: The geometric compass of music theory used to determine key signatures and chord relationships!

What specific western music theory concept can I break down for you?`;
  }

  // --- Off-topic or General Music / Academy Catch-all ---
  const isOffTopic = /(python|javascript|code|crypto|bitcoin|election|football|cricket|recipe|weather|car|politics|movie|stock market|president)/i.test(q);

  if (isOffTopic) {
    return `🙏 **Saremi AI Pandit's Focus**

I am devoted exclusively to the divine arts of **Music** and **Saremi Academy**.

I am unable to answer questions regarding technology, politics, sports, or non-musical topics. 

However, I would be delighted to help you with:
• Indian Classical Music (Ragas, Taals, Swaras, Riyaaz)
• Western Music (Piano, Guitar, Chords, Scales, Vocal training)
• Saremi Academy course information, fees (₹2,499 - ₹6,499/mo), and booking your **Free 1:1 Live Trial**!

What musical subject shall we explore?`;
  }

  // Default intelligent music mentor response
  return `🎶 **Namaste from Saremi AI Pandit!**

Music is the purest expression of the soul, built upon the harmonious union of **Sur** (Pitch) and **Laya** (Rhythm).

At **Saremi Academy**, we bring the revered Guru-Shishya tradition to your home through **1:1 Live Online Classes** in:
• **Indian Classical & Light Vocal** (Hindustani, Carnatic, Ghazal, Bhajan, Bollywood)
• **Instruments**: Harmonium, Piano/Keyboard, Acoustic & Electric Guitar, Tabla, Flute, and Ukulele.
• **Structured Certification**: Graded exams via Gandharva Mahavidyalaya and Trinity London.

**Tuition Plans**:
• **Free Trial Class**: 30 mins, 100% Free Live with Guru.
• **Starter Plan**: ₹2,499 / mo (1 class/week)
• **Standard Plan**: ₹4,499 / mo (2 classes/week - Most Popular)

Please ask me about any **Raga**, **Taal**, **Instrument**, **Riyaaz technique**, or **Fee details**, and I will gladly illuminate it!`;
}
