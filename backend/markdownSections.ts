export function replaceSection(
  content: string,
  sectionTitle: string,
  newSection: string
): string {
  const marker = `# ${sectionTitle}`;
  const start = content.indexOf(marker);

  if (start === -1) {
    return `${content.trim()}\n\n---\n\n${newSection.trim()}\n`;
  }

  const nextSection = content.indexOf("\n---\n\n# ", start + marker.length);

  if (nextSection === -1) {
    return `${content.slice(0, start).trim()}\n\n---\n\n${newSection.trim()}\n`;
  }

  return `${content.slice(0, start).trim()}\n\n---\n\n${newSection.trim()}\n\n${content.slice(nextSection).trim()}\n`;
}