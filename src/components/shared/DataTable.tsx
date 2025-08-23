import * as React from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchableColumnIds?: string[]; // if not provided: global search over all columns
  searchPlaceholder?: string;
  className?: string;
  filterableColumns?: {
    [key: string]: {
      label: string;
      options: Array<{ label: string; value: string }>;
    };
  };
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchableColumnIds,
  searchPlaceholder = "חיפוש...",
  className,
  filterableColumns,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [columnFilters, setColumnFilters] = React.useState({} as Record<string, string>);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      globalFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, columnId, value, addMeta) => {
      // Apply column filters first
      const columnFilterValues = Object.values(columnFilters).filter(Boolean);
      if (columnFilterValues.length > 0) {
        const ministryFilter = columnFilters['ministry'];
        const departmentFilter = columnFilters['department_slug'];
        
        let passesFilters = true;
        
        if (ministryFilter && ministryFilter !== 'all') {
          const rowValue = row.getValue('ministry') as string;
          passesFilters = passesFilters && rowValue === ministryFilter;
        }
        
        if (departmentFilter && departmentFilter !== 'all') {
          const rowValue = row.getValue('department_slug') as string;
          passesFilters = passesFilters && rowValue === departmentFilter;
        }
        
        if (!passesFilters) return false;
      }
      
      // Then apply global search
      if (!value) return true;
      
      if (searchableColumnIds && searchableColumnIds.length > 0) {
        return searchableColumnIds.some(id => {
          const cellValue = row.getValue(id);
          return String(cellValue).toLowerCase().includes(String(value).toLowerCase());
        });
      }
      
      // Global search across all columns
      return Object.values(row.getAllCells()).some(cell => {
        const cellValue = cell.getValue();
        return String(cellValue).toLowerCase().includes(String(value).toLowerCase());
      });
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  // Handle column filters
  const handleColumnFilterChange = (columnId: string, value: string) => {
    setColumnFilters(prev => ({
      ...prev,
      [columnId]: value
    }));
    // Trigger global filter to reprocess
    table.setGlobalFilter(globalFilter || ' ');
    table.setGlobalFilter(globalFilter);
  };

  return (
    <div className={cn("space-y-3", className)} dir="rtl">
      <div className="flex items-center gap-2 flex-wrap">
        <Input
          placeholder={searchPlaceholder}
          value={globalFilter ?? ""}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-[240px]"
        />
        
        {/* Column Filters */}
        {filterableColumns && Object.entries(filterableColumns).map(([columnId, config]) => (
          <Select
            key={columnId}
            value={columnFilters[columnId] || 'all'}
            onValueChange={(value) => handleColumnFilterChange(columnId, value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={config.label} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">כל {config.label}</SelectItem>
              {config.options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            «
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            הקודם
          </Button>
          <span className="text-sm text-muted-foreground">
            עמוד {table.getState().pagination.pageIndex + 1} מתוך {table.getPageCount()}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            הבא
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            »
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const sort = header.column.getIsSorted();
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder ? null : (
                        <button
                          className={cn(
                            "inline-flex items-center gap-1 select-none",
                            canSort ? "cursor-pointer" : "cursor-default"
                          )}
                          onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                          aria-label="מיון"
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {sort === "asc" && <span>▲</span>}
                          {sort === "desc" && <span>▼</span>}
                        </button>
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  לא נמצאו תוצאות
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
