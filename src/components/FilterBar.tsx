interface FilterBarProps {
  counts: Record<string, number>
  activeFilter: string
  onSelect: (filter: string) => void
}

const FRAMEWORK_ORDER = [
  'All',
  'Node',
  'Vite',
  'Next',
  'React',
  'Vue',
  'Nuxt',
  'Angular',
  'Svelte',
  'Python',
  'Django',
  'Flask',
  'Rails',
  'Go',
  'Bun',
  'Deno',
  'Java',
  'PHP',
  'Rust',
  '.NET',
  'Docker',
  'Other',
]

export default function FilterBar({ counts, activeFilter, onSelect }: FilterBarProps) {
  // Only show frameworks that have active ports + "All"
  const visibleFilters = FRAMEWORK_ORDER.filter(
    (fw) => fw === 'All' || (counts[fw] && counts[fw] > 0)
  )

  return (
    <div className="filter-bar">
      {visibleFilters.map((fw) => (
        <button
          key={fw}
          className={`filter-chip ${activeFilter === fw ? 'active' : ''}`}
          onClick={() => onSelect(fw)}
        >
          {fw}
          {counts[fw] !== undefined && (
            <span className="filter-chip-count">{counts[fw]}</span>
          )}
        </button>
      ))}
    </div>
  )
}
