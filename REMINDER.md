# Code Reminders

## When Writing Components

### TypeScript

```typescript
// ❌ Don't use any
const data: any = fetchData();

// ✅ Use proper types
interface UserData {
  id: string;
  name: string;
  email: string;
}
const data: UserData = fetchData();
```

### Image Handling

```typescript
// ❌ Don't use regular img tag
<img src="/logo.png" alt="logo" />

// ✅ Use next/image
import Image from 'next/image';
<Image
  src="/logo.png"
  alt="logo"
  width={100}
  height={100}
  priority={true} // for above-the-fold images
/>
```

### Font Loading

```typescript
// ❌ Don't use regular font loading
<link href="https://fonts.googleapis.com/css2?family=Roboto&display=swap" rel="stylesheet">

// ✅ Use next/font
import { Roboto } from 'next/font/google';
const roboto = Roboto({
  weight: ['400', '700'],
  subsets: ['latin'],
  display: 'swap',
});
```

### Dynamic Imports

```typescript
// ❌ Don't import heavy libraries directly
import Chart from 'chart.js';

// ✅ Use dynamic imports
import dynamic from 'next/dynamic';
const Chart = dynamic(() => import('chart.js'), {
  ssr: false,
  loading: () => <p>Loading chart...</p>
});
```

### API Calls

```typescript
// ❌ Don't forget error handling
const data = await fetch("/api/data");

// ✅ Implement proper error handling
try {
  const response = await fetch("/api/data");
  if (!response.ok) throw new Error("API call failed");
  const data = await response.json();
} catch (error) {
  console.error("Error fetching data:", error);
  // Handle error appropriately
}
```

### Responsive Design

```css
/* ❌ Don't use fixed widths */
.button {
  width: 200px;
}

/* ✅ Use responsive units */
.button {
  width: 100%;
  max-width: 200px;
}

/* ✅ Use media queries for breakpoints */
@media (min-width: 768px) {
  .container {
    padding: 2rem;
  }
}
```

### Accessibility

```typescript
// ❌ Don't forget keyboard navigation
<div onClick={handleClick}>Click me</div>

// ✅ Make it keyboard accessible
<div
  onClick={handleClick}
  onKeyDown={(e) => e.key === 'Enter' && handleClick()}
  role="button"
  tabIndex={0}
>
  Click me
</div>
```

## Quick Tips

1. **Before Pushing:**

   - Run `npm run lint` to check for issues
   - Run `npm run build` to ensure build succeeds
   - Check bundle size with `@next/bundle-analyzer`
   - Run Lighthouse audit

2. **Performance:**

   - Use `useMemo` and `useCallback` for expensive computations
   - Implement proper loading states
   - Use proper caching strategies
   - Lazy load below-the-fold content

3. **Code Style:**

   - Keep lines under 120 characters
   - Use meaningful variable names
   - Add proper comments for complex logic
   - Follow the established folder structure

4. **Testing:**
   - Test on all required screen sizes
   - Test in all required browsers
   - Verify keyboard navigation
   - Check for proper error handling

Remember: Quality code is maintainable code. Take the time to do it right!
