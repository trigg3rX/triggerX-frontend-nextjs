# Developer Checklist

## Before Pushing Code

### Responsive Design

- [ ] Test on mobile (320px+)
- [ ] Test on tablet (768px+)
- [ ] Test on desktop (1024px+)
- [ ] Test on large screens (1440px+)
- [ ] Ensure text doesn't wrap inappropriately in buttons, navigation, and critical UI elements
- [ ] Verify images and media scale properly without overflow or distortion
- [ ] Check that interactive elements have proper hover feedback on desktop
- [ ] Show "Please open on desktop/laptop" message for mobile users if website isn't fully responsive

### TypeScript & Code Quality

- [ ] Define TypeScript types properly with no `any` types unless absolutely necessary
- [ ] Respect maximum line length of 80-120 characters per line
- [ ] Apply Prettier formatting for consistent code style
- [ ] Type all component props with TypeScript interfaces
- [ ] Place files in correct folders following the established folder structure
- [ ] Remove unused imports and clean up dependencies

### Performance & Optimization

- [ ] Use `next/image` for image optimization
- [ ] Use SVG for icons/logos and PNG for complex, non-scalable vectors
- [ ] Only use GIFs for short, simple animations
- [ ] Prefer video (WebM → MP4 → alt text/fallback image)
- [ ] Prefer `next/font` for font loading
- [ ] If not using `next/font`, preload fonts and use `font-display: swap`
- [ ] Run `depcheck` to remove unused packages
- [ ] Remove `console.log` statements, especially in fetch or compute-heavy code
- [ ] Dynamically import components using external libraries (e.g., GSAP, Chart.js)
- [ ] Run Lighthouse audit in Chrome
- [ ] Use `@next/bundle-analyzer` to analyze and optimize bundle size
- [ ] Use IntersectionObserver for lazy loading heavy/calculated components

### API & Data Handling

- [ ] Implement proper loading/error handling for async operations
- [ ] Optimize API calls with no redundant requests and proper caching
- [ ] Display proper 404 error pages for non-existent API endpoints or routes

### Accessibility & Navigation

- [ ] Ensure all interactive elements work with keyboard navigation
- [ ] Verify all links and routing work correctly
- [ ] Use lowercase with hyphens (kebab-case) for URLs (e.g., `/user-profile`, not `/UserProfile`)

### Browser Compatibility

- [ ] Test functionality in Chrome
- [ ] Test functionality in Firefox
- [ ] Test functionality in Safari
- [ ] Test functionality in Edge

### Version Control

- [ ] Write clear, concise commit messages describing changes
- [ ] Keep package.json and lock files consistent with properly installed dependencies
- [ ] Resolve any merge conflicts properly

## Quick Reference

### Image Optimization

- Use `next/image` for automatic optimization
- SVG for icons/logos
- PNG for complex, non-scalable vectors
- GIFs only for short animations
- Video format priority: WebM → MP4 → fallback

### Performance Tools

- Lighthouse audit
- Bundle analyzer
- Depcheck
- IntersectionObserver for lazy loading

### Code Quality Tools

- Prettier
- TypeScript
- ESLint

Remember: If it's missing, it's messing. Patch it before you push it.
