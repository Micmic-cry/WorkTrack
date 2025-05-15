import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, ArrowUp, ArrowDown, Search, X } from "lucide-react";
import { truncateText } from "@/lib/utils";

export type SortDirection = "asc" | "desc" | undefined;

export interface Column<T> {
  key: keyof T | string;
  header: string;
  cell?: (row: T) => React.ReactNode;
  isSortable?: boolean;
  isSearchable?: boolean;
}

interface SortableTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
  rowClassName?: (row: T) => string;
  emptyMessage?: string;
  isLoading?: boolean;
  tableClassName?: string;
  defaultSortKey?: keyof T | string;
  defaultSortDirection?: SortDirection;
  searchPlaceholder?: string;
}

export function SortableTable<T>({
  columns,
  data,
  onRowClick,
  rowClassName,
  emptyMessage = "No data available",
  isLoading = false,
  tableClassName = "",
  defaultSortKey,
  defaultSortDirection = "asc",
  searchPlaceholder = "Search..."
}: SortableTableProps<T>) {
  const [sortColumn, setSortColumn] = useState<keyof T | string | undefined>(defaultSortKey);
  const [sortDirection, setSortDirection] = useState<SortDirection>(defaultSortDirection);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});

  // Handle column header click for sorting
  const handleSort = (column: Column<T>) => {
    if (!column.isSortable) return;

    if (sortColumn === column.key) {
      // Cycle through: asc -> desc -> undefined
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else if (sortDirection === "desc") {
        setSortDirection(undefined);
        setSortColumn(undefined);
      } else {
        setSortDirection("asc");
      }
    } else {
      setSortColumn(column.key);
      setSortDirection("asc");
    }
  };

  // Handle column filter change
  const handleFilterChange = (key: string, value: string) => {
    setColumnFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Handle global search query change
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  // Clear search
  const clearSearch = () => {
    setSearchQuery("");
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSearchQuery("");
    setColumnFilters({});
  };

  // Filter data based on column filters and search query
  const filteredData = data.filter((row) => {
    // First apply column-specific filters
    const passesColumnFilters = Object.entries(columnFilters).every(([key, filterValue]) => {
      if (!filterValue) return true;
      
      const columnValue = String((row as any)[key] || "").toLowerCase();
      return columnValue.includes(filterValue.toLowerCase());
    });

    if (!passesColumnFilters) return false;
    
    // Then apply global search if present
    if (!searchQuery) return true;
    
    // Search across all searchable columns
    return columns.some((column) => {
      if (!column.isSearchable) return false;
      
      const cellValue = String((row as any)[column.key] || "").toLowerCase();
      return cellValue.includes(searchQuery.toLowerCase());
    });
  });

  // Sort the filtered data if a sort column is specified
  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortColumn || !sortDirection) return 0;
    
    const aValue: any = (a as any)[sortColumn];
    const bValue: any = (b as any)[sortColumn];
    
    // Handle null/undefined values
    if (aValue == null && bValue == null) return 0;
    if (aValue == null) return sortDirection === "asc" ? -1 : 1;
    if (bValue == null) return sortDirection === "asc" ? 1 : -1;
    
    // Handle different types of values
    if (typeof aValue === "string" && typeof bValue === "string") {
      return sortDirection === "asc" 
        ? aValue.localeCompare(bValue) 
        : bValue.localeCompare(aValue);
    }
    
    if (typeof aValue === "number" && typeof bValue === "number") {
      return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
    }
    
    if (aValue instanceof Date && bValue instanceof Date) {
      return sortDirection === "asc" 
        ? aValue.getTime() - bValue.getTime() 
        : bValue.getTime() - aValue.getTime();
    }
    
    // Default string comparison for other types
    return sortDirection === "asc" 
      ? String(aValue).localeCompare(String(bValue)) 
      : String(bValue).localeCompare(String(aValue));
  });

  // Get search/filter status
  const isFiltering = searchQuery || Object.values(columnFilters).some(Boolean);
  const hasSearchableColumns = columns.some(col => col.isSearchable);
  
  return (
    <div className="w-full space-y-4">
      {/* Search and filter controls */}
      {hasSearchableColumns && (
        <div className="flex flex-col sm:flex-row gap-2 items-center mb-4">
          <div className="relative w-full sm:w-64">
            <Input
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={handleSearchChange}
              className="pl-8"
            />
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            {searchQuery && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="absolute right-1 top-1.5 h-7 w-7 p-0" 
                onClick={clearSearch}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          {isFiltering && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={clearAllFilters}
              className="whitespace-nowrap"
            >
              Clear filters
            </Button>
          )}
          
          <div className="text-sm text-muted-foreground ml-auto">
            {isLoading ? (
              <span>Loading...</span>
            ) : (
              <span>
                {sortedData.length} of {data.length} rows
                {isFiltering ? " (filtered)" : ""}
              </span>
            )}
          </div>
        </div>
      )}
      
      {/* Table */}
      <div className="rounded-md border overflow-hidden">
        <Table className={tableClassName}>
          <TableHeader>
            <TableRow className="bg-muted/50">
              {columns.map((column, idx) => (
                <TableHead 
                  key={idx} 
                  className={column.isSortable ? "cursor-pointer select-none" : ""}
                  onClick={() => handleSort(column)}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.header}</span>
                    {column.isSortable && (
                      <span className="flex items-center">
                        {sortColumn === column.key ? (
                          sortDirection === "asc" ? (
                            <ArrowUp className="h-4 w-4 ml-1" />
                          ) : sortDirection === "desc" ? (
                            <ArrowDown className="h-4 w-4 ml-1" />
                          ) : (
                            <ArrowUpDown className="h-4 w-4 ml-1 opacity-50" />
                          )
                        ) : (
                          <ArrowUpDown className="h-4 w-4 ml-1 opacity-50" />
                        )}
                      </span>
                    )}
                  </div>
                  
                  {/* Column filter */}
                  {column.isSearchable && (
                    <div className="mt-2">
                      <Input
                        placeholder={`Filter ${column.header.toLowerCase()}`}
                        size={15}
                        value={columnFilters[column.key as string] || ""}
                        onChange={(e) => handleFilterChange(column.key as string, e.target.value)}
                        onClick={(e) => e.stopPropagation()} // Prevent sorting when clicking on input
                        className="h-7 px-2 text-xs"
                      />
                    </div>
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-52 text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : sortedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-52 text-center">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              sortedData.map((row, rowIndex) => (
                <TableRow
                  key={rowIndex}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={`${onRowClick ? "cursor-pointer hover:bg-muted/50" : ""} ${
                    rowClassName ? rowClassName(row) : ""
                  }`}
                >
                  {columns.map((column, colIndex) => (
                    <TableCell key={colIndex}>
                      {column.cell ? (
                        <>{column.cell(row)}</>
                      ) : (
                        <span className="truncate">
                          {truncateText(String((row as any)[column.key] || ""), 50)}
                        </span>
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}