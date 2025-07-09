'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Brain, 
  CreditCard, 
  TrendingUp, 
  Shield, 
  Smartphone, 
  Zap,
  CheckCircle,
  ArrowRight,
  Star,
  Users,
  BarChart3,
  Bell
} from 'lucide-react'

export default function Home() {
  const [email, setEmail] = useState('')

  const features = [
    {
      icon: Brain,
      title: 'AI智能分类',
      description: '自动识别交易类型，智能分类消费记录，无需手动输入'
    },
    {
      icon: CreditCard,
      title: '多账户管理',
      description: '支持银行卡、现金、信用卡等多种账户类型管理'
    },
    {
      icon: TrendingUp,
      title: '数据分析',
      description: '详细的消费趋势分析，帮助您更好地规划财务'
    },
    {
      icon: Shield,
      title: '安全可靠',
      description: '银行级安全加密，保护您的财务数据隐私'
    },
    {
      icon: Smartphone,
      title: '多端同步',
      description: 'Web端和移动端数据实时同步，随时随地记账'
    },
    {
      icon: Bell,
      title: '智能提醒',
      description: '账单到期提醒，异常消费预警，让您不再错过重要事项'
    }
  ]

  const stats = [
    { number: '50,000+', label: '活跃用户' },
    { number: '99.9%', label: '系统可用性' },
    { number: '24/7', label: '技术支持' },
    { number: '4.9', label: '用户评分' }
  ]

  const testimonials = [
    {
      name: '张小明',
      role: '产品经理',
      content: 'Molly Bill让我的记账变得非常简单，AI自动分类功能太棒了！',
      rating: 5
    },
    {
      name: '李小红',
      role: '设计师',
      content: '界面设计很美观，数据分析功能帮助我更好地控制支出。',
      rating: 5
    },
    {
      name: '王大力',
      role: '程序员',
      content: '多账户管理功能很实用，预算提醒功能帮我省了不少钱。',
      rating: 5
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="relative z-10">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">M</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Molly Bill</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900">功能</a>
              <a href="#pricing" className="text-gray-600 hover:text-gray-900">价格</a>
              <a href="#about" className="text-gray-600 hover:text-gray-900">关于</a>
              <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                立即开始
              </button>
            </div>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-5xl md:text-6xl font-bold text-gray-900 mb-6"
            >
              AI智能记账
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                让财务管理更简单
              </span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto"
            >
              基于人工智能的智能记账应用，自动识别交易类型，智能分析消费趋势，
              帮助您更好地管理个人财务，实现财务自由。
            </motion.p>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <div className="flex items-center space-x-2 bg-white rounded-lg px-6 py-3 shadow-lg">
                <input
                  type="email"
                  placeholder="输入您的邮箱"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="outline-none text-gray-900 placeholder-gray-500"
                />
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
                  <span>免费试用</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              强大的功能特性
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              我们提供全方位的财务管理工具，让您的记账体验更加智能和便捷
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-gradient-to-br from-blue-50 to-purple-50 p-8 rounded-xl hover:shadow-lg transition-shadow"
              >
                <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center mb-6">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <div className="text-3xl md:text-4xl font-bold text-white mb-2">
                  {stat.number}
                </div>
                <div className="text-blue-100">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              用户评价
            </h2>
            <p className="text-xl text-gray-600">
              听听我们的用户怎么说
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="bg-white p-8 rounded-xl shadow-lg"
              >
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-6">
                  "{testimonial.content}"
                </p>
                <div>
                  <div className="font-semibold text-gray-900">
                    {testimonial.name}
                  </div>
                  <div className="text-gray-500 text-sm">
                    {testimonial.role}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl font-bold text-gray-900 mb-6"
          >
            开始您的智能记账之旅
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl text-gray-600 mb-8"
          >
            加入50,000+用户的行列，体验AI驱动的智能记账
          </motion.p>
          <motion.button 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:shadow-lg transition-shadow"
          >
            立即免费试用
          </motion.button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">M</span>
                </div>
                <span className="text-xl font-bold">Molly Bill</span>
              </div>
              <p className="text-gray-400">
                AI驱动的智能记账应用，让财务管理更简单。
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">产品</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">功能特性</a></li>
                <li><a href="#" className="hover:text-white">价格方案</a></li>
                <li><a href="#" className="hover:text-white">API文档</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">支持</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">帮助中心</a></li>
                <li><a href="#" className="hover:text-white">联系我们</a></li>
                <li><a href="#" className="hover:text-white">状态页面</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">公司</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">关于我们</a></li>
                <li><a href="#" className="hover:text-white">隐私政策</a></li>
                <li><a href="#" className="hover:text-white">服务条款</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Molly Bill. 保留所有权利。</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
