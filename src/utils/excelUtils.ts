export interface ExcelColumn {
  key: string;
  label: string;
  type?: 'text' | 'number' | 'currency' | 'date';
}

export interface ExcelSection {
  title: string;
  columns: ExcelColumn[];
  rows: Record<string, string | number | null | undefined>[];
}

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const getCellClass = (type?: ExcelColumn['type']) => {
  switch (type) {
    case 'number':
    case 'currency':
      return 'num';
    case 'date':
      return 'date';
    default:
      return 'text';
  }
};

export const downloadStyledExcel = ({
  filename,
  workbookTitle,
  sections,
}: {
  filename: string;
  workbookTitle: string;
  sections: ExcelSection[];
}) => {
  const sectionMarkup = sections
    .map((section) => {
      const headers = section.columns
        .map((column) => `<th>${escapeHtml(column.label)}</th>`)
        .join('');

      const rows = section.rows
        .map((row) => {
          const cells = section.columns
            .map((column) => {
              const rawValue = row[column.key];
              const value = rawValue === null || rawValue === undefined ? '' : String(rawValue);
              return `<td class="${getCellClass(column.type)}">${escapeHtml(value)}</td>`;
            })
            .join('');
          return `<tr>${cells}</tr>`;
        })
        .join('');

      return `
        <h2>${escapeHtml(section.title)}</h2>
        <table>
          <thead>
            <tr>${headers}</tr>
          </thead>
          <tbody>
            ${rows || `<tr><td colspan="${section.columns.length}" class="empty">No records found</td></tr>`}
          </tbody>
        </table>
      `;
    })
    .join('<div class="spacer"></div>');

  const html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="UTF-8" />
        <style>
          body { font-family: Arial, sans-serif; margin: 18px; color: #111827; }
          h1 { margin: 0 0 16px; color: #0f766e; font-size: 24px; }
          h2 { margin: 20px 0 8px; color: #1f2937; font-size: 16px; }
          table { border-collapse: collapse; width: 100%; table-layout: auto; }
          th, td { border: 1px solid #d1d5db; padding: 8px 10px; font-size: 12px; }
          th { background: #0f766e; color: #ffffff; font-weight: 700; text-align: left; }
          tr:nth-child(even) td { background: #f9fafb; }
          td.num { text-align: right; }
          td.date { white-space: nowrap; }
          td.empty { text-align: center; color: #6b7280; font-style: italic; }
          .spacer { height: 12px; }
        </style>
      </head>
      <body>
        <h1>${escapeHtml(workbookTitle)}</h1>
        ${sectionMarkup}
      </body>
    </html>
  `;

  const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.href = url;
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.xls`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
