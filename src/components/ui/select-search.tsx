"use client";

import { useMemo, useState } from "react";
import { ChevronDownIcon } from "@/icons";
import { Dropdown } from "@/components/ui/dropdown/Dropdown";
import { cn } from "@/lib/utils";

export interface SelectSearchOption {
  value: string;
  label: string;
}

interface SelectSearchProps {
  id?: string;
  options: SelectSearchOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  emptyLabel?: string;
  className?: string;
}

/** Combobox avec recherche, remplace les <select> natifs sur les listes qui peuvent devenir longues. */
export function SelectSearch({
  id,
  options,
  value,
  onChange,
  placeholder = "Rechercher…",
  emptyLabel = "— Aucun —",
  className,
}: SelectSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = useMemo(
    () => options.filter((option) => option.label.toLowerCase().includes(query.toLowerCase())),
    [options, query],
  );

  const selectedLabel = options.find((option) => option.value === value)?.label ?? emptyLabel;

  return (
    <div className="relative">
      <button
        id={id}
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className={cn(
          "dropdown-toggle flex h-11 w-full items-center justify-between rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-left text-sm shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10",
          value ? "text-gray-800" : "text-gray-400",
          className,
        )}
      >
        <span className="truncate">{selectedLabel}</span>
        <ChevronDownIcon className="h-4 w-4 shrink-0 text-gray-400" />
      </button>

      <Dropdown isOpen={isOpen} onClose={() => setIsOpen(false)} className="w-full p-2">
        <input
          autoFocus
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="mb-2 w-full rounded-md border border-gray-200 px-3 py-1.5 text-sm focus:border-brand-300 focus:outline-hidden"
        />
        <div className="max-h-56 overflow-y-auto">
          <button
            type="button"
            onClick={() => {
              onChange("");
              setIsOpen(false);
              setQuery("");
            }}
            className="block w-full rounded-md px-3 py-2 text-left text-sm text-gray-500 hover:bg-gray-100"
          >
            {emptyLabel}
          </button>
          {filtered.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
                setQuery("");
              }}
              className={cn(
                "block w-full rounded-md px-3 py-2 text-left text-sm hover:bg-gray-100",
                option.value === value ? "bg-brand-50 text-brand-600" : "text-gray-700",
              )}
            >
              {option.label}
            </button>
          ))}
          {filtered.length === 0 ? <p className="px-3 py-2 text-sm text-gray-400">Aucun résultat.</p> : null}
        </div>
      </Dropdown>
    </div>
  );
}
