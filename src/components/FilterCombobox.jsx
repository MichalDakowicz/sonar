import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "../lib/utils"
import { Button } from "./ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./ui/popover"

export function FilterCombobox({ 
    options = [], 
    value, 
    onChange, 
    placeholder = "Select...", 
    searchPlaceholder = "Search...", 
    icon: Icon,
    className
}) {
  const [open, setOpen] = React.useState(false)

  const selectedLabel = React.useMemo(() => {
     if (value === "All" || !value) return null
     const found = options.find(o => (typeof o === 'object' ? o.value === value : o === value))
     if (!found) return value
     return typeof found === 'object' ? found.label : found
  }, [value, options])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-[200px] justify-between border-neutral-800 bg-neutral-900 text-neutral-400 hover:bg-neutral-800 hover:text-white", className)}
        >
          <div className="flex items-center gap-2 truncate">
             {Icon && <Icon className="h-4 w-4 shrink-0 opacity-50" />}
             {selectedLabel ? (
                <span className="truncate text-white">{selectedLabel}</span>
             ) : (
                 <span>{placeholder}</span>
             )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0 bg-neutral-950 border-neutral-800">
        <Command className="bg-neutral-950">
          <CommandInput placeholder={searchPlaceholder} className="h-9 border-neutral-800 text-white placeholder:text-neutral-500" />
          <CommandList>
            <CommandEmpty className="text-neutral-500 text-xs py-2">No results.</CommandEmpty>
            <CommandGroup>
                <CommandItem
                  value="All"
                  onSelect={() => {
                    onChange("All")
                    setOpen(false)
                  }}
                  className="text-neutral-300 aria-selected:bg-neutral-800 aria-selected:text-white cursor-pointer"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === "All" ? "opacity-100" : "opacity-0"
                    )}
                  />
                  All
                </CommandItem>
              {options.map((option) => {
                const isObject = typeof option === 'object' && option !== null
                const val = isObject ? option.value : option
                const lbl = isObject ? option.label : option
                
                return (
                <CommandItem
                  key={val}
                  value={lbl} // Use label for search filtering
                  onSelect={() => {
                    onChange(val)
                    setOpen(false)
                  }}
                  className="text-neutral-300 aria-selected:bg-neutral-800 aria-selected:text-white cursor-pointer"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === val ? "opacity-100 text-emerald-500" : "opacity-0"
                    )}
                  />
                  {lbl}
                </CommandItem>
              )})}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
