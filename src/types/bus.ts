export interface Bus {
    id: number;            // Si tu API lo expone; si no, quita este campo
    marca: string;
    matricula: string | null;
    cant_asientos: number;
    activo: boolean;
  }