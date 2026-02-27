import { Link } from 'react-router-dom'
import { Star, Heart, BookOpen, Sun, Music, Palette } from 'lucide-react'

const features = [
  { icon: BookOpen, title: 'Learn & Explore', desc: 'Hands-on learning through play and discovery', color: 'bg-kinder-blue' },
  { icon: Heart, title: 'Safe Environment', desc: 'Nurturing space where every child feels valued', color: 'bg-kinder-pink' },
  { icon: Music, title: 'Arts & Music', desc: 'Creative expression through song and art', color: 'bg-kinder-purple' },
  { icon: Palette, title: 'Creative Play', desc: 'Imagination-led activities every single day', color: 'bg-kinder-green' },
  { icon: Sun, title: 'Outdoor Time', desc: 'Fresh air and nature play for healthy development', color: 'bg-kinder-yellow' },
  { icon: Star, title: 'Small Classes', desc: 'Personalized attention in intimate class sizes', color: 'bg-kinder-orange' },
]

export function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 font-display overflow-hidden transition-colors duration-200">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-kinder-orange rounded-2xl flex items-center justify-center">
            <span className="text-white font-bold text-sm">K</span>
          </div>
          <span className="font-bold text-gray-900 dark:text-gray-100 text-lg">KinderCare</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600 dark:text-gray-300">
          <a href="#about" className="hover:text-kinder-orange transition-colors">About</a>
          <a href="#programs" className="hover:text-kinder-orange transition-colors">Programs</a>
          <a href="#contact" className="hover:text-kinder-orange transition-colors">Contact</a>
          <Link
            to="/admin/login"
            className="bg-kinder-orange text-white px-5 py-2.5 rounded-full hover:bg-orange-600 transition-colors"
          >
            Admin Login
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-8 pt-16 pb-24 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <div className="inline-flex items-center gap-2 bg-orange-50 dark:bg-orange-950/50 text-kinder-orange px-4 py-2 rounded-full text-sm font-semibold mb-6">
            <Star size={14} fill="currentColor" />
            Enrolling for 2025–2026
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 dark:text-gray-100 leading-tight mb-6">
            Where little minds{' '}
            <span className="text-kinder-orange relative">
              grow big
              <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 8" fill="none">
                <path d="M2 6 Q100 2 198 6" stroke="#FFD93D" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </span>{' '}
            ideas
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-lg leading-relaxed mb-8">
            A warm, loving kindergarten where curiosity is celebrated, friendships are formed,
            and every child discovers the joy of learning.
          </p>
          <div className="flex flex-wrap gap-4">
            <a
              href="#contact"
              className="bg-kinder-orange text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-orange-600 transition-all hover:shadow-lg hover:shadow-orange-200 hover:-translate-y-0.5"
            >
              Book a Tour
            </a>
            <a
              href="#programs"
              className="border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 px-8 py-4 rounded-2xl font-bold text-lg hover:border-kinder-orange hover:text-kinder-orange transition-all"
            >
              Our Programs
            </a>
          </div>

          {/* Stats */}
          <div className="flex gap-8 mt-12">
            {[['150+', 'Happy Students'], ['15+', 'Years of Joy'], ['20+', 'Qualified Staff']].map(
              ([num, label]) => (
                <div key={label}>
                  <p className="text-2xl font-extrabold text-gray-900 dark:text-gray-100">{num}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
                </div>
              )
            )}
          </div>
        </div>

        {/* Illustration placeholder */}
        <div className="relative hidden md:block">
          <div className="w-full aspect-square bg-gradient-to-br from-orange-100 via-yellow-50 to-green-100 dark:from-gray-800 dark:via-gray-850 dark:to-gray-800 rounded-3xl flex items-center justify-center">
            <div className="text-center">
              <div className="mb-4"><svg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 24 24' fill='none' stroke='#FF6B35' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round'><path d='M20 12V22H4V12'/><path d='M22 7H2v5h20V7z'/><path d='M12 22V7'/><path d='M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z'/><path d='M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z'/></svg></div>
              <p className="text-gray-400 dark:text-gray-500 font-medium">Bright Futures Start Here</p>
            </div>
          </div>
          {/* Floating badges */}
          <div className="absolute -top-4 -right-4 bg-kinder-yellow text-gray-900 px-4 py-2 rounded-2xl font-bold shadow-lg rotate-6 text-sm">
            Ages 4–6
          </div>
          <div className="absolute -bottom-4 -left-4 bg-kinder-green text-white px-4 py-2 rounded-2xl font-bold shadow-lg -rotate-3 text-sm">
            Safe & Fun
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="programs" className="bg-gray-50 dark:bg-gray-900 py-20 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-extrabold text-gray-900 dark:text-gray-100 mb-4">Everything your child needs</h2>
            <p className="text-gray-500 dark:text-gray-400 text-lg max-w-xl mx-auto">
              Our holistic curriculum nurtures the whole child — mind, body, and heart.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, title, desc, color }) => (
              <div
                key={title}
                className="bg-white dark:bg-gray-800 border border-transparent dark:border-gray-700 rounded-3xl p-8 hover:shadow-lg transition-all hover:-translate-y-1 cursor-default"
              >
                <div className={`w-12 h-12 ${color} rounded-2xl flex items-center justify-center mb-5`}>
                  <Icon className="text-white" size={22} />
                </div>
                <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg mb-2">{title}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="contact" className="py-20">
        <div className="max-w-3xl mx-auto px-8 text-center">
          <div className="bg-kinder-orange rounded-3xl p-12 text-white">
            <h2 className="text-4xl font-extrabold mb-4">Ready to join our family?</h2>
            <p className="text-orange-100 mb-8 text-lg">
              Schedule a visit and see why parents love KinderCare.
            </p>
            <a
              href="mailto:hello@kindercare.edu"
              className="bg-white text-kinder-orange px-8 py-4 rounded-2xl font-bold text-lg inline-block hover:bg-orange-50 transition-colors"
            >
              hello@kindercare.edu
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 dark:border-gray-800 py-8 text-center text-sm text-gray-400 dark:text-gray-500 font-display">
        © {new Date().getFullYear()} KinderCare. Made with care for little learners.
      </footer>
    </div>
  )
}
