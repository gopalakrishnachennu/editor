"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Sparkles,
  ArrowRight,
  Zap,
  Palette,
  Globe,
  Clock,
  Shield,
  Star,
} from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "AI-Powered Content",
    description:
      "Paste any URL and our AI extracts headlines, quotes, and images automatically",
  },
  {
    icon: Palette,
    title: "50+ Templates",
    description:
      "Professional templates designed for Indian audiences - tech, sports, business, and more",
  },
  {
    icon: Globe,
    title: "Multi-Platform Export",
    description:
      "Export for Instagram, Twitter, LinkedIn, and Facebook in one click",
  },
  {
    icon: Clock,
    title: "Batch Processing",
    description: "Create multiple posts at once for repetitive content workflows",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl gradient-text">Post Designer</span>
            </Link>

            <div className="flex items-center space-x-4">
              <Link
                href="/login"
                className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium transition"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:opacity-90 transition font-medium"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center space-x-2 px-4 py-2 bg-white/80 rounded-full border border-indigo-100 mb-6">
              <Star className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-medium text-gray-700">
                Trusted by 10,000+ content creators in India
              </span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              Create Stunning Posts
              <br />
              <span className="gradient-text">In Seconds with AI</span>
            </h1>

            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
              Transform any article, news, or idea into beautiful social media posts.
              Optimized for Indian audiences with culturally relevant designs.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/register"
                className="group flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl hover:opacity-90 transition font-semibold text-lg shadow-xl shadow-indigo-200"
              >
                <span>Start Creating Free</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition" />
              </Link>
              <Link
                href="/templates"
                className="px-8 py-4 bg-white text-gray-700 rounded-2xl hover:bg-gray-50 transition font-semibold text-lg border border-gray-200"
              >
                Browse Templates
              </Link>
            </div>
          </motion.div>

          {/* Demo Image */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mt-16 relative"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-indigo-50 to-transparent pointer-events-none z-10" />
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden max-w-5xl mx-auto">
              <div className="h-12 bg-gray-100 flex items-center px-4 space-x-2 border-b border-gray-200">
                <div className="flex space-x-2">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
              </div>
              <div className="p-8 bg-gradient-to-br from-indigo-50 to-purple-50 min-h-[400px] flex items-center justify-center">
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-float">
                    <Sparkles className="w-10 h-10 text-white" />
                  </div>
                  <p className="text-gray-500 font-medium">
                    Interactive Editor Preview
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              Everything You Need to Create
              <br />
              <span className="gradient-text">Viral Content</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Powerful features designed for content creators, marketers, and businesses
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="p-6 bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-100 card-hover"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-indigo-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-12 text-center text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-10" />
            <div className="relative z-10">
              <Shield className="w-12 h-12 mx-auto mb-6 opacity-80" />
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to Create Amazing Content?
              </h2>
              <p className="text-lg text-indigo-100 mb-8 max-w-xl mx-auto">
                Join thousands of creators using Post Designer to grow their audience
              </p>
              <Link
                href="/register"
                className="inline-flex items-center space-x-2 px-8 py-4 bg-white text-indigo-600 rounded-2xl hover:bg-gray-100 transition font-semibold text-lg"
              >
                <span>Get Started for Free</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold gradient-text">Post Designer</span>
          </div>
          <p className="text-gray-500 text-sm">
            © 2026 Post Designer. Made with ❤️ for Indian creators.
          </p>
        </div>
      </footer>
    </div>
  );
}
