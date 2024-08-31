import telegram
from dotenv import load_dotenv
import os


class TelegramBotController:
    def __init__(self):
        load_dotenv()
        self.bot = telegram.Bot(token=os.getenv("TELEGRAM_BOT_TOKEN"))
        self.chat_ids = os.getenv("TELEGRAM_RECEIVERS").split(",")

    async def send_message(self, message):
        for chat_id in self.chat_ids:
            await self.bot.send_message(chat_id=chat_id, text=message)
