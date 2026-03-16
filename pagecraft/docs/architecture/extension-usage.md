# Extension Usage

## What It Does

The Chrome extension captures the current authenticated tab from the browser context. It serializes visible DOM nodes, selected styles, images, inline SVG, and same-origin crawl candidates.

## Supported Flow

1. Open the extension popup.
2. Set the backend URL.
3. Choose an existing project or enter a new project name.
4. Capture the current page or generate a style-guide-oriented capture.
5. Preview routes and start a crawl for the current origin.

## Important Constraint

The extension only sees what is available to the active authenticated session and current browser tab. It does not manage credentials on behalf of the user.
