function getApprovalCommand(): string {
  const command = process.argv.slice(2).join(" ").trim();

  if (!command) {
    throw new Error('Usage: npx tsx founder-command-center\\chat\\zeusApprovalRouter.ts "APPROVE_PROJECT website-arquimla"');
  }

  return command;
}

function handleApproval(command: string) {
  const projectMatch = command.match(/^APPROVE_PROJECT\s+([a-zA-Z0-9-_]+)$/);

  if (projectMatch) {
    const projectId = projectMatch[1];

    console.log("ZEUS");
    console.log("");
    console.log("Aprovação recebida, mas execução bloqueada.");
    console.log(`Projeto solicitado: ${projectId}`);
    console.log("");
    console.log("Modo atual: DELIBERATION_ONLY");
    console.log("");
    console.log("Nenhum ficheiro foi criado.");
    console.log("");
    console.log("Motivo:");
    console.log("O Miguel decidiu não criar projetos agora. O ZEUS deve deliberar, propor e aguardar instrução explícita futura para execução.");
    console.log("");
    console.log("Próxima ação recomendada:");
    console.log("Continuar a melhorar a camada conversacional ZEUS/Olympus antes de voltar à criação de projetos.");
    return;
  }

  throw new Error("Unsupported approval command. Expected: APPROVE_PROJECT <project-id>");
}

handleApproval(getApprovalCommand());
