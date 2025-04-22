
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LearningStyle, learningStyleInfo } from '@/types';
import { Progress } from "@/components/ui/progress";

interface LearningStyleSummaryProps {
  primaryStyle?: LearningStyle;
  secondaryStyle?: LearningStyle;
  styleStrengths?: Record<LearningStyle, number>;
}

const LearningStyleSummary = ({ 
  primaryStyle = LearningStyle.VISUAL, 
  secondaryStyle, 
  styleStrengths 
}: LearningStyleSummaryProps) => {
  
  const primaryInfo = learningStyleInfo[primaryStyle];
  const secondaryInfo = secondaryStyle ? learningStyleInfo[secondaryStyle] : null;
  
  // Filter and sort style strengths for display
  const sortedStyles = styleStrengths 
    ? Object.entries(styleStrengths)
        .filter(([_, value]) => value > 0)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4) // Show top 4 styles
    : [];
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Learning Style</CardTitle>
        <CardDescription>
          Understanding how you learn best helps optimize your educational experience
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!primaryStyle ? (
          <div className="text-center p-4">
            <p className="text-gray-500 mb-4">You haven't completed the learning style quiz yet.</p>
            <a href="/learning-style" className="text-edu-primary hover:underline font-medium">
              Take the quiz to discover your learning style
            </a>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-edu-primary flex items-center gap-2">
                <span>Primary: {primaryInfo.title}</span>
              </h3>
              <p className="text-gray-700 text-sm">{primaryInfo.description}</p>
            </div>
            
            {secondaryInfo && (
              <div className="space-y-2 pt-2 border-t">
                <h3 className="text-lg font-medium text-edu-secondary flex items-center gap-2">
                  <span>Secondary: {secondaryInfo.title}</span>
                </h3>
                <p className="text-gray-700 text-sm">{secondaryInfo.description}</p>
              </div>
            )}
            
            {sortedStyles.length > 0 && (
              <div className="space-y-3 pt-2 border-t">
                <h3 className="text-md font-medium">Your Learning Style Profile</h3>
                
                {sortedStyles.map(([style, percentage]) => (
                  <div key={style} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{learningStyleInfo[style as LearningStyle].title}</span>
                      <span className="font-medium">{percentage}%</span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                ))}
              </div>
            )}
            
            <div className="pt-2 border-t">
              <h3 className="text-md font-medium mb-2">Personalized Recommendations</h3>
              <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
                {primaryInfo.recommendations.slice(0, 3).map((rec, index) => (
                  <li key={index}>{rec}</li>
                ))}
              </ul>
            </div>
            
            <a href="/learning-style" className="block text-center text-edu-primary hover:underline text-sm font-medium mt-4">
              View complete learning style analysis
            </a>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default LearningStyleSummary;
