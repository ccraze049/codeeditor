import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Code, Cpu, Users, Zap, Rocket, Globe } from "lucide-react";
import TailwindTest from "@/components/TailwindTest";

export default function Landing() {
  return (
    <div className="min-h-screen bg-ide-bg-primary text-ide-text-primary">
      {/* Header */}
      <header className="border-b border-ide-border bg-ide-bg-secondary">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Code className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            <span className="text-base sm:text-lg font-bold">CodeSpace</span>
          </div>
          <Button 
            onClick={() => window.location.href = '/login'}
            className="bg-primary hover:bg-primary/90 text-primary-foreground text-sm sm:text-base px-3 sm:px-4 py-2"
            data-testid="button-login"
          >
            Sign In
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-12 sm:py-16 md:py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-primary to-ide-purple bg-clip-text text-transparent">
            Code, Collaborate, Create
          </h1>
          <p className="text-lg sm:text-xl text-ide-text-secondary mb-6 sm:mb-8 leading-relaxed px-4 sm:px-0">
            A powerful browser-based coding platform with AI assistance, real-time collaboration, 
            and seamless deployment. Start coding instantly, anywhere.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 px-4 sm:px-0">
            <Button 
              size="lg" 
              onClick={() => window.location.href = '/login'}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 sm:px-8 py-3 w-full sm:w-auto"
              data-testid="button-get-started"
            >
              <Rocket className="mr-2 h-5 w-5" />
              Get Started
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-ide-border hover:bg-ide-bg-secondary px-6 sm:px-8 py-3 w-full sm:w-auto"
              data-testid="button-explore"
            >
              <Globe className="mr-2 h-5 w-5" />
              Explore Public Projects
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-12 sm:py-16 md:py-20">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">Everything You Need to Code</h2>
          <p className="text-ide-text-secondary max-w-2xl mx-auto px-4 sm:px-0">
            Professional development tools right in your browser, powered by modern technology and AI assistance.
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <Card className="bg-ide-bg-secondary border-ide-border">
            <CardHeader>
              <Code className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Advanced Code Editor</CardTitle>
              <CardDescription>
                Monaco Editor with syntax highlighting, IntelliSense, and multi-language support
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-ide-bg-secondary border-ide-border">
            <CardHeader>
              <Cpu className="h-8 w-8 text-ide-purple mb-2" />
              <CardTitle>AI-Powered Assistant</CardTitle>
              <CardDescription>
                Code generation, debugging, and optimization powered by Google Gemini AI
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-ide-bg-secondary border-ide-border">
            <CardHeader>
              <Users className="h-8 w-8 text-ide-green mb-2" />
              <CardTitle>Real-time Collaboration</CardTitle>
              <CardDescription>
                Work together with your team in real-time, see changes instantly
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-ide-bg-secondary border-ide-border">
            <CardHeader>
              <Zap className="h-8 w-8 text-ide-yellow mb-2" />
              <CardTitle>Instant Deployment</CardTitle>
              <CardDescription>
                Deploy your applications with one click and share them with the world
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-ide-bg-secondary border-ide-border">
            <CardHeader>
              <Globe className="h-8 w-8 text-ide-blue mb-2" />
              <CardTitle>Project Sharing</CardTitle>
              <CardDescription>
                Share your projects publicly or with specific collaborators
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-ide-bg-secondary border-ide-border">
            <CardHeader>
              <Rocket className="h-8 w-8 text-ide-orange mb-2" />
              <CardTitle>Multiple Templates</CardTitle>
              <CardDescription>
                Start with React, Node.js, Python, and more pre-configured templates
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Tailwind Test Section */}
      <section className="container mx-auto px-4 py-8">
        <TailwindTest />
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-12 sm:py-16 md:py-20 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">Ready to Start Coding?</h2>
          <p className="text-ide-text-secondary mb-6 sm:mb-8 px-4 sm:px-0">
            Join thousands of developers who are already building amazing projects with CodeSpace.
          </p>
          <Button 
            size="lg" 
            onClick={() => window.location.href = '/login'}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 sm:px-8 py-3 w-full sm:w-auto"
            data-testid="button-sign-up-cta"
          >
            Sign Up - It's Free
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-ide-border bg-ide-bg-secondary">
        <div className="container mx-auto px-4 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-2">
              <Code className="h-5 w-5 text-primary" />
              <span className="font-semibold">CodeSpace</span>
            </div>
            <p className="text-xs sm:text-sm text-ide-text-secondary text-center sm:text-right">
              © 2025 CodeSpace. Built with React and Express.js
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
