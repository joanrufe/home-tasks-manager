import { InferGetServerSidePropsType } from "next/types";
import { NotionService } from "services/notion";
import React, { useState, useMemo, useEffect } from "react";

export default function Workouts({
  items,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedTag, setSelectedTag] = useState("");
  const filteredItems = useMemo(() => {
    if (!selectedTag) {
      return items;
    }
    return items.filter((e) => e.tags.includes(selectedTag));
  }, [selectedTag, items]);
  const selectedWorkout = filteredItems?.[selectedIndex];

  const uniqueTags = useMemo(() => {
    const allTagsFlatten = items.map((e) => e.tags).flat();
    return [...new Set(allTagsFlatten)];
  }, [items]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [selectedTag]);

  return (
    <div className="min-h-screen bg-blue-900 flex flex-col justify-between p-4">
      <h1 className="text-3xl text-white text-center">
        {selectedWorkout?.name}
      </h1>

      {selectedWorkout && <WorkoutItem workout={selectedWorkout} />}
      <div className="flex justify-between">
        {selectedIndex > 0 && (
          <button
            onClick={() => setSelectedIndex(selectedIndex - 1)}
            className="bg-blue-600 text-lg text-white py-4 px-6 rounded-lg shadow hover:bg-blue-500 mr-auto"
          >
            Anterior
          </button>
        )}

        <select
          value={selectedTag}
          onChange={(e) => setSelectedTag(e.target.value)}
          className="bg-white text-black rounded-lg h-8 pl-2 shadow hover:bg-gray-100 ml-auto mr-auto"
        >
          <option value="">Todos ({items.length})</option>
          {uniqueTags.map((tag) => (
            <option key={tag} value={tag}>
              {tag} ({items.filter((e) => e.tags.includes(tag)).length})
            </option>
          ))}
        </select>

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
