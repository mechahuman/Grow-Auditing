# Premium Dark Theme Design System

A vibrant, premium dark theme with perfect gradients extracted from `ui_inspirations/output_review_screen/image copy 2.png`.

## 🎨 Color Palette

### Primary Gradient: Magenta → Purple
- **Start**: `#ff1493` (Vibrant Pink)
- **End**: `#9c27b0` (Royal Purple)
- **Use**: Primary buttons, main CTAs, key highlights

### Secondary Gradient: Orange → Coral
- **Start**: `#ff8c00` (Dark Orange)
- **End**: `#ff6b6b` (Coral)
- **Use**: Secondary actions, warnings, alternative CTAs

### Tertiary Gradient: Cyan → Teal
- **Start**: `#00d9ff` (Cyan)
- **End**: `#00e5cc` (Teal)
- **Use**: Success states, information highlights, accents

### Base Colors
- **Background**: `#0f0f23` (Deep Navy)
- **Background Alt**: `#1a1a2e`
- **Surface**: `#16213e` (Glassmorphism base)
- **Surface Light**: `#0f3460`
- **Border**: `#2a2a4e`
- **Text Primary**: `#ffffff`
- **Text Secondary**: `#b0b0c0` (Medium gray)
- **Text Muted**: `#808090` (Dark gray)

## 🧩 UI Components

### Card Component
```tsx
import { Card } from '@/components/ui'

// Glass card with frosted effect
<Card className="p-6">
  Content here
</Card>

// Gradient card (primary)
<Card gradient="primary" className="p-6">
  Content here
</Card>

// With glow effect
<Card glowing className="p-6">
  Content here
</Card>
```

**Props:**
- `gradient`: `'primary' | 'secondary' | 'tertiary' | 'none'` (default: 'none')
- `glowing`: boolean (default: false)
- `className`: string for additional classes

### Button Component
```tsx
import { Button } from '@/components/ui'

<Button variant="primary">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="tertiary">Tertiary</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="outline">Outline</Button>
<Button size="lg">Large Button</Button>
```

**Props:**
- `variant`: `'primary' | 'secondary' | 'tertiary' | 'ghost' | 'outline'`
- `size`: `'sm' | 'md' | 'lg'`
- `disabled`: boolean
- `onClick`: function
- `type`: `'button' | 'submit' | 'reset'`

### Badge Component
```tsx
import { Badge } from '@/components/ui'

<Badge variant="pink">Active</Badge>
<Badge variant="purple">Feature</Badge>
<Badge variant="orange">Warning</Badge>
<Badge variant="cyan">Info</Badge>
<Badge variant="teal">Success</Badge>
<Badge variant="neutral">Neutral</Badge>
```

**Props:**
- `variant`: `'pink' | 'purple' | 'orange' | 'cyan' | 'teal' | 'neutral'`

### Input Component
```tsx
import { Input } from '@/components/ui'

<Input 
  label="Email"
  type="email"
  placeholder="your@email.com"
  value={value}
  onChange={handleChange}
/>
```

**Props:**
- `type`: string (default: 'text')
- `placeholder`: string
- `value`: string
- `onChange`: function
- `label`: string
- `disabled`: boolean
- `icon`: React node

### GradientText Component
```tsx
import { GradientText } from '@/components/ui'

<GradientText as="h1" gradient="primary">
  Your Heading
</GradientText>
```

**Props:**
- `as`: `'h1' | 'h2' | 'h3' | 'h4' | 'span' | 'p'`
- `gradient`: `'primary' | 'secondary' | 'tertiary'`

### StatCard Component
```tsx
import { StatCard } from '@/components/ui'

<StatCard 
  label="Total Leads"
  value="1,234"
  gradient="primary"
  icon="📊"
/>
```

**Props:**
- `label`: string
- `value`: string | number
- `icon`: React node
- `gradient`: `'primary' | 'secondary' | 'tertiary' | 'none'`

