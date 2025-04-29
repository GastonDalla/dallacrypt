"use client"

import { useState } from "react"
import { Lock, Unlock, Star, Trash2, Copy, Download, ArrowUpDown, MoreHorizontal, FileDown, Eye } from "lucide-react"
import { format } from "date-fns"
import { 
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"

export type HistoryItem = {
  timestamp: number
  type: 'encrypt' | 'decrypt'
  name: string
  favorite?: boolean
  content?: string
}

declare module "@tanstack/react-table" {
  interface TableMeta<TData extends unknown> {
    onDelete?: (item: TData) => void
    onToggleFavorite?: (item: TData) => void
  }
}

export const columns: ColumnDef<HistoryItem>[] = [
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => {
      const type = row.getValue("type") as 'encrypt' | 'decrypt'
      return (
        <Badge className={type === 'encrypt' ? "bg-primary/20 text-primary" : "bg-gray-500/20 text-gray-500"}>
          {type === 'encrypt' ? (
            <Lock className="h-3 w-3 mr-1" />
          ) : (
            <Unlock className="h-3 w-3 mr-1" />
          )}
          {type === 'encrypt' ? "Encrypted" : "Decrypted"}
        </Badge>
      )
    },
    filterFn: "equals",
  },
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="cursor-pointer"
        >
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: "timestamp",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="cursor-pointer"
        >
          Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const timestamp = row.getValue("timestamp") as number
      const formattedDate = format(new Date(timestamp), "dd/MM/yyyy HH:mm")
      return <div>{formattedDate}</div>
    },
    sortingFn: "datetime",
  },
  {
    accessorKey: "favorite",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="cursor-pointer"
        >
          Favorite
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const isFavorite = row.getValue("favorite") as boolean
      return (
        <div className="flex justify-center items-center text-center">
          <Star className={`h-4 w-4 ${isFavorite ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`} />
        </div>
      )
    },
  },
  {
    id: "actions",
    cell: ({ row, table }) => {
      const item = row.original
      
      const { onToggleFavorite, onDelete } = table.options.meta || {}
      
      const handleDownload = () => {
        if (!item.content) return
        
        const filename = `${item.type === 'encrypt' ? 'encrypted' : 'decrypted'}-${new Date(item.timestamp).toISOString().substring(0, 10)}.txt`
        const blob = new Blob([item.content], { type: 'text/plain' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }
      
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <Dialog>
              <DialogTrigger asChild>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  <Eye className="mr-2 h-4 w-4" />
                  View content
                </DropdownMenuItem>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {item.type === 'encrypt' ? (
                      <div className="flex items-center">
                        <Lock className="h-4 w-4 mr-2 text-primary" />
                        Encrypted Content
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <Unlock className="h-4 w-4 mr-2 text-accent" />
                        Content Decrypted
                      </div>
                    )}
                  </DialogTitle>
                  <DialogDescription>
                    {item.name} - {format(new Date(item.timestamp), "dd/MM/yyyy HH:mm")}
                  </DialogDescription>
                </DialogHeader>
                <div className="bg-secondary/20 border rounded-lg p-4 mt-4 max-h-[300px] overflow-auto break-all">
                  <pre className="text-xs font-mono whitespace-pre-wrap">{item.content || "No content"}</pre>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <DialogClose asChild>
                    <Button variant="outline" size="sm">Close</Button>
                  </DialogClose>
                  <Button 
                    variant="default" 
                    size="sm" 
                    onClick={() => {
                      navigator.clipboard.writeText(item.content || "")
                    }}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy content
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            
            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(item.content || "")}>
              <Copy className="mr-2 h-4 w-4" />
              Copy content
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDownload} disabled={!item.content}>
              <Download className="mr-2 h-4 w-4" />
              Download
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onToggleFavorite && onToggleFavorite(item)}>
              <Star className={`mr-2 h-4 w-4 ${item.favorite ? "fill-amber-400" : ""}`} />
              {item.favorite ? "Remove from favorites" : "Add to favorites"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onDelete && onDelete(item)} className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]

