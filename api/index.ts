const { Telegraf } = require('telegraf');

const bot = new Telegraf(process.env.BOT_TOKEN);
let photoBatch = {};

bot.start((ctx) => {
  photoBatch[ctx.chat.id] = [];
  ctx.reply('📸 Отправьте 5-10 фото для нейрофотосессии!');
});

bot.on('photo', async (ctx) => {
  const chatId = ctx.chat.id;
  if (!photoBatch[chatId]) photoBatch[chatId] = [];

  const fileId = ctx.message.photo[ctx.message.photo.length - 1].file_id;
  photoBatch[chatId].push(fileId);
  const count = photoBatch[chatId].length;

  if (count < 5) {
    ctx.reply(`📷 Получено ${count} фото. Нужно ещё ${5 - count}!`);
    return;
  }

  if (count >= 5 && count <= 10) {
    await ctx.reply('🎨 Генерирую...');

    try {
      const res = await fetch("https://fal.run/fal-ai/flux/schnell", {
        method: "POST",
        headers: {
          "Authorization": `Key ${process.env.FAL_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          prompt: `Professional AI photoshoot, ${count} diverse models, studio lighting, fashion`,
          image_size: "square_hd",
          num_images: 5
        })
      });

      if (!res.ok) throw new Error(`Fal.ai error: ${res.status}`);

      const data = await res.json();
      const images = data.images.map(i => i.url);

      for (const url of images) {
        await ctx.replyWithPhoto({ url });
      }
      ctx.reply('🖼️ Готово!');

      delete photoBatch[chatId];
    } catch (err) {
      ctx.reply('❌ Ошибка генерации.');
    }
  }
});

module.exports = (req, res) => {
  bot.handleUpdate(req.body).then(() => res.status(200).end());
};
