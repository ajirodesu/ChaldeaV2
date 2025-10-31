import axios from 'axios';

/**
 * Personality test command (full, complete)
 * - ES module style: export const meta + export async function onStart(...)
 * - Exports an `activeSessions` Map so other modules can inspect/cancel sessions.
 * - Uses force-reply question flow; user replies with A/B/C/D.
 * - Ambiguous option types like "E/I" increment both letters (1 point each).
 */

export const meta = {
  name: 'personality',
  version: '1.0.0',
  aliases: ['mbti', 'mbti-test'],
  description: 'Take an MBTI-style personality test (20 questions). Reply with A/B/C/D to answer.',
  author: 'JohnDev19',
  prefix: 'both',
  category: 'fun',
  type: 'anyone',
  cooldown: 5,
  guide: [
    '',
    'Reply with A, B, C, or D to answer each question',
    'Only one test per chat at a time'
  ]
};

/* ---------- Questions (full 20) ---------- */
const questions = [
  {
    id: 1,
    text: "How do you like to spend your free time?",
    options: [
      { text: "Hosting big parties with lots of people", type: "E" },
      { text: "Meeting new people and making connections", type: "E/I" },
      { text: "Talking with close friends", type: "I" },
      { text: "Doing things alone, like reading or a hobby", type: "I" }
    ]
  },
  {
    id: 2,
    text: "When making an important decision, you usually:",
    options: [
      { text: "Use pure logic and facts", type: "T" },
      { text: "Consider logic and people's feelings", type: "T/F" },
      { text: "Think about how it affects people", type: "F" },
      { text: "Mix feelings and rational thinking", type: "F/T" }
    ]
  },
  {
    id: 3,
    text: "Your daily life is mostly:",
    options: [
      { text: "Strictly planned with no changes", type: "J" },
      { text: "Planned but flexible", type: "J/P" },
      { text: "Spontaneous and unplanned", type: "P" },
      { text: "Flexible with some planning", type: "P/J" }
    ]
  },
  {
    id: 4,
    text: "When learning something new, you are interested in:",
    options: [
      { text: "Practical, useful information", type: "S" },
      { text: "Big ideas and future possibilities", type: "N" },
      { text: "New ideas with practical use", type: "N/S" },
      { text: "Theories that work in real life", type: "S/N" }
    ]
  },
  {
    id: 5,
    text: "At a social event, you usually:",
    options: [
      { text: "Talk to everyone and have fun", type: "E" },
      { text: "Join interesting conversations", type: "E/I" },
      { text: "Watch and listen", type: "I" },
      { text: "Talk with one or two people", type: "I" }
    ]
  },
  {
    id: 6,
    text: "When solving a conflict, you:",
    options: [
      { text: "Use pure logic", type: "T" },
      { text: "Look for a fair solution", type: "T/F" },
      { text: "Focus on feelings and relationships", type: "F" },
      { text: "Balance emotions and logic", type: "F/T" }
    ]
  },
  {
    id: 7,
    text: "With work and deadlines, you are:",
    options: [
      { text: "Always early and well-prepared", type: "J" },
      { text: "Planned with some extra time", type: "J/P" },
      { text: "Work best under pressure", type: "P" },
      { text: "Flexible with bursts of work", type: "P/J" }
    ]
  },
  {
    id: 8,
    text: "When looking at new ideas, you prefer:",
    options: [
      { text: "Proven methods that work", type: "S" },
      { text: "Totally new approaches", type: "N" },
      { text: "New ideas with practical use", type: "N/S" },
      { text: "Checking ideas from different angles", type: "S/N" }
    ]
  },
  {
    id: 9,
    text: "At a party, your energy:",
    options: [
      { text: "Increases and you get more active", type: "E" },
      { text: "Goes up and down", type: "E/I" },
      { text: "Slowly goes down", type: "I" },
      { text: "Stays the same with few talks", type: "I" }
    ]
  },
  {
    id: 10,
    text: "When giving feedback, you:",
    options: [
      { text: "Are direct and straight to the point", type: "T" },
      { text: "Try to be honest but kind", type: "T/F" },
      { text: "Focus on supporting the person", type: "F" },
      { text: "Give advice with care", type: "F/T" }
    ]
  },
  {
    id: 11,
    text: "Your workspace is usually:",
    options: [
      { text: "Very organized and neat", type: "J" },
      { text: "Structured but creative", type: "J/P" },
      { text: "Messy and changing", type: "P" },
      { text: "Organized but with creative spaces", type: "P/J" }
    ]
  },
  {
    id: 12,
    text: "When facing a hard problem, you:",
    options: [
      { text: "Use standard problem-solving steps", type: "S" },
      { text: "Look for creative solutions", type: "N" },
      { text: "Mix practical and creative thinking", type: "N/S" },
      { text: "Look at the problem from many sides", type: "S/N" }
    ]
  },
  {
    id: 13,
    text: "In group talks, you:",
    options: [
      { text: "Lead and direct the conversation", type: "E" },
      { text: "Join when it's interesting", type: "E/I" },
      { text: "Speak carefully and rarely", type: "I" },
      { text: "Listen most of the time", type: "I" }
    ]
  },
  {
    id: 14,
    text: "When making choices, you care most about:",
    options: [
      { text: "Clear facts and data", type: "T" },
      { text: "Logic and how people feel", type: "T/F" },
      { text: "How it affects relationships", type: "F" },
      { text: "Feelings with a logical base", type: "F/T" }
    ]
  },
  {
    id: 15,
    text: "When planning a trip, you prefer:",
    options: [
      { text: "Everything planned in detail", type: "J" },
      { text: "A plan with some free time", type: "J/P" },
      { text: "Minimal planning", type: "P" },
      { text: "Some planning with room to change", type: "P/J" }
    ]
  },
  {
    id: 16,
    text: "What drives your curiosity most?",
    options: [
      { text: "Useful, practical knowledge", type: "S" },
      { text: "Big, complex ideas", type: "N" },
      { text: "New ideas that can be used", type: "N/S" },
      { text: "Understanding things from all sides", type: "S/N" }
    ]
  },
  {
    id: 17,
    text: "When working with others, you:",
    options: [ 
      { text: "Take charge and lead", type: "E" },
      { text: "Help guide the discussion", type: "E/I" },
      { text: "Support others' ideas", type: "I" },
      { text: "Work alone but help when needed", type: "I" }
    ]
  },
  {
    id: 18,
    text: "When facing a new challenge, you:",
    options: [
      { text: "Jump in right away", type: "E" },
      { text: "Think about it first", type: "E/I" },
      { text: "Consider all possible outcomes", type: "I" },
      { text: "Analyze the challenge carefully", type: "I" }
    ]
  },
  {
    id: 19,
    text: "How do you like to learn?",
    options: [
      { text: "By doing things hands-on", type: "S" },
      { text: "By exploring new theories", type: "N" },
      { text: "Mixing practical and theoretical learning", type: "N/S" },
      { text: "Using real-world examples", type: "S/N" }
    ]
  },
  {
    id: 20,
    text: "In relationships, you value:",
    options: [
      { text: "Lots of communication and sharing", type: "E" },
      { text: "Deep and meaningful connections", type: "E/I" },
      { text: "Emotional support", type: "I" },
      { text: "Having your own space", type: "I" }
    ]
  }
];

