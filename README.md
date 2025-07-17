# dynamic-chart-components

A dynamic and customizable chart component library built with React and TypeScript.

## Features

- **Dynamic Chart Rendering:** Easily render different types of charts with customizable data and options.
  - Can add multiple datasets in Line and Area Chart (eg: for comparison).
  - Bar charts with customizable background colors and gradients
  - Donut charts with gaps and customizable rounded corners
  - Interactive tooltips showing data values and percentages
  - Smooth animations and transitions
  - Responsive design with automatic resizing
- **Chart Editor:** Edit chart configurations on the fly for rapid prototyping and visualization.
- **Code Generator:** Generate code snippets for your configured charts to integrate elsewhere.
- **Theme Toggle:** Switch between light and dark themes for better accessibility and user experience.
- **Type Safety:** Built with TypeScript for robust type checking and developer confidence.

## Project Structure

- `src/components/`
  - `Chart.tsx` - Core chart rendering component.
  - `ChartEditor.tsx` - UI for editing chart properties.
  - `CodeGenerator.tsx` - Generates code for configured charts.
  - `DatasetManager.tsx` - Manages multiple dataset implementation.
  - `ThemeToggle.tsx` - Toggle between light and dark themes.
- `src/context/`
  - `ThemeContext.tsx` - Provides theme context for the app.
- `src/types/`
  - `ChartTypes.ts` - Type definitions for chart data and configuration.

## Getting Started

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Run the development server:**

   ```bash
   npm run dev
   ```

3. **Build for production:**
   ```bash
   npm run build
   ```

## Usage

Import and use the chart components in your React application. Customize chart data and options as needed.

## License

MIT
