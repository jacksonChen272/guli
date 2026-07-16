import type { HTMLAttributes, ReactNode, TableHTMLAttributes } from 'react'

type DataTableProps = TableHTMLAttributes<HTMLTableElement> & {
  children: ReactNode
  minWidth?: number
  watchlist?: boolean
  containerClassName?: string
}

export function DataTable({ children, minWidth, watchlist = false, className = '', containerClassName = '', style, ...props }: DataTableProps) {
  return (
    <div className={`data-table-shell ${containerClassName}`}>
      <table
        className={`data-table ${watchlist ? 'data-table--watchlist' : ''} ${className}`}
        style={{ minWidth, ...style }}
        {...props}
      >
        {children}
      </table>
    </div>
  )
}

export function NumericCell({ children, className = '', ...props }: HTMLAttributes<HTMLTableCellElement>) {
  return <td className={`numeric mono ${className}`} {...props}>{children}</td>
}
