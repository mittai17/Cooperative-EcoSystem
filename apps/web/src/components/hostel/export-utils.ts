/**
 * Generic helper to export tabular data to a CSV file and trigger browser download
 */
export function exportToCSV<T extends Record<string, any>>(
  data: T[],
  filename: string,
  columns?: { key: keyof T; header: string }[]
) {
  if (!data || data.length === 0) {
    alert("No data available to export.");
    return;
  }

  const headers = columns
    ? columns.map((c) => `"${c.header.replace(/"/g, '""')}"`)
    : Object.keys(data[0]).map((k) => `"${k}"`);

  const rows = data.map((item) => {
    if (columns) {
      return columns
        .map((c) => {
          const val = item[c.key];
          const str = val === undefined || val === null ? "" : String(val);
          return `"${str.replace(/"/g, '""')}"`;
        })
        .join(",");
    }
    return Object.values(item)
      .map((val) => {
        const str = val === undefined || val === null ? "" : String(val);
        return `"${str.replace(/"/g, '""')}"`;
      })
      .join(",");
  });

  const csvContent = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}_${new Date().toISOString().split("T")[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
