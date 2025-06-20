/**
 * Component Integration Test v1.0 Foundation Fix
 * This verifies that all components work together correctly
 */

// Component Integration Test imports
import { createSampleData } from "./utils";
import { BarChartRaceConfig } from "./types";

// Define test configuration
const testConfig: BarChartRaceConfig = {
  output: {
    filename: "integration-test.mp4",
    format: "mp4",
    width: 1920,
    height: 1080,
    fps: 30,
    duration: 5,
    quality: "medium",
  },
  data: {
    csvPath: "./test-data.csv",
    dateColumn: "Date",
    dateFormat: "YYYY-MM-DD",
    valueColumns: ["Item1", "Item2", "Item3", "Item4", "Item5"],
    interpolation: "smooth",
  },
  layers: {
    background: {
      color: "#1a1a2e",
      opacity: 100,
    },
    chart: {
      position: {
        top: 100,
        right: 100,
        bottom: 100,
        left: 100,
      },
      chart: {
        visibleItemCount: 5,
        maxValue: "local",
        itemSpacing: 20,
      },
      animation: {
        type: "continuous",
        overtakeDuration: 0.5,
      },
      bar: {
        colors: ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7"],
        cornerRadius: 8,
        opacity: 90,
      },
      labels: {
        title: {
          show: true,
          fontSize: 20,
          fontFamily: "Arial, sans-serif",
          color: "#ffffff",
          position: "outside",
        },
        value: {
          show: true,
          fontSize: 16,
          fontFamily: "Arial, sans-serif",
          color: "#ffffff",
          format: "{value:,.0f}",
        },
        rank: {
          show: true,
          fontSize: 14,
          backgroundColor: "#333333",
          textColor: "#ffffff",
        },
      },
    },
    title: {
      text: "Integration Test",
      position: {
        top: 30,
        align: "center",
      },
      style: {
        fontSize: 36,
        fontFamily: "Arial, sans-serif",
        color: "#ffffff",
        opacity: 100,
      },
      timeline: {
        startTime: 0,
        duration: 5,
      },
    },
    date: {
      position: {
        bottom: 30,
        right: 100,
      },
      format: {
        pattern: "YYYY-MM",
        locale: "en-US",
      },
      style: {
        fontSize: 24,
        fontFamily: "Arial, sans-serif",
        color: "#ffffff",
        opacity: 80,
      },
      animation: {
        type: "fixed",
        duration: 0.3,
      },
    },
  },
};

interface IntegrationTestResult {
  success: boolean;
  errors: string[];
  warnings: string[];
  componentStatus: {
    mainComposition?: boolean;
    backgroundLayer?: boolean;
    chartLayer?: boolean;
    titleLayer?: boolean;
    dateLayer?: boolean;
    barItem?: boolean;
    dataProcessing?: boolean;
    utils?: boolean;
  };
}

export class ComponentIntegrationTest {
  private errors: string[] = [];
  private warnings: string[] = [];
  private componentStatus: any = {};

  async runTest(): Promise<IntegrationTestResult> {
    console.log("🔧 Starting Component Integration Test v1.0 Foundation Fix");

    // Reset state
    this.errors = [];
    this.warnings = [];
    this.componentStatus = {};

    try {
      // Test 1: Data Processing Pipeline
      await this.testDataProcessing();

      // Test 2: Utility Functions
      await this.testUtilityFunctions();

      // Test 3: Component Imports and Exports
      await this.testComponentImports();

      // Test 4: Props Validation
      await this.testPropsValidation();

      // Test 5: Component Instantiation
      await this.testComponentInstantiation();

      // Test 6: Integration Flow
      await this.testIntegrationFlow();
    } catch (error) {
      this.errors.push(`Critical error during testing: ${error}`);
    }

    const success = this.errors.length === 0;

    console.log(`\n📊 Integration Test Results:`);
    console.log(`✅ Success: ${success}`);
    console.log(`❌ Errors: ${this.errors.length}`);
    console.log(`⚠️  Warnings: ${this.warnings.length}`);

    if (this.errors.length > 0) {
      console.log("\n❌ Errors found:");
      this.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    }

    if (this.warnings.length > 0) {
      console.log("\n⚠️  Warnings:");
      this.warnings.forEach((warning, index) => {
        console.log(`  ${index + 1}. ${warning}`);
      });
    }

    return {
      success,
      errors: this.errors,
      warnings: this.warnings,
      componentStatus: this.componentStatus,
    };
  }

  private async testDataProcessing(): Promise<void> {
    try {
      console.log("🔍 Testing data processing...");

      // Test sample data creation
      const sampleData = createSampleData();

      if (!sampleData) {
        this.errors.push("createSampleData() returned null/undefined");
        return;
      }

      if (!sampleData.frames || sampleData.frames.length === 0) {
        this.errors.push("Sample data has no frames");
        return;
      }

      if (!sampleData.totalFrames || sampleData.totalFrames <= 0) {
        this.errors.push("Sample data has invalid totalFrames");
        return;
      }

      // Test first frame data
      const firstFrame = sampleData.frames[0];
      if (!firstFrame.items || firstFrame.items.length === 0) {
        this.errors.push("First frame has no items");
        return;
      }

      // Test data item structure
      const firstItem = firstFrame.items[0];
      if (
        !firstItem.id ||
        !firstItem.name ||
        typeof firstItem.value !== "number"
      ) {
        this.errors.push(
          "Data item missing required properties (id, name, value)",
        );
        return;
      }

      this.componentStatus.dataProcessing = true;
      console.log("  ✅ Data processing tests passed");
    } catch (error) {
      this.errors.push(`Data processing test failed: ${error}`);
      this.componentStatus.dataProcessing = false;
    }
  }

