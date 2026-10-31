# Development Guide - Hisab Ledger Frontend

## 🛠️ Development Setup

### Prerequisites
- Node.js 16+ (check: `node --version`)
- npm 8+ (check: `npm --version`)
- Git
- Code editor (VS Code recommended)
- Django backend running locally

### Initial Setup
```bash
cd frontend
npm install
npm run dev
```

---

## 📝 Development Workflow

### Making a Change

1. **Create a branch** (optional but recommended):
   ```bash
   git checkout -b feature/my-feature
   ```

2. **Make changes** to `.tsx` or `.ts` files

3. **Test locally**:
   - App hot-reloads automatically
   - Check browser console for errors
   - Test in mobile view

4. **Commit changes**:
   ```bash
   git add .
   git commit -m "feat: add my feature"
   ```

5. **Build & test**:
   ```bash
   npm run build
   npm run preview
   ```

---

## 🎯 Common Development Tasks

### Adding a New Feature

#### 1. Add a New Page
```typescript
// src/pages/NewFeature.tsx
import React from 'react';

export const NewFeature: React.FC = () => {
  return (
    <div className="container-main">
      <div className="content-section">
        <h1>New Feature</h1>
      </div>
    </div>
  );
};
```

#### 2. Add Route to App.tsx
```typescript
import { NewFeature } from './pages/NewFeature';

<Routes>
  {/* existing routes */}
  <Route path="/new-feature" element={<NewFeature />} />
</Routes>
```

#### 3. Add Navigation Link
```typescript
// In Header.tsx navigation
<Link to="/new-feature" className="text-gray-600 hover:text-gray-900 font-medium transition">
  New Feature
</Link>
```

### Adding a New Component

```typescript
// src/components/MyComponent.tsx
import React from 'react';

interface MyComponentProps {
  title: string;
  onClick?: () => void;
}

export const MyComponent: React.FC<MyComponentProps> = ({ title, onClick }) => {
  return (
    <div className="card" onClick={onClick}>
      <h3 className="font-bold">{title}</h3>
    </div>
  );
};
```

Export it:
```typescript
// Add to src/components/index.ts
export { MyComponent } from './MyComponent';
```

### Adding API Functionality

```typescript
// In src/api/client.ts
export const api = {
  // existing methods...
  
  myNewFunction: async (id: string) => {
    const response = await apiClient.get<YourType>(`/your-endpoint/${id}/`);
    return response.data;
  },
};
```

Use in component:
```typescript
const [data, setData] = useState(null);

useEffect(() => {
  const fetchData = async () => {
    try {
      const result = await api.myNewFunction(id);
      setData(result);
    } catch (error) {
      console.error('Error:', error);
    }
  };
  
  fetchData();
}, [id]);
```

---

## 🎨 Styling Guide

### Using Tailwind CSS

#### Basic Structure
```typescript
export const MyComponent = () => {
  return (
    <div className="card">  {/* Pre-defined card style */}
      <h2 className="text-lg font-bold text-gray-900">Title</h2>
      <p className="text-gray-500 mt-2">Description</p>
      <button className="btn-primary mt-4">Action</button>
    </div>
  );
};
```

#### Common Classes

**Text:**
```tsx
<h1 className="text-3xl font-bold">Heading</h1>     {/* Large heading */}
<h2 className="text-lg font-semibold">Subheading</h2>
<p className="text-gray-500 text-sm">Small text</p>   {/* Muted text */}
```

**Colors:**
```tsx
{/* Text colors */}
<span className="text-blue-600">Blue</span>
<span className="text-green-600">Green</span>
<span className="text-red-600">Red</span>
<span className="text-orange-600">Orange</span>

{/* Background colors */}
<div className="bg-blue-50">Light blue background</div>
<div className="bg-green-100">Green background</div>
```

**Spacing:**
```tsx
<div className="mt-4">Margin top</div>      {/* 4 * 0.25rem = 1rem */}
<div className="mb-6">Margin bottom</div>   {/* 6 * 0.25rem = 1.5rem */}
<div className="px-4 py-2">Padding</div>    {/* Horizontal & vertical */}
<div className="gap-2">Gap between items</div>
```

