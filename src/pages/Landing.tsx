
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, BarChart3, Heart, Tv, DollarSign } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getEnabledApps } from '@/config/apps';

const defaultAppSettings = {
  enabledApps: {
    public: true,
    finance: true,
    tvShows: true,
    settlebill: true,
    household: true,
    movies: true,
    notifications: true,
    inventory: true,
    sharedUniverse: true,
    quickCommerce: true,
    images: true,
    qa: true,
    prediction: true,
    admin: false
  }
};

export default function Landing() {
  const enabledApps = getEnabledApps(defaultAppSettings);

  const features = [
    {
      icon: <DollarSign className="w-8 h-8 text-green-600" />,
      title: "Financial Management",
      description: "Track expenses, manage budgets, and organize your finances with ease."
    },
    {
      icon: <Tv className="w-8 h-8 text-purple-600" />,
      title: "Entertainment Tracking",
      description: "Keep track of your favorite TV shows, movies, and create custom universes."
    },
    {
      icon: <BarChart3 className="w-8 h-8 text-blue-600" />,
      title: "Bill Splitting",
      description: "Split bills with friends and manage group expenses effortlessly."
    },
    {
      icon: <Heart className="w-8 h-8 text-red-600" />,
      title: "Personal Organization",
      description: "Organize your digital life with our comprehensive tracking tools."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Welcome to <span className="text-blue-600">TrackerHub</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Your all-in-one platform for managing finances, tracking entertainment, and organizing your digital life.
          </p>
          <div className="flex gap-4 justify-center">
            <Link to="/login">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                Get Started
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link to="/public/shows">
              <Button size="lg" variant="outline">
                Browse Public Content
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {features.map((feature, index) => (
            <Card key={index} className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-center mb-4">
                  {feature.icon}
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Available Apps */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Available Applications</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {enabledApps.slice(0, 6).map((app) => (
              <Card key={app.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">{app.name}</CardTitle>
                  <CardDescription>{app.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