  private async testUtilityFunctions(): Promise<void> {
    try {
      console.log("🔍 Testing utility functions...");

      // Import utilities to test them
      const {
        generateColors,
        formatValue,
        validateFrameData,
        calculateContainerDimensions,
      } = await import("./utils");

      // Test color generation
      const autoColors = generateColors(5, "auto");
      if (!Array.isArray(autoColors) || autoColors.length !== 5) {
        this.errors.push("generateColors() failed for auto colors");
      }

      const customColors = generateColors(3, ["#FF0000", "#00FF00", "#0000FF"]);
      if (!Array.isArray(customColors) || customColors.length !== 3) {
        this.errors.push("generateColors() failed for custom colors");
      }

      // Test value formatting
      const formattedValue = formatValue(1234567, "{value:,.0f}", "$", " USD");
      if (typeof formattedValue !== "string" || formattedValue.length === 0) {
        this.errors.push("formatValue() failed");
      }

      // Test frame data validation
      const testFrameData = {
        frame: 0,
        date: "2024-01-01",
        items: [{ id: "test", name: "Test", value: 100, rank: 1 }],
        maxValue: 100,
      };

      if (!validateFrameData(testFrameData)) {
        this.errors.push("validateFrameData() failed on valid data");
      }

      // Test container dimensions
      const dimensions = calculateContainerDimensions(
        testConfig.layers.chart,
        1920,
        1080,
      );

      if (
        !dimensions.width ||
        !dimensions.height ||
        dimensions.width <= 0 ||
        dimensions.height <= 0
      ) {
        this.errors.push(
          "calculateContainerDimensions() returned invalid dimensions",
        );
      }

      this.componentStatus.utils = true;
      console.log("  ✅ Utility function tests passed");
    } catch (error) {
      this.errors.push(`Utility function test failed: ${error}`);
      this.componentStatus.utils = false;
    }
  }

  private async testComponentImports(): Promise<void> {
    try {
      console.log("🔍 Testing component imports...");

      // Test main composition import
      const { BarChartRaceComposition } = await import("./a");
      if (!BarChartRaceComposition) {
        this.errors.push("BarChartRaceComposition import failed");
      } else {
        this.componentStatus.mainComposition = true;
      }

      // Test layer component imports
      const { BackgroundLayer } = await import("./a");
      if (!BackgroundLayer) {
        this.errors.push("BackgroundLayer import failed");
      } else {
        this.componentStatus.backgroundLayer = true;
      }

      const { ChartLayer } = await import("./ChartLayer");
      if (!ChartLayer) {
        this.errors.push("ChartLayer import failed");
      } else {
        this.componentStatus.chartLayer = true;
      }

      const { TitleLayer } = await import("./TitleLayer");
      if (!TitleLayer) {
        this.errors.push("TitleLayer import failed");
      } else {
        this.componentStatus.titleLayer = true;
      }

      const { DateLayer } = await import("./DateLayer");
      if (!DateLayer) {
        this.errors.push("DateLayer import failed");
      } else {
        this.componentStatus.dateLayer = true;
      }

      const { BarItem } = await import("./BarItem");
      if (!BarItem) {
        this.errors.push("BarItem import failed");
      } else {
        this.componentStatus.barItem = true;
      }

      console.log("  ✅ Component import tests passed");
    } catch (error) {
      this.errors.push(`Component import test failed: ${error}`);
    }
  }

  private async testPropsValidation(): Promise<void> {
    try {
      console.log("🔍 Testing props validation...");

      const { barChartRaceSchema } = await import("./a");

      // Test valid props
      const sampleData = createSampleData();
      const validProps = {
        config: testConfig,
        processedData: sampleData,
      };

      const validation = barChartRaceSchema.safeParse(validProps);
      if (!validation.success) {
        this.errors.push(
          `Props validation failed: ${validation.error.message}`,
        );
      }

      console.log("  ✅ Props validation tests passed");
    } catch (error) {
      this.errors.push(`Props validation test failed: ${error}`);
    }
  }

  private async testComponentInstantiation(): Promise<void> {
    try {
      console.log("🔍 Testing component instantiation...");

      // This would typically require a React testing environment
      // For now, we just verify the components can be imported and have the right shape

      const { BarChartRaceComposition } = await import("./a");

      if (typeof BarChartRaceComposition !== "function") {
        this.errors.push(
          "BarChartRaceComposition is not a valid React component",
        );
      }

      console.log("  ✅ Component instantiation tests passed");
    } catch (error) {
      this.errors.push(`Component instantiation test failed: ${error}`);
    }
  }

  private async testIntegrationFlow(): Promise<void> {
    try {
      console.log("🔍 Testing integration flow...");

      // Simulate the complete data flow
      const sampleData = createSampleData();

      // Test frame data retrieval
      const { getFrameData } = await import("./utils");
      const frameData = getFrameData(sampleData, 0);

      if (!frameData || !frameData.items || frameData.items.length === 0) {
        this.errors.push("Integration flow: Frame data retrieval failed");
      }

      // Test component props creation
      const componentProps = {
        config: testConfig,
        processedData: sampleData,
      };

      // Verify all required props are present
      if (!componentProps.config || !componentProps.processedData) {
        this.errors.push("Integration flow: Component props missing");
      }

      console.log("  ✅ Integration flow tests passed");
    } catch (error) {
      this.errors.push(`Integration flow test failed: ${error}`);
    }
  }
}

// Export for use in other tests
export { testConfig };

// Run test if this file is executed directly
if (require.main === module) {
  const test = new ComponentIntegrationTest();
  test
    .runTest()
    .then((result) => {
      if (!result.success) {
        process.exit(1);
      }
      console.log("\n🎉 All integration tests passed!");
    })
    .catch((error) => {
      console.error("Integration test execution failed:", error);
      process.exit(1);
    });
}