interface HistoryTableProps {
  data: HistoryItem[]
  onDelete?: (item: HistoryItem) => void
  onToggleFavorite?: (item: HistoryItem) => void
  onClearAll?: () => void
}

export function HistoryTable({ 
  data,
  onDelete,
  onToggleFavorite,
  onClearAll
}: HistoryTableProps) {
  const [sorting, setSorting] = useState<SortingState>([
    {
      id: "timestamp",
      desc: true,
    },
  ])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    meta: {
      onDelete,
      onToggleFavorite,
    },
  })

  const handleTypeFilterChange = (type: string | null) => {
    if (type === null) {
      table.getColumn("type")?.setFilterValue(undefined)
    } else {
      table.getColumn("type")?.setFilterValue(type)
    }
  }

  const typeFilter = table.getColumn("type")?.getFilterValue() as string | undefined

  const totalEncrypted = data.filter(item => item.type === "encrypt").length
  const totalDecrypted = data.filter(item => item.type === "decrypt").length
  const totalFavorites = data.filter(item => item.favorite).length

  const exportHistory = () => {
    if (data.length === 0) return
    
    const exportData = JSON.stringify(data, null, 2)
    const blob = new Blob([exportData], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `dallacrypt-history-${new Date().toISOString().substring(0, 10)}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 py-4">
        <div className="flex flex-wrap items-center gap-2">
          {/* Filtro por Tipo */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="ml-auto cursor-pointer">
                {typeFilter ? (
                  <>
                    {typeFilter === "encrypt" ? (
                      <><Lock className="mr-2 h-4 w-4" /> <span className="cursor-pointer">Encrypted</span></>
                    ) : (
                      <><Unlock className="mr-2 h-4 w-4" /> <span className="cursor-pointer">Decrypted</span></>
                    )}
                  </>
                ) : (
                  <>Type <ArrowUpDown className="ml-2 h-4 w-4" /></>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuCheckboxItem
                checked={typeFilter === undefined}
                onCheckedChange={() => handleTypeFilterChange(null)}
                className="cursor-pointer"
              >
                All
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={typeFilter === "encrypt"}
                onCheckedChange={(checked) => {
                  if (checked) handleTypeFilterChange("encrypt")
                }}
              >
                <Lock className="mr-2 h-4 w-4" /> <span className="cursor-pointer">Encrypted</span>
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={typeFilter === "decrypt"}
                onCheckedChange={(checked) => {
                  if (checked) handleTypeFilterChange("decrypt")
                }}
              >
                <Unlock className="mr-2 h-4 w-4" /> <span className="cursor-pointer">Decrypted</span>
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {data.length > 0 && (
            <Button variant="outline" size="sm" onClick={exportHistory} className="cursor-pointer">
              <FileDown className="mr-2 h-4 w-4" />
              Export
            </Button>
          )}
          
          {onClearAll && data.length > 0 && (
            <Button variant="outline" size="sm" onClick={onClearAll} className="cursor-pointer">
              <Trash2 className="mr-2 h-4 w-4" />
              Clear history
            </Button>
          )}
        </div>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
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
                  No found records
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 py-4">
        <div className="flex-1">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="text-xs">
              <Lock className="h-3 w-3 mr-1 text-primary" /> 
              {totalEncrypted} encrypted
            </Badge>
            <Badge variant="outline" className="text-xs">
              <Unlock className="h-3 w-3 mr-1 text-accent" /> 
              {totalDecrypted} decrypted
            </Badge>
            {totalFavorites > 0 && (
              <Badge variant="outline" className="text-xs">
                <Star className="h-3 w-3 mr-1 fill-amber-400 text-amber-400" /> 
                {totalFavorites} favorites
              </Badge>
            )}
          </div>
          <div className="text-sm text-muted-foreground mt-2">
            {table.getFilteredRowModel().rows.length} registers in total
          </div>
        </div>
        
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="cursor-pointer"
          >
            Previous
          </Button>
          <span className="px-2 text-sm text-muted-foreground">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="cursor-pointer"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
} 