### PremiumLayout Component
```tsx
import { PremiumLayout } from '@/components/ui'

export default function Page() {
  return (
    <PremiumLayout>
      {/* Your content */}
    </PremiumLayout>
  )
}
```

**Props:**
- `showGlobe`: boolean (default: true) - Shows animated gradient orbs in background
- `className`: string for wrapper classes

## ✨ Effects & Animations

### Glassmorphism
Cards use `backdrop-blur-md` with semi-transparent backgrounds:
```tsx
<div className="bg-[#16213e]/40 backdrop-blur-md border border-[#2a2a4e]">
  Frosted glass effect
</div>
```

### Glowing Effects
- `shadow-glow-pink`: Pink glow (used for primary elements)
- `shadow-glow-pink-lg`: Larger pink glow
- `shadow-glow-purple`: Purple glow
- `shadow-glow-orange`: Orange glow

### Animations
- `animate-pulse-slow`: Slow pulsing effect (4s)
- `animate-float`: Floating animation (8s)
- `animate-shimmer`: Shimmer effect (2s)

## 🎯 Usage Examples

### Dashboard Card with Stats
```tsx
import { Card, StatCard } from '@/components/ui'

export function Dashboard() {
  return (
    <div className="grid md:grid-cols-3 gap-4">
      <StatCard 
        label="Strong Fits" 
        value="456" 
        gradient="primary"
        icon="⭐"
      />
      <StatCard 
        label="In Progress" 
        value="89" 
        gradient="secondary"
        icon="🔄"
      />
      <StatCard 
        label="Reviewed" 
        value="234" 
        gradient="tertiary"
        icon="✅"
      />
    </div>
  )
}
```

### Form Section
```tsx
import { Card, Input, Button, GradientText } from '@/components/ui'

export function Form() {
  return (
    <Card className="p-8">
      <GradientText as="h2" gradient="primary" className="text-2xl mb-6">
        Enter Lead Details
      </GradientText>
      
      <div className="space-y-4">
        <Input label="Lead Name" placeholder="Name..." />
        <Input label="Email" type="email" placeholder="email@..." />
        <Input label="Website" type="url" placeholder="https://..." />
      </div>

      <Button variant="primary" className="mt-6 w-full">
        Save Lead
      </Button>
    </Card>
  )
}
```

### Badge Status Display
```tsx
import { Badge } from '@/components/ui'

export function StatusBadge({ status }) {
  const variantMap = {
    'strong': 'pink',
    'solid': 'purple',
    'weak': 'orange',
    'poor': 'neutral',
  }

  return <Badge variant={variantMap[status]}>{status}</Badge>
}
```

## 📱 Responsive Design

All components are built with Tailwind's responsive utilities:
```tsx
<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Cards stack on mobile, 2 on tablet, 3 on desktop */}
</div>
```

## 🎨 Tailwind Integration

The design system is fully integrated with Tailwind CSS. New colors available:
```tsx
// Utility classes
bg-dark-bg        // #0f0f23
bg-dark-surface   // #16213e
text-accent-pink  // #ff1493
text-accent-cyan  // #00d9ff

// Gradients
bg-gradient-to-r from-[#ff1493] to-[#9c27b0]
bg-gradient-to-br from-[#ff8c00] to-[#ff6b6b]
```

## 🔗 View the Design System

Visit `/design-system` to see a complete showcase of all components and effects.

## 📋 Implementation Checklist

- [x] Color palette tokens defined
- [x] Tailwind config updated
- [x] Card component
- [x] Button component
- [x] Badge component
- [x] Input component
- [x] GradientText component
- [x] StatCard component
- [x] PremiumLayout component
- [x] Design system page (showcase)
- [ ] Apply to Login screen
- [ ] Apply to Lead Entering screen
- [ ] Apply to Progress screen
- [ ] Apply to Saved Leads Dashboard
- [ ] Apply to Output/Review screen
- [ ] Apply to Edit/View pages
