import axios from "axios";

export const meta = {
  name: "zodiac",
  aliases: ["compatibility", "astro"],
  version: "1.0.0",
  description: "Zodiac compatibility analysis between two signs",
  author: "JohnDev19",
  prefix: "both",
  category: "fun",
  type: "anyone",
  cooldown: 5,
  guide: ["<Sign1> <Sign2>"]
};

const zodiacSigns = {
  Aries: { dates: "March 21 - April 19", element: "Fire", symbol: "♈", ruling_planet: "Mars", personality_traits: ["Courageous","Energetic","Confident","Enthusiastic"], compatibility: { best: ["Leo","Sagittarius","Gemini","Aquarius"], worst: ["Cancer","Capricorn","Virgo"] } },
  Taurus: { dates: "April 20 - May 20", element: "Earth", symbol: "♉", ruling_planet: "Venus", personality_traits: ["Reliable","Patient","Practical","Devoted"], compatibility: { best: ["Virgo","Capricorn","Cancer","Pisces"], worst: ["Leo","Aquarius","Scorpio"] } },
  Gemini: { dates: "May 21 - June 20", element: "Air", symbol: "♊", ruling_planet: "Mercury", personality_traits: ["Adaptable","Outgoing","Intellectual","Witty"], compatibility: { best: ["Libra","Aquarius","Aries","Leo"], worst: ["Virgo","Pisces","Sagittarius"] } },
  Cancer: { dates: "June 21 - July 22", element: "Water", symbol: "♋", ruling_planet: "Moon", personality_traits: ["Emotional","Intuitive","Nurturing","Protective"], compatibility: { best: ["Scorpio","Pisces","Taurus","Virgo"], worst: ["Aries","Libra","Sagittarius"] } },
  Leo: { dates: "July 23 - August 22", element: "Fire", symbol: "♌", ruling_planet: "Sun", personality_traits: ["Charismatic","Generous","Creative","Confident"], compatibility: { best: ["Aries","Sagittarius","Gemini","Libra"], worst: ["Taurus","Scorpio","Cancer"] } },
  Virgo: { dates: "August 23 - September 22", element: "Earth", symbol: "♍", ruling_planet: "Mercury", personality_traits: ["Analytical","Practical","Detail-oriented","Modest"], compatibility: { best: ["Taurus","Capricorn","Cancer","Scorpio"], worst: ["Gemini","Sagittarius","Leo"] } },
  Libra: { dates: "September 23 - October 22", element: "Air", symbol: "♎", ruling_planet: "Venus", personality_traits: ["Charming","Diplomatic","Fair-minded","Social"], compatibility: { best: ["Gemini","Aquarius","Leo","Sagittarius"], worst: ["Cancer","Capricorn","Scorpio"] } },
  Scorpio: { dates: "October 23 - November 21", element: "Water", symbol: "♏", ruling_planet: "Pluto", personality_traits: ["Passionate","Resourceful","Determined","Intense"], compatibility: { best: ["Cancer","Pisces","Virgo","Capricorn"], worst: ["Leo","Aquarius","Taurus"] } },
  Sagittarius: { dates: "November 22 - December 21", element: "Fire", symbol: "♐", ruling_planet: "Jupiter", personality_traits: ["Optimistic","Adventurous","Independent","Philosophical"], compatibility: { best: ["Aries","Leo","Gemini","Aquarius"], worst: ["Virgo","Pisces","Cancer"] } },
  Capricorn: { dates: "December 22 - January 19", element: "Earth", symbol: "♑", ruling_planet: "Saturn", personality_traits: ["Disciplined","Responsible","Ambitious","Practical"], compatibility: { best: ["Taurus","Virgo","Scorpio","Pisces"], worst: ["Aries","Libra","Gemini"] } },
  Aquarius: { dates: "January 20 - February 18", element: "Air", symbol: "♒", ruling_planet: "Uranus", personality_traits: ["Innovative","Humanitarian","Independent","Eccentric"], compatibility: { best: ["Gemini","Libra","Aries","Sagittarius"], worst: ["Taurus","Scorpio","Leo"] } },
  Pisces: { dates: "February 19 - March 20", element: "Water", symbol: "♓", ruling_planet: "Neptune", personality_traits: ["Compassionate","Artistic","Intuitive","Gentle"], compatibility: { best: ["Cancer","Scorpio","Taurus","Capricorn"], worst: ["Gemini","Sagittarius","Leo"] } }
};

