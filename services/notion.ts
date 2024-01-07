// Create service for notion
import { Client } from "@notionhq/client";
import { TareaCasa } from "models/TareaCasa";
import dayjs from "dayjs";

class NotionService {
  private client: Client;
  constructor(
    client: Client = new Client({
      auth: process.env.NOTION_TOKEN,
    })
  ) {
    this.client = client;
  }

  async getDatabase(databaseId: string) {
    const response = await this.client.databases.retrieve({
      database_id: databaseId,
    });
    return response;
  }

  async queryDatabase(databaseId: string) {
    const response = await this.client.databases.query({
      database_id: databaseId,
    });
    return response.results.map((e: any) => e.properties) as TareaCasa[];
  }

  async getTodaysTasks(databaseId: string) {
    const data = await this.queryDatabase(databaseId);
    const today = new Date();
    const mappedData = data.map((i) => ({
      startDate: i.Date.date?.start,
      title: i.Name.title[0].plain_text,
      recurrence: i.Recurrencia.select?.name,
      assignedTo: i.Asignado.select?.name,
    }));

    const withStartDate = mappedData.filter((i) => i.startDate);

    const noStartDate = mappedData.filter((i) => !i.startDate);
    console.log(`There are ${noStartDate.length} tasks without start date`);

    const recurrenceValues: {
      [key: string]: number;
    } = {
      Diario: 1,
      Cada5Dias: 5,
      "Bi-Semanal": 14,
      Semanal: 7,
      Mensual: 30,
    };
    const isRecurrenceDue = (startDate: string, recurrence: string) => {
      const daysRecurrence = recurrenceValues[recurrence];
      const daysSinceStart = dayjs(today).diff(startDate, "day");

      if (recurrence === "Diario") {
        return true;
      }
      if (recurrence === "Semanal") {
        return;
      }
      if (recurrence === "Mensual") {
        return daysSinceStart % daysRecurrence === 0;
      }
      if (recurrence === "Cada5Dias") {
        return daysSinceStart % daysRecurrence === 0;
      }
    };

    const filteredByRecurrence = withStartDate.filter((i) => {
      return isRecurrenceDue(i.startDate as string, i.recurrence as string);
    });
    return filteredByRecurrence;
  }
}

export { NotionService };
