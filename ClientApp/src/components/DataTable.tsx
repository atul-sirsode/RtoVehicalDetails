import { useState, useMemo, useCallback } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  ColumnDef,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
  RowSelectionState,
} from '@tanstack/react-table';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  GripVertical,
  Search,
  Download,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Settings2,
  Filter,
} from 'lucide-react';
import { RCTableRow, TABLE_COLUMNS, TableColumnKey } from '@/types/rc-verification';
import { exportToCSV, exportSelectedToCSV } from '@/lib/csv-export';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface DataTableProps {
  data: RCTableRow[];
}

// Sortable header cell component
function SortableHeader({ column, children }: { column: { id: string }; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: column.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="flex items-center gap-1 cursor-grab active:cursor-grabbing"
    >
      <GripVertical className="w-3 h-3 text-muted-foreground" />
      {children}
    </div>
  );
}

// Status badge component
function StatusBadge({ status }: { status: RCTableRow['status'] }) {
  const config = {
    pending: { icon: Clock, className: 'bg-muted text-muted-foreground', label: 'Pending' },
    processing: { icon: Loader2, className: 'bg-info/10 text-info', label: 'Processing' },
    success: { icon: CheckCircle2, className: 'bg-success/10 text-success', label: 'Verified' },
    error: { icon: XCircle, className: 'bg-destructive/10 text-destructive', label: 'Error' },
  };

  const { icon: Icon, className, label } = config[status];

  return (
    <Badge variant="outline" className={cn('gap-1', className)}>
      <Icon className={cn('w-3 h-3', status === 'processing' && 'animate-spin')} />
      {label}
    </Badge>
  );
}

