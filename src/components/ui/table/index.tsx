import React, { ReactNode } from "react";

interface TableProps {
  children: ReactNode;
  className?: string;
}

interface TableHeaderProps {
  children: ReactNode;
  className?: string;
}

interface TableBodyProps {
  children: ReactNode;
  className?: string;
}

interface TableRowProps {
  children: ReactNode;
  className?: string;
  onClick?: React.MouseEventHandler<HTMLTableRowElement>;
}

interface TableCellProps {
  children: ReactNode;
  isHeader?: boolean;
  colSpan?: number;
  className?: string;
  onClick?: React.MouseEventHandler<HTMLTableCellElement>;
}

const Table: React.FC<TableProps> = ({ children, className }) => (
  <table className={`min-w-full ${className ?? ""}`}>{children}</table>
);

const TableHeader: React.FC<TableHeaderProps> = ({ children, className }) => (
  <thead className={className}>{children}</thead>
);

const TableBody: React.FC<TableBodyProps> = ({ children, className }) => (
  <tbody className={className}>{children}</tbody>
);

const TableRow: React.FC<TableRowProps> = ({ children, className, onClick }) => (
  <tr className={className} onClick={onClick}>
    {children}
  </tr>
);

const TableCell: React.FC<TableCellProps> = ({ children, isHeader = false, colSpan, className, onClick }) => {
  const CellTag = isHeader ? "th" : "td";
  return (
    <CellTag colSpan={colSpan} className={className} onClick={onClick}>
      {children}
    </CellTag>
  );
};

export { Table, TableHeader, TableBody, TableRow, TableCell };
