export interface TareaCasa {
  Asignado: {
    id: string;
    type: string;
    select: {
      id: string;
      name?: string;
    };
  };
  Recurrencia: {
    id: string;
    type: string;
    select: { id: string; name?: string };
  };
  Date: {
    id: string;
    type: string;
    date: { start?: string; end?: string; time_zone?: string };
  };
  Estado: {
    id: string;
    type: string;
    status: {
      id: string;
      name?: string;
    };
  };
  Name: {
    id: "title";
    type: "title";
    title: {
      type: string;
      text: {};
      annotations: {};
      plain_text?: string;
      href?: string;
    }[];
  };
}