export function DataTable({ data }: DataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [globalFilter, setGlobalFilter] = useState('');
  const [columnOrder, setColumnOrder] = useState<string[]>(() =>
    ['select', ...TABLE_COLUMNS.map(col => col.key)]
  );

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const columns = useMemo<ColumnDef<RCTableRow>[]>(() => {
    const baseColumns: ColumnDef<RCTableRow>[] = [
      {
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        ),
        enableSorting: false,
        enableHiding: false,
        size: 40,
      },
    ];

    TABLE_COLUMNS.forEach(col => {
      if (col.key === 'status') {
        baseColumns.push({
          accessorKey: col.key,
          header: ({ column }) => (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="h-8 px-2 text-xs font-semibold"
            >
              {col.label}
              {column.getIsSorted() === 'asc' ? (
                <ArrowUp className="ml-1 h-3 w-3" />
              ) : column.getIsSorted() === 'desc' ? (
                <ArrowDown className="ml-1 h-3 w-3" />
              ) : (
                <ArrowUpDown className="ml-1 h-3 w-3 opacity-50" />
              )}
            </Button>
          ),
          cell: ({ row }) => <StatusBadge status={row.getValue('status')} />,
        });
      } else if (col.key === 'financed') {
        baseColumns.push({
          accessorKey: col.key,
          header: ({ column }) => (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="h-8 px-2 text-xs font-semibold"
            >
              {col.label}
              {column.getIsSorted() === 'asc' ? (
                <ArrowUp className="ml-1 h-3 w-3" />
              ) : column.getIsSorted() === 'desc' ? (
                <ArrowDown className="ml-1 h-3 w-3" />
              ) : (
                <ArrowUpDown className="ml-1 h-3 w-3 opacity-50" />
              )}
            </Button>
          ),
          cell: ({ row }) => (
            <Badge variant={row.getValue('financed') ? 'default' : 'secondary'}>
              {row.getValue('financed') ? 'Yes' : 'No'}
            </Badge>
          ),
        });
      } else if (col.key === 'rc_status') {
        baseColumns.push({
          accessorKey: col.key,
          header: ({ column }) => (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="h-8 px-2 text-xs font-semibold"
            >
              {col.label}
              {column.getIsSorted() === 'asc' ? (
                <ArrowUp className="ml-1 h-3 w-3" />
              ) : column.getIsSorted() === 'desc' ? (
                <ArrowDown className="ml-1 h-3 w-3" />
              ) : (
                <ArrowUpDown className="ml-1 h-3 w-3 opacity-50" />
              )}
            </Button>
          ),
          cell: ({ row }) => {
            const status = row.getValue('rc_status') as string;
            return (
              <Badge
                variant="outline"
                className={cn(
                  status === 'ACTIVE' && 'bg-success/10 text-success border-success/30',
                  status === 'INACTIVE' && 'bg-destructive/10 text-destructive border-destructive/30'
                )}
              >
                {status || '-'}
              </Badge>
            );
          },
        });
      } else {
        baseColumns.push({
          accessorKey: col.key,
          header: ({ column }) => (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="h-8 px-2 text-xs font-semibold whitespace-nowrap"
            >
              {col.label}
              {column.getIsSorted() === 'asc' ? (
                <ArrowUp className="ml-1 h-3 w-3" />
              ) : column.getIsSorted() === 'desc' ? (
                <ArrowDown className="ml-1 h-3 w-3" />
              ) : (
                <ArrowUpDown className="ml-1 h-3 w-3 opacity-50" />
              )}
            </Button>
          ),
          cell: ({ row }) => {
            const value = row.getValue(col.key as TableColumnKey) as string;
            return (
              <span className="text-sm whitespace-nowrap">
                {value || '-'}
              </span>
            );
          },
        });
      }
    });

    return baseColumns;
  }, []);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
      columnOrder,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    onColumnOrderChange: setColumnOrder,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    enableRowSelection: true,
  });

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setColumnOrder((items) => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over.id as string);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }, []);

  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const visibleColumnKeys = Object.entries(columnVisibility)
    .filter(([, visible]) => visible !== false)
    .map(([key]) => key);

  const handleExportAll = () => {
    exportToCSV(data, 'rc-verification-all', visibleColumnKeys.length > 0 ? visibleColumnKeys : undefined);
  };

  const handleExportSelected = () => {
    if (selectedRows.length === 0) return;
    const selectedIds = selectedRows.map(row => row.original.id);
    exportSelectedToCSV(data, selectedIds, visibleColumnKeys.length > 0 ? visibleColumnKeys : undefined);
  };

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
          <Search className="w-8 h-8 text-muted-foreground" />
        </div>
        <p className="text-lg font-medium text-foreground">No data yet</p>
        <p className="text-sm text-muted-foreground mt-1">
          Upload a CSV or Excel file to get started
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search all columns..."
              value={globalFilter ?? ''}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Column filter popover */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon">
                <Filter className="w-4 h-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="start">
              <div className="space-y-4">
                <h4 className="font-medium text-sm">Filter by column</h4>
                <div className="space-y-2">
                  {table.getAllColumns()
                    .filter(col => col.getCanFilter())
                    .slice(0, 5)
                    .map(column => (
                      <div key={column.id} className="flex flex-col gap-1">
                        <label className="text-xs text-muted-foreground capitalize">
                          {column.id.replace(/_/g, ' ')}
                        </label>
                        <Input
                          placeholder={`Filter ${column.id}...`}
                          value={(column.getFilterValue() as string) ?? ''}
                          onChange={(e) => column.setFilterValue(e.target.value)}
                          className="h-8 text-sm"
                        />
                      </div>
                    ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex items-center gap-2">
          {selectedRows.length > 0 && (
            <Badge variant="secondary" className="gap-1">
              {selectedRows.length} selected
            </Badge>
          )}

          {/* Column visibility dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Settings2 className="w-4 h-4" />
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 max-h-96 overflow-auto">
              <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {table.getAllColumns()
                .filter(column => column.getCanHide())
                .map(column => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                  >
                    {TABLE_COLUMNS.find(c => c.key === column.id)?.label || column.id}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Export dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="w-4 h-4" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Export to CSV</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={false}
                onCheckedChange={handleExportAll}
              >
                Export all ({data.length} rows)
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={false}
                onCheckedChange={handleExportSelected}
                disabled={selectedRows.length === 0}
              >
                Export selected ({selectedRows.length} rows)
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                {table.getHeaderGroups().map(headerGroup => (
                  <tr key={headerGroup.id} className="border-b border-border bg-muted/50">
                    <SortableContext
                      items={columnOrder}
                      strategy={horizontalListSortingStrategy}
                    >
                      {headerGroup.headers.map(header => (
                        <th
                          key={header.id}
                          className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                          style={{ width: header.getSize() }}
                        >
                          {header.isPlaceholder ? null : (
                            <SortableHeader column={header.column}>
                              {flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                            </SortableHeader>
                          )}
                        </th>
                      ))}
                    </SortableContext>
                  </tr>
                ))}
              </thead>
              <tbody>
                <AnimatePresence>
                  {table.getRowModel().rows.map((row, index) => (
                    <motion.tr
                      key={row.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className={cn(
                        'border-b border-border last:border-0 hover:bg-muted/30 transition-colors',
                        row.getIsSelected() && 'bg-primary/5'
                      )}
                    >
                      {row.getVisibleCells().map(cell => (
                        <td key={cell.id} className="px-3 py-3">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </DndContext>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{' '}
          {Math.min(
            (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
            table.getFilteredRowModel().rows.length
          )}{' '}
          of {table.getFilteredRowModel().rows.length} entries
        </p>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronsLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, table.getPageCount()) }, (_, i) => {
              const pageIndex = table.getState().pagination.pageIndex;
              let page: number;
              
              if (table.getPageCount() <= 5) {
                page = i;
              } else if (pageIndex < 3) {
                page = i;
              } else if (pageIndex > table.getPageCount() - 4) {
                page = table.getPageCount() - 5 + i;
              } else {
                page = pageIndex - 2 + i;
              }

              return (
                <Button
                  key={page}
                  variant={pageIndex === page ? 'default' : 'outline'}
                  size="icon"
                  onClick={() => table.setPageIndex(page)}
                  className="w-8 h-8"
                >
                  {page + 1}
                </Button>
              );
            })}
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            <ChevronsRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