/* ---------- Personality types (full set provided) ---------- */
const personalityTypes = {
  ISTJ: {
    title: 'The Logistician',
    description:
      'ISTJ (Logistician) is a personality type with the Introverted, Observant, Thinking, and Judging traits. These people tend to be reserved yet willful, with a rational outlook on life. They compose their actions carefully and carry them out with methodical purpose.',
    imageUrl: 'https://i.ibb.co/3MdNhmJ/IMG-20250111-235613.jpg',
    traits: [
      'Organized and methodical',
      'Reliable and responsible',
      'Practical and fact-minded',
      'Value tradition and stability'
    ]
  },
  ISFJ: {
    title: 'The Defender',
    description:
      'ISFJ (Defender) is a personality type with the Introverted, Observant, Feeling, and Judging traits. These people tend to be warm and unassuming in their own steady way. They’re efficient and responsible, giving careful attention to practical details in their daily lives.',
    imageUrl: 'https://i.ibb.co/10S2JgG/IMG-20250112-000041.jpg',
    traits: ['Caring and nurturing', 'Detail-oriented', 'Traditional and loyal', 'Patient and devoted']
  },
  INFJ: {
    title: 'The Advocate',
    description:
      'INFJ (Advocate) is a personality type with the Introverted, Intuitive, Feeling, and Judging traits. They tend to approach life with deep thoughtfulness and imagination. Their inner vision, personal values, and a quiet, principled version of humanism guide them in all things.',
    imageUrl: 'https://i.ibb.co/Wxn5L8y/IMG-20250112-000219.jpg',
    traits: ['Insightful and intuitive', 'Idealistic and principled', 'Complex and deep', 'Creative and inspiring']
  },
  INTJ: {
    title: 'The Architect',
    description:
      'INTJ (Architect) is a personality type with the Introverted, Intuitive, Thinking, and Judging traits. These thoughtful tacticians love perfecting the details of life, applying creativity and rationality to everything they do. Their inner world is often a private, complex one.',
    imageUrl: 'https://i.ibb.co/CHbwmXp/IMG-20250112-001201.jpg',
    traits: ['Strategic Thinking', 'Independence', 'Rationality', 'Ambition']
  },
  INTP: {
    title: 'The Logician',
    description:
      'INTP (Logician) is a personality type with the Introverted, Intuitive, Thinking, and Prospecting traits. These flexible thinkers enjoy taking an unconventional approach to many aspects of life. They often seek out unlikely paths, mixing willingness to experiment with personal creativity.',
    imageUrl: 'https://i.ibb.co/4gRvrQs/IMG-20250112-001440.jpg',
    traits: ['Curiosity', 'Analytical Thinking', 'Independence', 'Creativity']
  },
  ENTJ: {
    title: 'The Commander',
    description:
      'ENTJ (Commander) is a personality type with the Extraverted, Intuitive, Thinking, and Judging traits. They are decisive people who love momentum and accomplishment. They gather information to construct their creative visions but rarely hesitate for long before acting on them.',
    imageUrl: 'https://i.ibb.co/cvtpy95/IMG-20250112-001804.jpg',
    traits: ['Leadership', 'Decisiveness', 'Strategic Vision', 'Charisma']
  },
  INFP: {
    title: 'The Mediator',
    description:
      'INFP (Mediator) is a personality type with the Introverted, Intuitive, Feeling, and Prospecting traits. These rare personality types tend to be quiet, open-minded, and imaginative, and they apply a caring and creative approach to everything they do.',
    imageUrl: 'https://i.ibb.co/0QgNyWB/IMG-20250112-002016.jpg',
    traits: ['Empathy', 'Idealism', 'Creativity', 'Introversion']
  },
  ENFJ: {
    title: 'The Protagonist',
    description:
      'ENFJ (Protagonist) is a personality type with the Extraverted, Intuitive, Feeling, and Judging traits. These warm, forthright types love helping others, and they tend to have strong ideas and values. They back their perspective with the creative energy to achieve their goals.',
    imageUrl: 'https://i.ibb.co/4pJy3w9/IMG-20250112-002313.jpg',
    traits: ['Charisma', 'Empathy', 'Visionary Thinking', 'Social Connectivity']
  },
  ENFP: {
    title: 'The Campaigner',
    description:
      'ENFP (Campaigner) is a personality type with the Extraverted, Intuitive, Feeling, and Prospecting traits. These people tend to embrace big ideas and actions that reflect their sense of hope and goodwill toward others. Their vibrant energy can flow in many directions.',
    imageUrl: 'https://i.ibb.co/RSWPZdR/IMG-20250112-002703.jpg',
    traits: ['Curiosity', 'Enthusiasm', 'Empathy', 'Creativity']
  },
  ESTJ: {
    title: 'The Executive',
    description:
      'ESTJ (Executive) is a personality type with the Extraverted, Observant, Thinking, and Judging traits. They possess great fortitude, emphatically following their own sensible judgment. They often serve as a stabilizing force among others, able to offer solid direction amid adversity.',
    imageUrl: 'https://i.ibb.co/f1TpMNz/IMG-20250112-003124.jpg',
    traits: ['Leadership', 'Practicality', 'Strong Sense of Duty', 'Decisiveness']
  },
  ESFJ: {
    title: 'The Consul',
    description:
      'ESFJ (Consul) is a personality type with the Extraverted, Observant, Feeling, and Judging traits. They are attentive and people-focused, and they enjoy taking part in their social community. Their achievements are guided by decisive values, and they willingly offer guidance to others.',
    imageUrl: 'https://i.ibb.co/r5ZpmxJ/IMG-20250112-003733.jpg',
    traits: ['Empathy', 'Sociability', 'Practicality', 'Altruism']
  },
  ISTP: {
    title: 'The Virtuoso',
    description:
      'ISTP (Virtuoso) is a personality type with the Introverted, Observant, Thinking, and Prospecting traits. They tend to have an individualistic mindset, pursuing goals without needing much external connection. They engage in life with inquisitiveness and personal skill, varying their approach as needed.',
    imageUrl: 'https://i.ibb.co/FVWvxW/IMG-20250112-003955.jpg',
    traits: ['Practicality', 'Adaptability', 'Curiosity', 'Independence']
  },
  ISFP: {
    title: 'The Adventurer',
    description:
      'ISFP (Adventurer) is a personality type with the Introverted, Observant, Feeling, and Prospecting traits. They tend to have open minds, approaching life, new experiences, and people with grounded warmth. Their ability to stay in the moment helps them uncover exciting potentials.',
    imageUrl: 'https://i.ibb.co/7J2kFLx/IMG-20250112-004232.jpg',
    traits: ['Creativity', 'Empathy', 'Spontaneity', 'Individuality']
  },
  ESTP: {
    title: 'The Entrepreneur',
    description:
      'ESTP (Entrepreneur) is a personality type with the Extraverted, Observant, Thinking, and Prospecting traits. They tend to be energetic and action-oriented, deftly navigating whatever is in front of them. They love uncovering life’s opportunities, whether socializing with others or in more personal pursuits.',
    imageUrl: 'https://i.ibb.co/0fmJzCz/IMG-20250112-004521.jpg',
    traits: ['Adventurous', 'Pragmatic', 'Charismatic', 'Problem-Solvers']
  },
  ESFP: {
    title: 'The Entertainer',
    description:
      'ESFP (Entertainer) is a personality type with the Extraverted, Observant, Feeling, and Prospecting traits. These people love vibrant experiences, engaging in life eagerly and taking pleasure in discovering the unknown. They can be very social, often encouraging others into shared activities.',
    imageUrl: 'https://i.ibb.co/LZ9DrtY/IMG-20250112-004803.jpg',
    traits: ['Sociability', 'Spontaneity', 'Empathy', 'Creativity']
  },
  ENTP: {
    title: 'The Debater',
    description:
      'ENTP (Debater) is a personality type with the Extraverted, Intuitive, Thinking, and Prospecting traits. They tend to be bold and creative, deconstructing and rebuilding ideas with great mental agility. They pursue their goals vigorously despite any resistance they might encounter.',
    imageUrl: 'https://i.ibb.co/VNRNzhb/IMG-20250112-000402.jpg',
    traits: ['Innovative and creative', 'Enthusiastic and energetic', 'Analytical and logical', 'Adaptable and resourceful']
  }
};

