import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Bot, Zap, Shield, BarChart3, ArrowRight, Code2, Layers, Workflow } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="glass border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 group">
              <div className="relative">
                <Bot className="h-8 w-8 text-primary group-hover:scale-110 transition-all duration-300" />
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl group-hover:bg-primary/30 transition-all duration-300" />
              </div>
              <span className="text-2xl font-bold gradient-text">AI API Builder</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/login">
                <Button
                  variant="ghost"
                  className="text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-300"
                >
                  Sign In
                </Button>
              </Link>
              <Link href="/register">
                <Button className="btn-premium bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        {/* Premium background pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-muted/30 via-background to-muted/20" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(16,185,129,0.1),transparent_50%),radial-gradient(circle_at_70%_80%,rgba(52,211,153,0.1),transparent_50%)]" />

        <div className="container mx-auto px-6 py-24 relative">
          <div className="text-center max-w-5xl mx-auto">
            <div className="animate-fade-in">
              <Badge className="mb-8 bg-primary/10 text-primary/80 hover:bg-primary/20 border border-primary/20 px-4 py-2 text-sm font-medium">
                Enterprise AI Platform
              </Badge>
            </div>

            <div className="animate-slide-up">
              <h1 className="text-6xl lg:text-7xl font-bold mb-8 text-balance leading-tight">
                Build <span className="gradient-text">Powerful AI APIs</span>
                <br />
                Without Writing Code
              </h1>
            </div>

            <div className="animate-fade-in" style={{ animationDelay: "0.2s" }}>
              <p className="text-xl text-muted-foreground mb-12 text-pretty max-w-3xl mx-auto leading-relaxed">
                Create, deploy, and manage enterprise-grade AI-powered APIs using our intuitive visual interface.
                Transform complex AI workflows into production-ready endpoints in minutes, not months.
              </p>
            </div>

            <div
              className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in"
              style={{ animationDelay: "0.4s" }}
            >
              <Link href="/register">
                <Button
                  size="lg"
                  className="btn-premium bg-primary hover:bg-primary/90 text-primary-foreground shadow-xl hover:shadow-2xl px-8 py-4 text-lg font-semibold"
                >
                  Start Building Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-border hover:bg-muted/50 px-8 py-4 text-lg font-semibold transition-all duration-300 bg-transparent"
                >
                  <Code2 className="mr-2 h-5 w-5" />
                  View Live Demo
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6 gradient-text">Everything You Need</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Enterprise-grade features designed to accelerate AI development and deployment at scale
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="glass hover:shadow-xl transition-all duration-500 group border-border/50 hover:border-primary/30">
              <CardHeader className="p-8">
                <div className="mb-4 relative">
                  <Workflow className="h-12 w-12 text-primary group-hover:scale-110 transition-all duration-300" />
                  <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-all duration-300" />
                </div>
                <CardTitle className="text-xl font-bold mb-3">Visual Workflow Builder</CardTitle>
                <CardDescription className="text-muted-foreground leading-relaxed">
                  Design complex AI pipelines with our intuitive drag-and-drop interface. Connect models,
                  transformations, and APIs visually without writing a single line of code.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="glass hover:shadow-xl transition-all duration-500 group border-border/50 hover:border-primary/30">
              <CardHeader className="p-8">
                <div className="mb-4 relative">
                  <Shield className="h-12 w-12 text-primary group-hover:scale-110 transition-all duration-300" />
                  <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-all duration-300" />
                </div>
                <CardTitle className="text-xl font-bold mb-3">Enterprise Security</CardTitle>
                <CardDescription className="text-muted-foreground leading-relaxed">
                  Built-in SOC 2 compliance, end-to-end encryption, and comprehensive audit logging. Deploy with
                  confidence knowing your AI APIs meet enterprise security standards.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="glass hover:shadow-xl transition-all duration-500 group border-border/50 hover:border-primary/30">
              <CardHeader className="p-8">
                <div className="mb-4 relative">
                  <BarChart3 className="h-12 w-12 text-primary group-hover:scale-110 transition-all duration-300" />
                  <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-all duration-300" />
                </div>
                <CardTitle className="text-xl font-bold mb-3">Advanced Analytics</CardTitle>
                <CardDescription className="text-muted-foreground leading-relaxed">
                  Real-time performance monitoring, cost optimization insights, and detailed usage analytics. Make
                  data-driven decisions to scale your AI infrastructure efficiently.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="glass hover:shadow-xl transition-all duration-500 group border-border/50 hover:border-primary/30">
              <CardHeader className="p-8">
                <div className="mb-4 relative">
                  <Zap className="h-12 w-12 text-primary group-hover:scale-110 transition-all duration-300" />
                  <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-all duration-300" />
                </div>
                <CardTitle className="text-xl font-bold mb-3">Lightning Fast Deployment</CardTitle>
                <CardDescription className="text-muted-foreground leading-relaxed">
                  Deploy AI APIs to production in seconds with our global edge network. Automatic scaling, load
                  balancing, and 99.9% uptime SLA included.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="glass hover:shadow-xl transition-all duration-500 group border-border/50 hover:border-primary/30">
              <CardHeader className="p-8">
                <div className="mb-4 relative">
                  <Layers className="h-12 w-12 text-primary group-hover:scale-110 transition-all duration-300" />
                  <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-all duration-300" />
                </div>
                <CardTitle className="text-xl font-bold mb-3">Multi-Model Support</CardTitle>
                <CardDescription className="text-muted-foreground leading-relaxed">
                  Integrate with leading AI providers including OpenAI, Anthropic, Google, and more. Switch between
                  models seamlessly or combine multiple models in one workflow.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="glass hover:shadow-xl transition-all duration-500 group border-border/50 hover:border-primary/30">
              <CardHeader className="p-8">
                <div className="mb-4 relative">
                  <Code2 className="h-12 w-12 text-primary group-hover:scale-110 transition-all duration-300" />
                  <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-all duration-300" />
                </div>
                <CardTitle className="text-xl font-bold mb-3">Developer Experience</CardTitle>
                <CardDescription className="text-muted-foreground leading-relaxed">
                  Auto-generated SDKs, comprehensive documentation, and testing tools. Integrate your AI APIs into any
                  application with just a few lines of code.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.1),transparent_70%)]" />

        <div className="container mx-auto px-6 text-center relative">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-5xl font-bold mb-6 gradient-text">Ready to Transform Your AI Development?</h2>
            <p className="text-xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
              Join thousands of developers and enterprises who are building the future with our AI API platform. Start
              your free trial today and experience the power of no-code AI development.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register">
                <Button
                  size="lg"
                  className="btn-premium bg-primary hover:bg-primary/90 text-primary-foreground shadow-xl hover:shadow-2xl px-8 py-4 text-lg font-semibold animate-glow"
                >
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-border hover:bg-muted/50 px-8 py-4 text-lg font-semibold transition-all duration-300 bg-transparent"
                >
                  Schedule Demo
                </Button>
              </Link>
            </div>

            <div className="mt-12 text-sm text-muted-foreground">
              <p>No credit card required • 14-day free trial • Cancel anytime</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
