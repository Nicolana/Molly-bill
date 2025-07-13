"use client"

import * as React from "react"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import { Calendar as CalendarIcon, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
  date?: Date
  onDateChange?: (date: Date | undefined) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function DatePicker({
  date,
  onDateChange,
  placeholder = "选择日期",
  className,
  disabled = false,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)

  const handleSelect = (selectedDate: Date | undefined) => {
    onDateChange?.(selectedDate)
    setOpen(false)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDateChange?.(undefined)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal h-10 px-3 py-2",
            "hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
            "transition-all duration-200",
            !date && "text-muted-foreground",
            disabled && "cursor-not-allowed opacity-50",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 text-gray-500" />
          <span className="flex-1 text-left">
            {date ? format(date, "yyyy年MM月dd日", { locale: zhCN }) : placeholder}
          </span>
          {date && !disabled && (
            <X 
              className="h-4 w-4 text-gray-400 hover:text-gray-600 transition-colors" 
              onClick={handleClear}
            />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-auto p-0 shadow-lg border-gray-200" 
        align="start"
        sideOffset={4}
      >
        <div className="border-b border-gray-100 px-4 py-3 bg-gray-50">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">选择日期</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-gray-200"
              onClick={() => setOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="p-1">
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleSelect}
            initialFocus
            locale={zhCN}
            className="border-0 shadow-none"
            weekStartsOn={1}
            formatters={{
              formatWeekdayName: (date) => {
                const weekdays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
                return weekdays[date.getDay() === 0 ? 6 : date.getDay() - 1]
              }
            }}
          />
        </div>
        <div className="border-t border-gray-100 px-4 py-3 bg-gray-50">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleSelect(new Date())}
              className="text-xs h-8 px-3 hover:bg-gray-200 font-medium"
            >
              今天
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="text-xs h-8 px-3 hover:bg-gray-200 text-gray-500"
            >
              清除
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
} 