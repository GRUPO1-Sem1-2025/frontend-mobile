export interface Trip {
    viajeId: number;
    cantAsientosDisponibles: number;
    horaInicio: string;    // Formato "HH:mm:ss"
    horaFin: string;       // Formato "HH:mm:ss"
    precioPasaje: number;
    busId: number;
  }