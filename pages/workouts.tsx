import { InferGetServerSidePropsType } from "next/types";
import { NotionService } from "services/notion";
import React, {  useState } from "react";

export default function Workouts({
  items,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selectedWorkout = items[selectedIndex];
  return (
    <div className="min-h-screen bg-blue-900 flex flex-col justify-between p-4">
      <h1 className="text-3xl text-white text-center">
        {selectedWorkout.name}
      </h1>

      <WorkoutItem workout={selectedWorkout} />
      <div className="flex justify-between">
        {selectedIndex > 0 && (
          <button
            onClick={() => setSelectedIndex(selectedIndex - 1)}
            className="bg-blue-600 text-lg text-white py-4 px-6 rounded-lg shadow hover:bg-blue-500 mr-auto"
          >
            Anterior
          </button>
        )}
        {selectedIndex < items.length - 1 && (
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