**Layout:**
```tsx
{/* Flexbox */}
<div className="flex items-center justify-between gap-4">
  <div>Left</div>
  <div>Right</div>
</div>

{/* Grid */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <div>Column 1</div>
  <div>Column 2</div>
  <div>Column 3</div>
</div>

{/* Responsive */}
<div className="text-sm md:text-base lg:text-lg">
  Size changes by screen size
</div>
```

**Buttons:**
```tsx
<button className="btn-primary">Primary</button>
<button className="btn-secondary">Secondary</button>
<button className="btn-success">Success</button>
<button className="btn-danger">Danger</button>
<button className="btn-lg">Large</button>
<button className="btn-primary btn-lg">Large Primary</button>
```

### Custom Styles
Only create custom CSS when Tailwind classes aren't sufficient:

```typescript
// src/components/MyComponent.tsx
import './my-component.css';

export const MyComponent = () => {
  return <div className="my-custom-style">Custom style</div>;
};
```

```css
/* my-component.css */
.my-custom-style {
  /* Only add custom styles when necessary */
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

---

## 🧪 Testing During Development

### Manual Testing Checklist

#### Desktop (1920x1080)
- [ ] All elements visible
- [ ] No overflow
- [ ] Buttons clickable
- [ ] Forms submit correctly

#### Tablet (768x1024)
- [ ] Two-column layouts work
- [ ] Touch targets large enough
- [ ] Text readable
- [ ] Navigation accessible

#### Mobile (375x667)
- [ ] Single column layout
- [ ] Full width content
- [ ] Touch buttons > 48px
- [ ] No horizontal scroll

#### API Testing
- [ ] Add customer works
- [ ] Search functions
- [ ] Balance updates
- [ ] Payments recorded
- [ ] Error messages display

#### Cross-Browser
- [ ] Chrome/Edge
- [ ] Firefox
- [ ] Safari
- [ ] Mobile browsers

### Using DevTools

**Chrome/Edge:**
1. Press `F12` to open DevTools
2. Use `Console` tab to see errors
3. Use `Network` tab to check API calls
4. Use `Application` tab to check localStorage

**Responsive Design:**
1. Press `Ctrl+Shift+M` (or `Cmd+Shift+M` on Mac)
2. Select device from dropdown
3. Test all screen sizes

### Debugging

```typescript
// Log component render
console.log('Component rendered', props);

// Log API calls
console.log('API Call:', url, data);

// Log state updates
console.log('State updated:', prevState, newState);

// Conditional logging in development
if (import.meta.env.DEV) {
  console.log('Development only log');
}
```

---

## 🔍 Type Safety with TypeScript

### Define Data Types

```typescript
// Create interfaces for all API responses
interface Customer {
  id: string;
  name: string;
  phone_number: string;
  current_balance: number;
  status: 'active' | 'inactive' | 'suspended';
}

// Use types in components
interface DashboardProps {
  customerId: string;
  onUpdate?: (customer: Customer) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ customerId, onUpdate }) => {
  const [customer, setCustomer] = useState<Customer | null>(null);
  
  // TypeScript knows customer is Customer | null
  // Will error if you access properties that don't exist
};
```

### Common Type Patterns

```typescript
// Optional properties
interface Form {
  name: string;
  email?: string;        // Optional
  notes?: string | null; // Optional or null
}

// Union types
type EntryType = 'credit' | 'debit' | 'other';

// Generic types
interface ApiResponse<T> {
  data: T;
  status: 'success' | 'error';
}

// Function types
type OnClickHandler = (event: React.MouseEvent<HTMLButtonElement>) => void;

// Event types
const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const value = e.target.value;
};
```

---

## 🚨 Error Handling

### API Error Handling
```typescript
try {
  const data = await api.getCustomers();
  setCustomers(data);
} catch (error: any) {
  // Handle different error types
  if (error.response?.status === 404) {
    setError('Customer not found');
  } else if (error.response?.status === 401) {
    // Redirect to login
    window.location.href = '/login';
  } else {
    setError(error.message || 'An error occurred');
  }
}
```

### Form Validation
```typescript
const validateForm = (): boolean => {
  const errors: Record<string, string> = {};
  
  if (!formData.name) {
    errors.name = 'Name is required';
  } else if (formData.name.length < 2) {
    errors.name = 'Name must be at least 2 characters';
  }
  
  if (!formData.email) {
    errors.email = 'Email is required';
  } else if (!formData.email.includes('@')) {
    errors.email = 'Invalid email';
  }
  
  setErrors(errors);
  return Object.keys(errors).length === 0;
};
```

---

## ⚡ Performance Tips

### Optimize Renders
```typescript
// ❌ Bad - re-renders all customers on every keystroke
const CustomerList = ({ customers }) => {
  const [search, setSearch] = useState('');
  
  return (
    <>
      <input value={search} onChange={(e) => setSearch(e.target.value)} />
      {customers.map(c => <CustomerCard key={c.id} customer={c} />)}
    </>
  );
};

