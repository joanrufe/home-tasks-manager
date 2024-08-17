// Create service for notion
import { Client } from "@notionhq/client";
import { TareaCasa } from "models/TareaCasa";
import dayjs from "dayjs";
import { Workout } from "models/Workouts";

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

  async queryDatabase<T extends object>(databaseId: string) {
    const response = await this.client.databases.query({
      database_id: databaseId,
    });
    return response.results.map((e: any) => e.properties) as T[];
  }

  async getWorkouts() {
    const response = await this.queryDatabase<Workout>(
      process.env.NOTION_DB_WORKOUTS_ID as string
    );
    const mappedData = response.map((i) => ({
      name: i.Nombre.title[0].plain_text,
      tags: i.Etiquetas.multi_select.map((t) => t.name),
      link: i.Link.rich_text[0].plain_text,
      videos: i.Videos.files
        .map((v) => v.name)
        .map((url) => url.replace(/#.*$/, "")),
    }));
    return mappedData;
  }

  async getTodaysTasks() {
    const data = await this.queryDatabase<TareaCasa>(
      process.env.NOTION_DB_TASKS_ID as string
    );
    const today = new Date();
    const mappedData = data.map((i) => ({
      startDate: i.Date.date?.start,
      title: i.Name.title[0].plain_text,
      recurrence: i.Recurrencia.select?.name,
      assignedTo: i.Asignado.select?.name || "Sin asignar",
    }));

    const withStartDate = mappedData.filter((i) => i.startDate);

    const noStartDate = mappedData.filter((i) => !i.startDate);
    console.log(`There are ${noStartDate.length} tasks without start date`);

    const recurrenceValues: {
      [key: string]: number;
    } = {
      Diario: 1,
      Cada2Dias: 2,
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
        return daysSinceStart % daysRecurrence === 0;
      }
      if (recurrence === "Mensual") {
        return daysSinceStart % daysRecurrence === 0;
      }
      if (recurrence === "Cada5Dias") {
        return daysSinceStart % daysRecurrence === 0;
      }
      if (recurrence === "Cada2Dias") {
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
