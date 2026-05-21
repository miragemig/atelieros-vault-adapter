import { decideNextAction } from "./actionEngine";

const action = decideNextAction({
  processo: "Moradia_Boavista",
  cliente: "João_Silva",
  riscoContratual: true,
  afectaHonorarios: true,
  prioridade: "critica",
  prazoDias: 4,
  blocker: false,
});

console.log(action);