/* Exported active sessions map */
export const activeSessions = new Map();

/* ---------- PersonalityTest class ---------- */
class PersonalityTest {
  constructor(bot, chatId, userId, userName) {
    this.bot = bot;
    this.chatId = chatId;
    this.userId = userId;
    this.userName = userName;
    this.currentQuestionIndex = 0;
    this.answers = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 };
    this.messageId = null;
    this.totalQuestions = questions.length;
    this.idleTimeout = null; // can be used for inactivity timeouts if added
  }

  getProgressBar() {
    const completed = this.currentQuestionIndex;
    const total = this.totalQuestions;
    const filledCount = Math.floor((completed / total) * 10);
    const emptyCount = 10 - filledCount;
    return '▰'.repeat(filledCount) + '▱'.repeat(emptyCount);
  }

  async sendNextQuestion() {
    if (this.currentQuestionIndex >= this.totalQuestions) {
      await this.calculateAndSendResults();
      return null;
    }

    const q = questions[this.currentQuestionIndex];
    const questionText = [
      `📝 Question ${this.currentQuestionIndex + 1}/${this.totalQuestions}`,
      `Personality Test for: @${this.userName}`,
      '',
      `${q.text}`,
      '',
      `Options:`,
      ...q.options.map((opt, idx) => `${String.fromCharCode(65 + idx)}. ${opt.text}`),
      '',
      `Progress: ${this.getProgressBar()}`,
      '⚠️ Reply with A, B, C, or D to answer'
    ].join('\n');

    // send with force_reply so the user replies to this message
    const sentMessage = await this.bot.sendMessage(this.chatId, questionText, {
      reply_markup: { force_reply: true, selective: true }
    });

    this.messageId = sentMessage.message_id;
    return sentMessage;
  }

  /**
   * Process a reply message (must be a reply to current question)
   * returns true to continue, false to finish
   */
  async processAnswer(msg) {
    // ensure correct user
    if (msg.from.id !== this.userId) {
      await this.bot.sendMessage(this.chatId, `❌ This personality test is for @${this.userName} only. Start your own test!`);
      return true;
    }

    const answer = String(msg.text || '').toUpperCase().trim();
    if (!['A', 'B', 'C', 'D'].includes(answer)) {
      await this.bot.sendMessage(this.chatId, '❌ Please answer with A, B, C, or D only.');
      return true;
    }

    try {
      const idx = answer.charCodeAt(0) - 65;
      const question = questions[this.currentQuestionIndex];
      const selectedOption = question.options[idx];

      // handle composite types like 'E/I' or 'T/F' -> increment both
      const parts = String(selectedOption.type || '').split('/').map(p => p.trim()).filter(Boolean);
      for (const p of parts) {
        if (p.length === 1 && p in this.answers) {
          this.answers[p] += 1;
        }
      }

      this.currentQuestionIndex++;

      if (this.currentQuestionIndex < this.totalQuestions) {
        await this.sendNextQuestion();
        return true;
      } else {
        await this.calculateAndSendResults();
        return false;
      }
    } catch (err) {
      console.error('Error processing answer:', err);
      await this.bot.sendMessage(this.chatId, 'An error occurred while processing your answer. The test will end.');
      return false;
    }
  }

  determineType() {
    const a = this.answers;
    const first = a.E > a.I ? 'E' : 'I';
    const second = a.S > a.N ? 'S' : 'N';
    const third = a.T > a.F ? 'T' : 'F';
    const fourth = a.J > a.P ? 'J' : 'P';
    return `${first}${second}${third}${fourth}`;
  }

  async calculateAndSendResults() {
    try {
      const type = this.determineType();
      const typeInfo = personalityTypes[type];

      const resultMessageLines = [
        `🎯 Personality Test Results for @${this.userName}`,
        '',
        `Your Type: ${type} - ${typeInfo?.title || 'Unknown'}`,
        '',
        `📊 Type Breakdown:`,
        `• Extraversion: ${this.answers.E}`,
        `• Introversion: ${this.answers.I}`,
        `• Sensing: ${this.answers.S}`,
        `• Intuition: ${this.answers.N}`,
        `• Thinking: ${this.answers.T}`,
        `• Feeling: ${this.answers.F}`,
        `• Judging: ${this.answers.J}`,
        `• Perceiving: ${this.answers.P}`,
        '',
        `✨ Key Traits:`,
        ...(typeInfo?.traits || []).map(t => `• ${t}`),
        '',
        `📝 Description:`,
        `${typeInfo?.description || 'No description available.'}`,
        '',
        `Want to learn more about your type?`,
        `https://www.16personalities.com/${type.toLowerCase()}-personality`
      ];

      const resultMessage = resultMessageLines.join('\n');

      if (typeInfo?.imageUrl) {
        try {
          await this.bot.sendPhoto(this.chatId, typeInfo.imageUrl, {
            caption: resultMessage
          });
          return;
        } catch (photoErr) {
          console.warn('Failed to send result image, falling back to text:', photoErr);
        }
      }

      await this.bot.sendMessage(this.chatId, resultMessage);
    } catch (err) {
      console.error('Error calculating/sending results:', err);
      try {
        await this.bot.sendMessage(this.chatId, 'Failed to generate test results. Please try again later.');
      } catch (e) {}
    }
  }
}

