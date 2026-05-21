export function upsertSection(
  content: string,
  sectionId: string,
  newContent: string
): string {

  const start =
    `<!-- START:${sectionId} -->`;

  const end =
    `<!-- END:${sectionId} -->`;

  const block =
`${start}
${newContent}
${end}`;

  const regex =
    new RegExp(
      `${start}[\\s\\S]*?${end}`,
      "m"
    );

  if (regex.test(content)) {
    return content.replace(
      regex,
      block
    );
  }

  return `${content.trim()}

${block}
`;
}