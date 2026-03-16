# Plugin Usage

## What It Does

The Figma plugin connects to the backend and imports:

- project exports
- page exports
- style tokens
- pattern-derived components
- warnings and summary notes

## Import Modes

- `Faithful`: prioritizes placement fidelity.
- `Editable`: prefers auto-layout and reusable components.
- `Style Guide Only`: builds style guide and major components without full page layers.

## Output Pages

- `Cover / Import Summary`
- `Style Guide`
- `Components`
- `Imported Pages`

## Recommended Flow

1. Capture or crawl pages from the dashboard or extension.
2. Open the Figma plugin.
3. Set the backend URL.
4. Choose a project and page.
5. Select the import mode and toggles.
6. Import into Figma and review warnings.
