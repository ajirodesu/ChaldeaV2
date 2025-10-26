export const meta = {
  name: "eval",
  version: "1.0.0",
  aliases: [],
  description: "Test your code from the bot quickly",
  author: "dipto",
  prefix: "both",       // true = only with prefix, false = no prefix, "both" = both allowed
  category: "owner",
  type: "owner",        // anyone, admin, vip, group, private
  cooldown: 5,
  guide: "<code to test>"
};

export async function onStart({ bot, args, response, msg, usages }) {
  if (!args.length) {
    return usages();
  }

  // helper to convert Map to plain object
  function mapToObj(map) {
    const obj = {};
    map.forEach((v, k) => obj[k] = v);
    return obj;
  }

  // format the result for messaging
  function out(result) {
    if (typeof result === "number" ||
        typeof result === "boolean" ||
        typeof result === "function") {
      result = result.toString();
    } else if (result instanceof Map) {
      let text = `Map(${result.size}) `;
      text += JSON.stringify(mapToObj(result), null, 2);
      result = text;
    } else if (typeof result === "object") {
      result = JSON.stringify(result, null, 2);
    } else if (typeof result === "undefined") {
      result = "undefined";
    }
    response.reply(result);
  }

  // wrap user code in an async IIFE so we can await if needed
  const userCode = `
    (async () => {
      try {
        const __result = ${args.join(" ")};
        out(__result);
      } catch (err) {
        console.error("Eval error:", err);
        response.reply(\`Error:\\n\${err.stack || err.message}\`);
      }
    })();
  `;

  try {
    // eslint-disable-next-line no-eval
    eval(userCode);
  } catch (err) {
    console.error("Eval invocation error:", err);
    await response.reply(`❌ Failed to evaluate code: ${err.message}`);
  }
}
