// import { NotionService } from "services/notion";
// import { TelegramService } from "services/telegram";

import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  _req: NextApiRequest,
  res: NextApiResponse
) {
  console.log("Daily cron job is disabled");
  // The Node.js runtime keeps the request open until the response is sent;
  // unlike the Edge runtime, it will hang (and 504) if nothing is returned.
  res.status(200).json({ message: "Daily cron job is disabled" });
  // try {
  //   const notion = new NotionService();
  //   const telegram = new TelegramService();
  //
  //   if (!process.env.NOTION_DB_TASKS_ID)
  //     return new Response("No database id", { status: 400 });
  //   const data = await notion.getTodaysTasks();
  //   const messages = data
  //     .map((i, idx) => `${idx + 1}. ${i.title} -> ${i.assignedTo}`)
  //     .join("\n");
  //   const response = await telegram.sendMessage(encodeURIComponent(messages));
  //   console.log(response);
  //   return new Response("OK", { status: 200 });
  // } catch (error) {
  //   return new Response(`Error: ${error}`, { status: 500 });
  // }
}