/* ---------- Main command handler ---------- */
export async function onStart({ bot, msg, args, response }) {
  try {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const userName = msg.from.username || msg.from.first_name || 'user';

    // Prevent parallel tests in the same chat
    const existingSession = Array.from(activeSessions.values()).find(s => s.chatId === chatId);
    if (existingSession) {
      return response.reply(`❌ A personality test is already in progress for @${existingSession.userName}. Please wait for it to finish.`);
    }

    // Welcome message using the response wrapper
    const welcomeMessage = [
      `🎯 Welcome to the MBTI Personality Test, @${userName}!`,
      '',
      `This test will help determine your personality type based on the Myers-Briggs Type Indicator system.`,
      '',
      `✅ The test consists of ${questions.length} questions`,
      `✅ Each question has four options (A, B, C, D)`,
      `✅ Choose the option that best describes you`,
      `✅ Simply reply with the letter of your choice (A, B, C, or D)`,
      `✅ Be honest - there are no right or wrong answers`,
      `✅ The test takes about 5-10 minutes to complete`,
      '',
      `The test will begin shortly...`
    ].join('\n');

    await response.send(welcomeMessage);

    // Create session
    const sessionKey = `${chatId}_${userId}`;
    const session = new PersonalityTest(bot, chatId, userId, userName);
    activeSessions.set(sessionKey, session);

    // Message handler: listens for replies (filtering by chat + reply_to_message)
    const messageHandler = async (replyMsg) => {
      if (!replyMsg || replyMsg.chat?.id !== chatId) return;

      const s = activeSessions.get(sessionKey);
      if (!s) {
        try { bot.removeListener('message', messageHandler); } catch (e) {}
        return;
      }

      // Only process replies to the current question message
      if (!replyMsg.reply_to_message || replyMsg.reply_to_message.message_id !== s.messageId) return;

      const keepGoing = await s.processAnswer(replyMsg);

      if (!keepGoing) {
        activeSessions.delete(sessionKey);
        try { bot.removeListener('message', messageHandler); } catch (e) {}
      }
    };

    bot.on('message', messageHandler);

    // Start after a short delay so the user can read the welcome text
    setTimeout(async () => {
      try {
        await session.sendNextQuestion();
      } catch (startErr) {
        console.error('Failed to start test:', startErr);
        activeSessions.delete(sessionKey);
        try { bot.removeListener('message', messageHandler); } catch (e) {}
        await bot.sendMessage(chatId, 'Failed to start the personality test. Please try again later.');
      }
    }, 1500);
  } catch (err) {
    console.error('Error in personality command:', err);
    try { await response.reply('An error occurred while starting the test. Please try again.'); } catch (e) {}
  }
}
