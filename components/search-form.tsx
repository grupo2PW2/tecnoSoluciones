"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

import { Label } from "@/components/ui/label"
import { SidebarInput } from "@/components/ui/sidebar"
import { SearchIcon } from "lucide-react"

export function SearchForm({ ...props }: React.ComponentProps<"form">) {
  const router = useRouter()
  const [query, setQuery] = useState("")

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const normalizedQuery = query.trim()

    if (normalizedQuery) {
      router.push(`/buscar?q=${encodeURIComponent(normalizedQuery)}`)
    }
  }

  return (
    <form {...props} onSubmit={handleSubmit}>
      <div className="relative">
        <Label htmlFor="search" className="sr-only">
          Buscar
        </Label>
        <SidebarInput
          id="search"
          placeholder="Buscar..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="h-8 pl-7"
        />
        <SearchIcon className="pointer-events-none absolute top-1/2 left-2 size-4 -translate-y-1/2 opacity-50 select-none" />
      </div>
    </form>
  )
}
