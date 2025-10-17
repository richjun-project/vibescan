# VibeScan Design System - Apple Inspired

## Design Philosophy
- **Simplicity First**: Remove unnecessary elements
- **Generous Whitespace**: Let content breathe
- **Subtle Depth**: Minimal shadows and elevations
- **Blue Accent**: Primary color inspired by SF Blue
- **Clear Hierarchy**: Typography-driven structure

## Color Palette

### Primary Colors
- **Primary Blue**: `#007AFF` - Main action color (SF Blue)
- **Primary Blue Hover**: `#0051D5` - Hover state
- **Primary Blue Light**: `#E5F2FF` - Light background



### Neutrals
- **Background**: `#FFFFFF` - Pure white
- **Background Secondary**: `#F9FAFB` - Light gray (Apple gray-50)
- **Background Tertiary**: `#F3F4F6` - Card background (Apple gray-100)
- **Border**: `#E5E7EB` - Subtle borders (Apple gray-200)
- **Text Primary**: `#1D1D1F` - Apple's near-black
- **Text Secondary**: `#6E6E73` - Apple's gray
- **Text Tertiary**: `#86868B` - Subtle text

### Status Colors
- **Success**: `#34C759` - SF Green
- **Warning**: `#FF9F0A` - SF Orange
- **Error**: `#FF3B30` - SF Red
- **Info**: `#5AC8FA` - SF Light Blue

### Severity Colors (Security)
- **Critical**: `#FF3B30` - Red
- **High**: `#FF9F0A` - Orange
- **Medium**: `#FFCC00` - Yellow
- **Low**: `#34C759` - Green
- **Info**: `#007AFF` - Blue

## Typography

### Font Family
- System font stack: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`
- Monospace: `"SF Mono", Monaco, Consolas, monospace`

### Font Sizes
- **xs**: 12px / 0.75rem
- **sm**: 14px / 0.875rem
- **base**: 16px / 1rem (body text)
- **lg**: 18px / 1.125rem
- **xl**: 20px / 1.25rem
- **2xl**: 24px / 1.5rem
- **3xl**: 28px / 1.75rem (section titles)
- **4xl**: 32px / 2rem
- **5xl**: 40px / 2.5rem (page titles)
- **6xl**: 48px / 3rem (hero titles)

### Font Weights
- **Regular**: 400
- **Medium**: 500
- **Semibold**: 600 (headings)
- **Bold**: 700 (emphasis)

### Line Heights
- **Tight**: 1.2 (headings)
- **Normal**: 1.5 (body)
- **Relaxed**: 1.75 (large text)

## Spacing

Using 4px base unit:
- **0**: 0px
- **1**: 4px
- **2**: 8px
- **3**: 12px
- **4**: 16px
- **5**: 20px
- **6**: 24px
- **8**: 32px
- **10**: 40px
- **12**: 48px
- **16**: 64px
- **20**: 80px
- **24**: 96px

## Border Radius

- **sm**: 6px - Small elements (badges, tags)
- **base**: 8px - Inputs, small buttons
- **md**: 10px - Cards, medium buttons
- **lg**: 12px - Large cards
- **xl**: 16px - Hero cards
- **2xl**: 20px - Modal dialogs
- **full**: 9999px - Pills, circular buttons

## Shadows

Apple uses very subtle shadows:

- **xs**: `0 1px 2px 0 rgba(0, 0, 0, 0.05)`
- **sm**: `0 1px 3px 0 rgba(0, 0, 0, 0.08)`
- **base**: `0 2px 8px 0 rgba(0, 0, 0, 0.1)`
- **md**: `0 4px 12px 0 rgba(0, 0, 0, 0.1)`
- **lg**: `0 8px 24px 0 rgba(0, 0, 0, 0.12)`
- **xl**: `0 12px 40px 0 rgba(0, 0, 0, 0.15)`

## Components

### Buttons

**Primary Button**
- Background: `#007AFF`
- Text: White
- Padding: 12px 24px
- Border-radius: 10px
- Font-weight: 600
- Hover: `#0051D5`
- Shadow: sm on hover

**Secondary Button**
- Background: `#F3F4F6`
- Text: `#1D1D1F`
- Padding: 12px 24px
- Border-radius: 10px
- Font-weight: 600
- Hover: `#E5E7EB`

**Ghost Button**
- Background: Transparent
- Text: `#007AFF`
- Padding: 12px 24px
- Font-weight: 600
- Hover: `#F3F4F6`

### Cards

- Background: White
- Border: 1px solid `#E5E7EB`
- Border-radius: 12px
- Padding: 24px
- Shadow: sm
- Hover: shadow-md transition

### Badges

- Border-radius: 6px
- Padding: 4px 12px
- Font-size: 12px
- Font-weight: 600
- Letter-spacing: 0.5px

### Inputs

- Background: `#F9FAFB`
- Border: 1px solid `#E5E7EB`
- Border-radius: 8px
- Padding: 12px 16px
- Font-size: 16px
- Focus: Border `#007AFF`, Shadow blue

## Layout Principles

1. **Max Width**: 1200px for content
2. **Container Padding**: 24px (mobile) / 48px (desktop)
3. **Section Spacing**: 80px vertical
4. **Card Spacing**: 16px grid gap
5. **Generous Margins**: Never crowd elements

## Animation

- **Duration**: 150ms (quick) / 300ms (standard)
- **Easing**: `cubic-bezier(0.4, 0.0, 0.2, 1)` (Apple's standard)
- **Hover States**: Always smooth transitions
- **Loading States**: Subtle pulse or skeleton

## Accessibility

- **Focus States**: 2px blue ring with offset
- **Contrast Ratios**: Minimum 4.5:1 for text
- **Touch Targets**: Minimum 44x44px
- **Keyboard Navigation**: Full support
