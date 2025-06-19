import "./index.css";
import { Composition } from "remotion";
import { BarChartRaceComposition, barChartRaceSchema } from "./BarChartRaceComposition";
import { createSampleData } from "./utils";
import { BarChartRaceConfig } from "./types";
import { z } from "zod";

// Each <Composition> is an entry in the sidebar!

// Sample configuration for development
const sampleConfig: BarChartRaceConfig = {
  output: {
    filename: "bar-chart-race.mp4",
    format: "mp4",
    width: 1920,
    height: 1080,
    fps: 30,
    duration: 10,
    quality: "high"
  },
  data: {
    csvPath: "./sample-data.csv",
    dateColumn: "Date",
    dateFormat: "YYYY-MM-DD",
    valueColumns: ["YouTube", "Netflix", "Disney+", "HBO Max", "Amazon Prime"],
    interpolation: "smooth"
  },
  layers: {
    background: {
      color: "#1a1a2e",
      opacity: 100
    },
    chart: {
      position: {
        top: 120,
        right: 80,
        bottom: 120,
        left: 80
      },
      chart: {
        visibleItemCount: 10,
        maxValue: "local",
        itemSpacing: 15
      },
      animation: {
        type: "continuous",
        overtakeDuration: 0.8
      },
      bar: {
        colors: "auto",
        cornerRadius: 8,
        opacity: 90
      },
      labels: {
        title: {
          show: true,
          fontSize: 22,
          fontFamily: "Inter, Arial, sans-serif",
          color: "#ffffff",
          position: "outside"
        },
        value: {
          show: true,
          fontSize: 18,
          fontFamily: "Inter, Arial, sans-serif",
          color: "#ffffff",
          format: "{value:,.0f}",
          suffix: " subscribers"
        },
        rank: {
          show: true,
          fontSize: 16,
          backgroundColor: "#0f3460",
          textColor: "#ffffff"
        }
      }
    },
    title: {
      text: "Top Streaming Platforms Race",
      position: {
        top: 40,
        align: "center"
      },
      style: {
        fontSize: 42,
        fontFamily: "Inter, Arial, sans-serif",
        color: "#ffffff",
        opacity: 100
      },
      timeline: {
        startTime: 0,
        duration: 10
      }
    },
    date: {
      position: {
        bottom: 40,
        right: 80
      },
      format: {
        pattern: "MMMM YYYY",
        locale: "en-US"
      },
      style: {
        fontSize: 28,
        fontFamily: "Inter, Arial, sans-serif",
        color: "#ffffff",
        opacity: 85
      },
      animation: {
        type: "continuous",
        duration: 0.5
      }
    }
  }
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        // You can take the "id" to render a video:
        // npx remotion render src/index.ts <id> out/video.mp4
        id="BarChartRace"
        component={BarChartRaceComposition}
        durationInFrames={300} // 10 seconds at 30fps
        fps={30}
        width={1920}
        height={1080}
        // You can override these props for each render:
        // https://www.remotion.dev/docs/parametrized-rendering
        schema={barChartRaceSchema}
        defaultProps={{
          config: sampleConfig,
          processedData: createSampleData()
        }}
      />
    </>
  );
};