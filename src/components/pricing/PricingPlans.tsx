import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

const plans = [
  {
    name: "Student Plan",
    price: "₹150",
    period: "/month",
    description: "Perfect for individual learners",
    features: [
      "Unlimited AI feedback on assignments",
      "Personal AI study companion",
      "Smart quiz generator",
      "Progress tracking dashboard",
      "Voice reading practice",
      "Writing improvement tools"
    ],
    buttonText: "Start Learning",
    popular: false
  },
  {
    name: "Teacher Plan",
    price: "₹250",
    period: "/month",
    description: "Essential tools for educators",
    features: [
      "Everything in Student Plan",
      "Class analytics dashboard",
      "AI quiz creation tools",
      "Worksheet generator",
      "Student progress tracking",
      "Priority support"
    ],
    buttonText: "Empower Teaching",
    popular: true
  },
  {
    name: "School Add-on",
    price: "₹1000",
    period: "/month/school",
    description: "Scale up for institutions",
    features: [
      "Up to 50 user accounts",
      "School-wide dashboard",
      "Advanced analytics",
      "Bulk student management",
      "Custom branding options",
      "Dedicated support"
    ],
    buttonText: "Contact Sales",
    popular: false
  }
];

export function PricingPlans() {
  return (
    <div className="py-12 px-4">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold mb-4">Simple, Transparent Pricing</h2>
        <p className="text-gray-600">Start with a 7-day free trial. No credit card required.</p>
      </div>
      
      <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
        {plans.map((plan) => (
          <Card key={plan.name} className={`relative ${plan.popular ? 'border-primary shadow-lg' : ''}`}>
            {plan.popular && (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm">
                  Most Popular
                </span>
              </div>
            )}
            
            <CardHeader>
              <CardTitle>
                <h3 className="text-2xl font-bold">{plan.name}</h3>
                <div className="mt-4">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-gray-600">{plan.period}</span>
                </div>
              </CardTitle>
              <p className="text-gray-600">{plan.description}</p>
            </CardHeader>
            
            <CardContent>
              <ul className="space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            
            <CardFooter>
              <Button className="w-full" variant={plan.popular ? "default" : "outline"}>
                {plan.buttonText}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
      
      <div className="text-center mt-10 text-sm text-gray-600">
        <p>All plans include: Secure data encryption • 24/7 AI support • Mobile app access</p>
        <p className="mt-2">Need a custom plan? <a href="#contact" className="text-primary hover:underline">Contact us</a></p>
      </div>
    </div>
  );
}