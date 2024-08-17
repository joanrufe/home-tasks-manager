export interface Workout {
    Etiquetas: Etiquetas;
    Link: Link;
    Repeticiones: Repeticiones;
    Videos: Videos;
    Nombre: Nombre;
  }
  
  interface Etiquetas {
    id: string;
    type: string;
    multi_select: MultiSelect[];
  }
  
  interface MultiSelect {
    id: string;
    name: string;
    color: string;
  }
  
  interface Link {
    id: string;
    type: string;
    rich_text: RichText[];
  }
  
  interface RichText {
    type: string;
    text: Text;
    plain_text: string;
    href: null | string;
  }
  
  interface Text {
    content: string;
    link: External | null;
  }
  
  interface External {
    url: string;
  }
  
  interface Nombre {
    id: string;
    type: string;
    title: RichText[];
  }
  
  interface Repeticiones {
    id: string;
    type: string;
    rich_text: RichText[];
  }
  
  interface Videos {
    id: string;
    type: string;
    files: File[];
  }
  
  interface File {
    name: string;
    type: string;
    external: External;
  }
  