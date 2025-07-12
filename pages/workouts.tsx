import { InferGetServerSidePropsType } from "next/types";
import { NotionService } from "services/notion";
import React, { useState, useMemo, useEffect, useRef } from "react";

export default function Workouts({
  items,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [filterMode, setFilterMode] = useState<"OR" | "AND">("OR");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredItems = useMemo(() => {
    if (selectedTags.length === 0) {
      return items;
    }
    return items.filter((e) => {
      if (filterMode === "OR") {
        return selectedTags.some((tag) => e.tags.includes(tag));
      } else {
        return selectedTags.every((tag) => e.tags.includes(tag));
      }
    });
  }, [selectedTags, items, filterMode]);
  const selectedWorkout = filteredItems?.[selectedIndex];

  const uniqueTags = useMemo(() => {
    const allTagsFlatten = items.map((e) => e.tags).flat();
    return [...new Set(allTagsFlatten)];
  }, [items]);

  const filteredTags = useMemo(() => {
    if (!searchQuery) return uniqueTags;
    return uniqueTags.filter(
      (tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !selectedTags.includes(tag)
    );
  }, [searchQuery, uniqueTags, selectedTags]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [selectedTags]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleTagSelect = (tag: string) => {
    setSelectedTags((prev) => [...prev, tag]);
    setSearchQuery("");
    setIsDropdownOpen(false);
    searchInputRef.current?.focus();
  };

  const handleTagRemove = (tag: string) => {
    setSelectedTags((prev) => prev.filter((t) => t !== tag));
  };

  const clearAllTags = () => {
    setSelectedTags([]);
    setSearchQuery("");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setIsDropdownOpen(true);
  };

  const handleInputFocus = () => {
    setIsDropdownOpen(true);
  };

  const handleFilterModeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilterMode(e.target.checked ? "AND" : "OR");
  };

  return (
    <div className="min-h-screen bg-blue-900 flex flex-col justify-between p-4">
      <h1 className="text-3xl text-white text-center">
        {selectedWorkout?.name}
      </h1>

      {selectedWorkout && <WorkoutItem workout={selectedWorkout} />}

      {/* Filter section */}
      <div className="mb-4">
        <div className="flex flex-col items-center space-y-3 mb-4">
          {/* Search input with autocomplete */}
          <div className="relative w-full max-w-md" ref={dropdownRef}>
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={handleInputChange}
              onFocus={handleInputFocus}
              placeholder="Buscar tags..."
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />

            {/* Dropdown */}
            {isDropdownOpen && filteredTags.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {filteredTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => handleTagSelect(tag)}
                    className="w-full px-4 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                  >
                    <span className="text-gray-900">{tag}</span>
                    <span className="text-gray-500 ml-2">
                      ({items.filter((e) => e.tags.includes(tag)).length})
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Filter mode toggle */}
          {selectedTags.length > 1 && (
            <div className="flex items-center space-x-2 text-white">
              <span className="text-sm">Modo filtro:</span>
              <label className="flex items-center space-x-2 cursor-pointer">
                <span
                  className={`text-sm ${
                    filterMode === "OR" ? "font-bold" : "opacity-70"
                  }`}
                >
                  OR
                </span>
                <input
                  type="checkbox"
                  checked={filterMode === "AND"}
                  onChange={handleFilterModeChange}
                  className="toggle-checkbox sr-only"
                />
                <div className="relative w-10 h-6 bg-gray-600 rounded-full transition-colors duration-200 ease-in-out">
                  <div
                    className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ease-in-out ${
                      filterMode === "AND" ? "transform translate-x-4" : ""
                    }`}
                  ></div>
                </div>
                <span
                  className={`text-sm ${
                    filterMode === "AND" ? "font-bold" : "opacity-70"
                  }`}
                >
                  AND
                </span>
              </label>
            </div>
          )}

          {/* Selected tags as chips */}
          {selectedTags.length > 0 && (
            <div className="flex flex-wrap gap-2 justify-center">
              {selectedTags.map((tag) => (
                <span
                  key={tag}
                  className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2"
                >
                  {tag}
                  <button
                    onClick={() => handleTagRemove(tag)}
                    className="text-blue-200 hover:text-white focus:outline-none"
                    aria-label={`Remove ${tag} tag`}
                  >
                    ×
                  </button>
                </span>
              ))}
              <button
                onClick={clearAllTags}
                className="bg-gray-600 text-white px-3 py-1 rounded-full text-sm hover:bg-gray-500"
              >
                Limpiar todo
              </button>
            </div>
          )}
        </div>

        {selectedTags.length > 0 && (
          <div className="text-center text-white text-sm mb-2">
            Mostrando {filteredItems.length} workouts que{" "}
            {filterMode === "OR"
              ? "incluyen alguna de las"
              : "incluyen todas las"}{" "}
            tags: {selectedTags.join(", ")}
          </div>
        )}
      </div>

      <div className="flex justify-between">
        {selectedIndex > 0 && (
          <button
            onClick={() => setSelectedIndex(selectedIndex - 1)}
            className="bg-blue-600 text-lg text-white py-4 px-6 rounded-lg shadow hover:bg-blue-500 mr-auto"
          >
            Anterior
          </button>
        )}

        {selectedIndex < filteredItems.length - 1 && (
          <button
            onClick={() => setSelectedIndex(selectedIndex + 1)}
            className="bg-blue-600 text-lg text-white py-4 px-6 rounded-lg shadow hover:bg-blue-500 ml-auto"
          >
            Siguiente
          </button>
        )}
      </div>
    </div>
  );
}

interface WorkoutItemData {
  name: string;
  tags: string[];
  link: string;
  videos: string[];
}

const WorkoutItem = ({
  workout,
  layout,
}: {
  workout: WorkoutItemData;
  layout?: "vertical" | "horizontal";
}) => {
  return (
    <>
      <div className="flex flex-wrap justify-between gap-4 mb-6">
        <video
          src={workout.videos[0]}
          autoPlay={true}
          muted
          loop
          className="max-w-full"
          style={{ width: layout === "horizontal" ? "50%" : "100%" }}
        />
        <video
          src={workout.videos[1]}
          autoPlay={true}
          muted
          loop
          className="max-w-full"
          style={{ width: layout === "horizontal" ? "50%" : "100%" }}
        />
      </div>
    </>
  );
};
export async function getServerSideProps() {
  const notion = new NotionService();
  const data = await notion.getWorkouts();
  return {
    props: {
      items: data,
    },
  };
}
