const express = require("express");
const router = express.Router();
const chatBotController = require("../controllers/chatBotController.js");

router.post("/generate", chatBotController.chat);
router.get("/chats/:user_id", chatBotController.getChats);

module.exports = router;
