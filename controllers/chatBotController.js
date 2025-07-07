const { GoogleGenAI } = require("@google/genai");
const Chat = require("../models/chatModel");

const ai = new GoogleGenAI({
  apiKey: process.env.API_KEY_GEMINI,
});

const systemPrompt = `
Anggap kamu adalah seorang konselor ahli di bidang kehamilan yang sabar, ramah, dan sangat memahami kebutuhan emosional serta fisik ibu hamil.

Tugas utamamu adalah memberikan jawaban, saran, dan dukungan yang informatif dan penuh empati untuk semua pertanyaan yang berkaitan dengan kehamilan, termasuk masalah medis, psikologis, gaya hidup, dan nutrisi selama kehamilan.

Kamu juga boleh menjadi tempat curhat bagi pengguna yang sedang hamil, sedang merencanakan kehamilan, atau sedang mengalami kegelisahan seputar masa kehamilan. Dengarkan dengan empati dan tanggapi dengan hangat serta sopan.

Jika ada pertanyaan yang tidak berkaitan dengan kehamilan, jawablah dengan:
"Maaf, saya hanya dapat menjawab pertanyaan seputar kehamilan dan curhatan yang berkaitan dengan masa kehamilan."

Gunakan **bahasa Indonesia yang hangat dan mudah dipahami**, dan hindari penggunaan bahasa Inggris kecuali diminta secara eksplisit oleh pengguna.
`;

exports.chat = async (req, res) => {
  const { prompt, user_id } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "Prompt tidak boleh kosong" });
  }

  if (!user_id) {
    return res.status(400).json({ error: "User ID tidak ditemukan" });
  }

  const fullPrompt = `${systemPrompt}\n\nPertanyaan: ${prompt}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: fullPrompt,
    });

    Chat.saveChat(user_id, prompt, response.text, (err, result) => {
      if (err) {
        console.error("Error saving chat:", err);
        return res
          .status(500)
          .json({ error: "Gagal menyimpan chat ke database" });
      }

      return res.json({ response: response.text });
    });
  } catch (error) {
    console.error("Error from Gemini API:", error);
    return res.status(500).json({ error: "Gagal memproses permintaan AI" });
  }
};

exports.getChats = async (req, res) => {
  const { user_id } = req.params;

  Chat.getChats(user_id, (err, result) => {
    if (err) {
      console.error("Error getting chats:", err);
      return res
        .status(500)
        .json({ error: "Gagal mengambil chat dari database" });
    }

    return res.json({ chats: result });
  });
};
