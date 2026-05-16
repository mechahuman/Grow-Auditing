'use client'

import { PremiumLayout, Card, Button, Badge, Input, GradientText, StatCard } from '@/components/ui'

export default function DesignSystemPage() {
  return (
    <PremiumLayout className="p-6 md:p-12">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-16">
          <GradientText as="h1" gradient="primary" className="text-4xl md:text-5xl mb-4">
            Design System Showcase
          </GradientText>
          <p className="text-[#b0b0c0] text-lg">
            Premium dark theme with vibrant gradients and glassmorphism effects
          </p>
        </div>

        {/* Colors Section */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-6">Color Palette</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card gradient="primary" className="p-6 text-center">
              <p className="text-white font-semibold">Primary</p>
              <p className="text-white/70 text-sm">Magenta → Purple</p>
            </Card>
            <Card gradient="secondary" className="p-6 text-center">
              <p className="text-white font-semibold">Secondary</p>
              <p className="text-white/70 text-sm">Orange → Coral</p>
            </Card>
            <Card gradient="tertiary" className="p-6 text-center">
              <p className="text-black font-semibold">Tertiary</p>
              <p className="text-black/70 text-sm">Cyan → Teal</p>
            </Card>
            <Card className="p-6 text-center">
              <p className="text-white font-semibold">Glass</p>
              <p className="text-[#b0b0c0] text-sm">Frosted effect</p>
            </Card>
          </div>
        </section>

        {/* Buttons Section */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-6">Buttons</h2>
          <div className="flex flex-wrap gap-4">
            <Button variant="primary">Primary Button</Button>
            <Button variant="secondary">Secondary Button</Button>
            <Button variant="tertiary">Tertiary Button</Button>
            <Button variant="ghost">Ghost Button</Button>
            <Button variant="outline">Outline Button</Button>
            <Button disabled>Disabled Button</Button>
          </div>
        </section>

        {/* Badges Section */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-6">Badges</h2>
          <div className="flex flex-wrap gap-3">
            <Badge variant="pink">Pink Badge</Badge>
            <Badge variant="purple">Purple Badge</Badge>
            <Badge variant="orange">Orange Badge</Badge>
            <Badge variant="cyan">Cyan Badge</Badge>
            <Badge variant="teal">Teal Badge</Badge>
            <Badge variant="neutral">Neutral Badge</Badge>
          </div>
        </section>

        {/* Cards Section */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-6">Cards</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-8">
              <h3 className="text-xl font-bold text-white mb-2">Glass Card</h3>
              <p className="text-[#b0b0c0]">
                Frosted glass effect with subtle border and backdrop blur
              </p>
            </Card>
            <Card gradient="primary" className="p-8">
              <h3 className="text-xl font-bold text-white mb-2">Gradient Card</h3>
              <p className="text-white/80">
                Vibrant gradient background with premium feel
              </p>
            </Card>
          </div>
        </section>

        {/* Stat Cards Section */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-6">Stat Cards</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <StatCard label="Total Leads" value="1,234" gradient="primary" icon="📊" />
            <StatCard label="Strong Fits" value="456" gradient="secondary" icon="⭐" />
            <StatCard label="In Progress" value="89" gradient="tertiary" icon="🔄" />
          </div>
        </section>

        {/* Input Section */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-6">Inputs</h2>
          <div className="max-w-md space-y-4">
            <Input placeholder="Search..." label="Basic Input" />
            <Input type="email" placeholder="your@email.com" label="Email Input" />
            <Input type="url" placeholder="https://..." label="URL Input" />
          </div>
        </section>

        {/* Typography Section */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-6">Typography</h2>
          <div className="space-y-6">
            <div>
              <GradientText as="h1" gradient="primary" className="text-4xl mb-2">
                Gradient Heading H1
              </GradientText>
              <p className="text-[#b0b0c0]">Primary gradient text</p>
            </div>
            <div>
              <GradientText as="h2" gradient="secondary" className="text-3xl mb-2">
                Gradient Heading H2
              </GradientText>
              <p className="text-[#b0b0c0]">Secondary gradient text</p>
            </div>
            <div>
              <GradientText as="h3" gradient="tertiary" className="text-2xl mb-2">
                Gradient Heading H3
              </GradientText>
              <p className="text-[#b0b0c0]">Tertiary gradient text</p>
            </div>
          </div>
        </section>

        {/* Effects Section */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-6">Effects & Animations</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card glowing className="p-8">
              <h3 className="text-xl font-bold text-white mb-2">Glowing Effect</h3>
              <p className="text-[#b0b0c0]">
                Cards can have a pink glow for emphasis
              </p>
            </Card>
            <Card className="p-8 hover:shadow-lg transition-shadow duration-300">
              <h3 className="text-xl font-bold text-white mb-2">Hover Effects</h3>
              <p className="text-[#b0b0c0]">
                Smooth transitions on interaction
              </p>
            </Card>
          </div>
        </section>
      </div>
    </PremiumLayout>
  )
}
