class TelegramService {
  private token: string;
  private chatId: string;

  constructor(
    token = process.env.TELEGRAM_TOKEN,
    chatId = process.env.TELEGRAM_CHAT_ID
  ) {
    if (!token) throw new Error("No token provided");
    if (!chatId) throw new Error("No chat id provided");
    this.token = token;
    this.chatId = chatId;
  }

  async sendMessage(message: string) {
    const url = this.urlBuilder(this.chatId, message);
    const response = await fetch(url);
    const data = await response.json();
    return data;
  }
  private urlBuilder(chatId: string, message: string) {
    return `https://api.telegram.org/bot${this.token}/sendMessage?chat_id=${chatId}&text=${message}`;
  }
}

export { TelegramService };
