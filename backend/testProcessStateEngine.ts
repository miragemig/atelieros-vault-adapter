import { evaluateProcessState } from "./processStateEngine";

const state = evaluateProcessState({
  blockers: ["Pedido de alteração extra sem validação contratual"],
  prazoDias: 4,
  aguardaCliente: false,
  aguardaCamara: false,
  aguardaEspecialidade: false,
  documentosEmFalta: 0,
  documentosPorValidar: 2,
});

console.log(state);