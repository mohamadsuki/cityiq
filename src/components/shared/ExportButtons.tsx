import * as React from "react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import { Button } from "@/components/ui/button";

interface ExportButtonsProps<T> {
  data: T[];
  fileBaseName?: string;
  className?: string;
}

export function ExportButtons<T>({ data, fileBaseName = "export", className }: ExportButtonsProps<T>) {
  const onExcel = React.useCallback(() => {
    const worksheet = XLSX.utils.json_to_sheet(data as any[]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
    XLSX.writeFile(workbook, `${fileBaseName}.xlsx`);
  }, [data, fileBaseName]);

  const onPdf = React.useCallback(() => {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const margin = 40;
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFontSize(14);
    doc.text(`${fileBaseName}`, margin, margin);
    doc.setFontSize(10);

    const lines = JSON.stringify(data, null, 2).split("\n");
    let y = margin + 24;
    const maxWidth = pageWidth - margin * 2;
    lines.forEach((line) => {
      const splitted = doc.splitTextToSize(line, maxWidth);
      doc.text(splitted, margin, y);
      y += splitted.length * 12;
      if (y > doc.internal.pageSize.getHeight() - margin) {
        doc.addPage();
        y = margin;
      }
    });

    doc.save(`${fileBaseName}.pdf`);
  }, [data, fileBaseName]);

  return (
    <div className={className} dir="rtl">
      <div className="flex items-center gap-2">
        <Button variant="secondary" onClick={onExcel} aria-label="ייצוא לאקסל">
          ייצוא Excel
        </Button>
        <Button variant="outline" onClick={onPdf} aria-label="ייצוא ל-PDF">
          ייצוא PDF
        </Button>
      </div>
    </div>
  );
}
