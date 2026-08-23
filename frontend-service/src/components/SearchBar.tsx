"use client";

interface SearchBarProps {
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
  width?: string;
}

export default function SearchBar({
  value,
  placeholder = "Search...",
  onChange,
  width = "w-72",
}: SearchBarProps) {
  return (
    <div className="flex items-center gap-1.5">
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={`border border-[#d0d7de] px-2.5 py-1 text-xs outline-none focus:border-blue-600 bg-white shadow-inner ${width}`}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="text-xs text-gray-500 hover:text-gray-800 font-semibold px-1"
        >
          Clear
        </button>
      )}
    </div>
  );
}