// trimmed compatibility matrix to reduce file size (still functional)
const compatibilityMatrix = {
  Aries: { Leo: { compatibility: "❤️ Perfect Match! Passionate and dynamic", score: 90, description: "Both fire signs with incredible energy.", emotional_connection: "High", communication: "Excellent", challenges: "Ego clashes" } },
  Taurus: { Virgo: { compatibility: "❤️ Stable and supportive partnership", score: 88, description: "Shared earth energy, loyal connection.", emotional_connection: "High", communication: "Excellent", challenges: "Routine boredom" } },
  Gemini: { Libra: { compatibility: "❤️ Harmonious and balanced relationship", score: 90, description: "Social and intellectual equals.", emotional_connection: "High", communication: "Excellent", challenges: "Indecision" } },
  Cancer: { Scorpio: { compatibility: "❤️ Deep and intense connection", score: 90, description: "Emotional depth and loyalty.", emotional_connection: "High", communication: "Excellent", challenges: "Sensitivity" } },
  Leo: { Aries: { compatibility: "❤️ Passionate and dynamic", score: 90, description: "Fire signs in harmony.", emotional_connection: "High", communication: "Excellent", challenges: "Ego clashes" } },
  Virgo: { Taurus: { compatibility: "❤️ Stable and supportive partnership", score: 88, description: "Practical and reliable duo.", emotional_connection: "High", communication: "Excellent", challenges: "Routine issues" } },
  Libra: { Aquarius: { compatibility: "💖 Exciting and innovative connection", score: 85, description: "Air signs thrive on ideas.", emotional_connection: "High", communication: "Great", challenges: "Emotional detachment" } },
  Scorpio: { Pisces: { compatibility: "💖 Nurturing and compassionate relationship", score: 85, description: "Emotional water bond.", emotional_connection: "High", communication: "Great", challenges: "Idealism" } },
  Sagittarius: { Leo: { compatibility: "💖 Adventurous and energetic", score: 85, description: "Fun, bold, and vibrant pair.", emotional_connection: "High", communication: "Great", challenges: "Commitment" } },
  Capricorn: { Taurus: { compatibility: "💖 Strong foundation and mutual respect", score: 85, description: "Reliable and long-term oriented.", emotional_connection: "High", communication: "Great", challenges: "Serious tone" } },
  Aquarius: { Gemini: { compatibility: "💖 Exciting and innovative connection", score: 85, description: "Creative minds unite.", emotional_connection: "High", communication: "Great", challenges: "Emotional distance" } },
  Pisces: { Cancer: { compatibility: "💖 Nurturing and compassionate relationship", score: 85, description: "Emotional harmony.", emotional_connection: "High", communication: "Great", challenges: "Idealism" } }
};

function normalizeSign(sign) {
  return sign.charAt(0).toUpperCase() + sign.slice(1).toLowerCase();
}

function generateCompatibilityTip() {
  const tips = [
    "Communication is key to understanding each other.",
    "Respect differences and grow together.",
    "Practice patience and empathy.",
    "Embrace complementary strengths.",
    "Be honest about your feelings.",
    "Celebrate each other's uniqueness."
  ];
  return tips[Math.floor(Math.random() * tips.length)];
}

export async function onStart({ args, response, usages }) {
  if (args.length !== 2)
    return usages();

  const sign1 = normalizeSign(args[0]);
  const sign2 = normalizeSign(args[1]);

  if (!zodiacSigns[sign1] || !zodiacSigns[sign2])
    return response.reply(`❌ Invalid sign.\nValid: ${Object.keys(zodiacSigns).join(", ")}`);

  const loading = await response.reply("🔮 Calculating compatibility...");

  try {
    const base = compatibilityMatrix[sign1]?.[sign2] || compatibilityMatrix[sign2]?.[sign1] || {
      compatibility: "🤝 Neutral Compatibility",
      score: 60,
      description: "Balanced relationship with potential for growth",
      emotional_connection: "Moderate",
      communication: "Average",
      challenges: "Requires mutual understanding"
    };

    const elementBoost = {
      Fire: ["Air"],
      Earth: ["Water"],
      Air: ["Fire"],
      Water: ["Earth"]
    }[zodiacSigns[sign1].element]?.includes(zodiacSigns[sign2].element)
      ? 15 : 5;

    const finalScore = Math.min(base.score + elementBoost, 100);

    const msg = `
🌟 *Zodiac Compatibility Report* 🌟

${sign1} ${zodiacSigns[sign1].symbol} ♡ ${sign2} ${zodiacSigns[sign2].symbol}

📊 *Score:* ${finalScore}%
- ${base.compatibility}

🔮 *Insights:*
• Emotional Connection: ${base.emotional_connection}
• Communication: ${base.communication}
• Challenges: ${base.challenges}

🌈 *${sign1}* (${zodiacSigns[sign1].dates})
• Element: ${zodiacSigns[sign1].element}
• Planet: ${zodiacSigns[sign1].ruling_planet}
• Traits: ${zodiacSigns[sign1].personality_traits.join(", ")}

🌈 *${sign2}* (${zodiacSigns[sign2].dates})
• Element: ${zodiacSigns[sign2].element}
• Planet: ${zodiacSigns[sign2].ruling_planet}
• Traits: ${zodiacSigns[sign2].personality_traits.join(", ")}

💡 *Tip:* ${generateCompatibilityTip()}
`;

    await response.editText(loading, msg, { parse_mode: "Markdown" });
  } catch (err) {
    await response.editText(loading, `⚠️ Error: ${err.message}`);
  }
}
