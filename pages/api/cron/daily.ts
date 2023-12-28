import { NotionService } from "services/notion";
import { TelegramService } from "services/telegram";

export const config = {
  runtime: "edge",
};

export default async function handler() {
  try {
    const notion = new NotionService();
    const telegram = new TelegramService();

    if (!process.env.NOTION_DB_ID)
      return new Response("No database id", { status: 400 });
    const data = await notion.getTodaysTasks(process.env.NOTION_DB_ID);
    const messages = data.map((i) => i.title).join("\n");
    const response = await telegram.sendMessage(encodeURIComponent(messages));
    console.log(response);
    return new Response("OK", { status: 200 });
  } catch (error) {
    return new Response(`Error: ${error}`, { status: 500 });
  }
}
