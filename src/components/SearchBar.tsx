import { Search } from 'lucide-react'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
}

export default function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="search-bar">
      <Search />
      <input
        type="text"
        placeholder="搜索端口、进程名或框架..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}
