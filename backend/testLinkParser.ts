import { normalizeWikiLinks } from "./linkParser";

const input = `
[[Moradia Boavista]]
[[João Silva]]
[[Alterações de Cliente]]
[[Scope Guard]]
Texto normal com Moradia Boavista não deve ser alterado.
`;

console.log(normalizeWikiLinks(input));