// ✅ Good - filters before rendering
const CustomerList = ({ customers }) => {
  const [search, setSearch] = useState('');
  
  const filtered = customers.filter(c => 
    c.name.includes(search)
  );
  
  return (
    <>
      <input value={search} onChange={(e) => setSearch(e.target.value)} />
      {filtered.map(c => <CustomerCard key={c.id} customer={c} />)}
    </>
  );
};
```

### Memoize Components
```typescript
// ✅ Only re-render when props change
const CustomerCard = React.memo(({ customer }: { customer: Customer }) => {
  return <div>{customer.name}</div>;
});
```

### Batch Updates
```typescript
// ✅ Update state once instead of multiple times
const handleSubmit = async () => {
  try {
    const [customers, payments] = await Promise.all([
      api.getCustomers(),
      api.getPayments(),
    ]);
    
    setCustomers(customers);
    setPayments(payments);
  } catch (error) {
    setError(error.message);
  }
};
```

---

## 🔐 Security Best Practices

### Input Validation
```typescript
// ✅ Always validate user input
const handleInput = (value: string) => {
  // Remove potentially dangerous characters
  const sanitized = value.trim().substring(0, 100);
  setInput(sanitized);
};
```

### API Security
```typescript
// ✅ Never expose secrets in code
const API_URL = import.meta.env.VITE_API_URL;
// Not: const API_URL = 'http://localhost:8000/api';

// ✅ Use environment variables
// ✅ Validate responses from API
// ✅ Handle CORS properly
```

### State Management
```typescript
// ❌ Don't store sensitive data
const [password, setPassword] = useState('');  // Bad

// ✅ Let backend handle sensitive data
// Frontend only stores: auth token (in localStorage)
const token = localStorage.getItem('authToken');
```

---

## 📚 Useful Commands

```bash
# Development
npm run dev              # Start dev server
npm run type-check      # Check TypeScript errors
npm run lint            # Lint code

# Building
npm run build           # Create production build
npm run preview         # Preview production build

# Debugging
npm run build --mode analyze  # Analyze bundle size

# Cleanup
rm -rf node_modules     # Remove dependencies
npm install             # Reinstall dependencies
```

---

## 🐛 Debugging Tips

### Check Network Requests
1. Open DevTools (F12)
2. Go to Network tab
3. Perform action
4. See API call request/response
5. Check headers and body

### Check State/Props
1. Install React DevTools browser extension
2. Go to Components tab
3. Select component
4. See all props and state

### Check Console Errors
1. Open DevTools (F12)
2. Go to Console tab
3. Look for red error messages
4. Click on error to see source code

### Use Debugger
```typescript
const handleClick = () => {
  debugger;  // Execution pauses here
  // Step through code using DevTools
};
```

---

## 📖 Recommended Resources

- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [React Router Docs](https://reactrouter.com)
- [Axios Documentation](https://axios-http.com/docs/intro)

---

## 🎯 Code Quality Standards

### Before Committing

- [ ] Code builds without errors: `npm run build`
- [ ] No console errors: `npm run dev`
- [ ] Types check: `npm run type-check`
- [ ] Code style: `npm run lint`
- [ ] Tested manually on mobile/desktop
- [ ] Comments added for complex logic
- [ ] Removed debug console.logs
- [ ] Commit message is descriptive

### Commit Message Format
```
feat: add new customer feature
fix: correct balance calculation bug
docs: update README with setup instructions
style: format code with prettier
refactor: extract header component
test: add customer list tests
```

---

## 🚀 Ready to Develop!

You now have everything needed to:
- ✅ Set up the development environment
- ✅ Add new features
- ✅ Fix bugs
- ✅ Improve performance
- ✅ Deploy with confidence

Start by checking the current codebase and making your first contribution!

---

**Happy coding! 💻**
