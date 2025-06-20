import "./index.css";
import React from "react";
import { Composition } from "remotion";
import { BarChartRaceComposition, barChartRaceSchema } from "./BarChartRace";
import { BuildTimeDataLoader } from "./dataprocessor/BuildTimeDataLoader";

// Dynamic Compositions Hook
const useDynamicCompositions = () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [compositions, setCompositions] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const loadCompositions = async () => {
      try {
        console.log("Loading CSV files for dynamic compositions...");

        const loader = new BuildTimeDataLoader();
        const scanResult = await loader.scanCSVFiles();

        console.log(`Found ${scanResult.validFiles} CSV files`);

        const dynamicCompositions = [];

        for (const csvMetadata of scanResult.csvFiles) {
          // Generate composition ID from filename
          const compositionId = `BarChartRace-${csvMetadata.filename.replace(/\.csv$/i, "")}`;

          // Generate display name
          const displayName =
            csvMetadata.filename
              .replace(/\.csv$/i, "")
              .split(/[-_]/)
              .map(
                (word) =>
                  word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
              )
              .join(" ") + " Race";

          // Determine template type from filename
          const getTemplateType = (filename: string) => {
            const name = filename.toLowerCase();
            if (name.includes("dramatic") || name.includes("extreme"))
              return "gaming";
            if (name.includes("business") || name.includes("sales"))
              return "business";
            if (name.includes("social") || name.includes("instagram"))
              return "social";
            if (
              name.includes("test") ||
              name.includes("sample") ||
              name.includes("demo")
            )
              return "demo";
            return "default";
          };

          const templateType = getTemplateType(csvMetadata.filename);

          // Create base config based on template type
          const getTemplateConfig = (type: string) => {
            const baseConfig = {
              output: {
                filename: `${csvMetadata.filename.replace(/\.csv$/i, "")}.mp4`,
                format: "mp4" as const,
                width: 1920,
                height: 1080,
                fps: 30,
                duration: 10,
                quality: "high" as const,
              },
              data: {
                csvPath: csvMetadata.filepath,
                dateColumn: csvMetadata.dateColumn || "Date",
                dateFormat: csvMetadata.estimatedDateFormat || "YYYY-MM",
                valueColumns: csvMetadata.valueColumns,
                interpolation: "smooth" as const,
              },
              layers: {
                background: { color: "#1a1a2e", opacity: 100 },
                chart: {
                  position: { top: 120, right: 80, bottom: 120, left: 80 },
                  chart: {
                    visibleItemCount: 10,
                    maxValue: "local" as const,
                    itemSpacing: 15,
                  },
                  animation: {
                    type: "continuous" as const,
                    overtakeDuration: 0.8,
                  },
                  bar: {
                    colors: "auto" as const,
                    cornerRadius: 8,
                    opacity: 90,
                  },
                  labels: {
                    title: {
                      show: true,
                      fontSize: 22,
                      fontFamily: "Inter, Arial, sans-serif",
                      color: "#ffffff",
                      position: "outside" as const,
                    },
                    value: {
                      show: true,
                      fontSize: 18,
                      fontFamily: "Inter, Arial, sans-serif",
                      color: "#ffffff",
                      format: "{value:,.0f}",
                    },
                    rank: {
                      show: true,
                      fontSize: 16,
                      backgroundColor: "#0f3460",
                      textColor: "#ffffff",
                    },
                  },
                },
                title: {
                  text: displayName,
                  position: { top: 40, align: "center" as const },
                  style: {
                    fontSize: 42,
                    fontFamily: "Inter, Arial, sans-serif",
                    color: "#ffffff",
                    opacity: 100,
                  },
                  timeline: { startTime: 0, duration: 10 },
                },
                date: {
                  position: { bottom: 40, right: 80 },
                  format: { pattern: "MMMM YYYY", locale: "en-US" },
                  style: {
                    fontSize: 28,
                    fontFamily: "Inter, Arial, sans-serif",
                    color: "#ffffff",
                    opacity: 85,
                  },
                  animation: { type: "continuous" as const, duration: 0.5 },
                },
              },
            };

            // Template-specific customizations
            switch (type) {
              case "gaming":
                baseConfig.layers.background.color = "#8E44AD";
                baseConfig.output.fps = 60;
                baseConfig.output.duration = 20;
                break;
              case "business":
                baseConfig.layers.background.color = "#2C3E50";
                baseConfig.output.duration = 15;
                break;
              case "social":
                baseConfig.output.width = 1080;
                baseConfig.output.height = 1920;
                baseConfig.output.duration = 30;
                baseConfig.layers.background.color = "#FF6B6B";
                break;
            }

            return baseConfig;
          };

          const config = getTemplateConfig(templateType);

          dynamicCompositions.push({
            id: compositionId,
            displayName,
            config,
            csvFile: csvMetadata.filename,
            durationInFrames: config.output.duration * config.output.fps,
            fps: config.output.fps,
            width: config.output.width,
            height: config.output.height,
          });
        }

        setCompositions(dynamicCompositions);
        console.log(
          `Generated ${dynamicCompositions.length} dynamic compositions`,
        );
      } catch (error) {
        console.error("Failed to load dynamic compositions:", error);
      } finally {
        setLoading(false);
      }
    };

    loadCompositions();
  }, []);

  return { compositions, loading };
};

export const RemotionRoot: React.FC = () => {
  const { compositions, loading } = useDynamicCompositions();

  if (loading) {
    console.log("RemotionRoot: Loading compositions...");
    // Return a single fallback composition while loading
    return (
      <>
        <Composition
          id="Loading"
          component={() => <div>Loading compositions...</div>}
          durationInFrames={30}
          fps={30}
          width={1920}
          height={1080}
        />
      </>
    );
  }

  console.log(`RemotionRoot: Rendering ${compositions.length} compositions`);
  console.log(compositions);
  return (
    <>
      {compositions.map((comp) => (
        <Composition
          key={comp.id}
          id={comp.id}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          component={BarChartRaceComposition as any}
          durationInFrames={comp.durationInFrames}
          fps={comp.fps}
          width={comp.width}
          height={comp.height}
          schema={barChartRaceSchema}
          defaultProps={{
            config: comp.config,
            // NO processedData - let Remotion calculate frames dynamically!
          }}
        />
      ))}
    </>
  );
};
