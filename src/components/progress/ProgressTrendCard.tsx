
import { ArrowUp, ArrowDown, Minus, Calendar } from 'lucide-react';

interface TrendCardProps {
  title: string;
  trend: {
    trendType: 'improving' | 'declining' | 'stable';
    percentageChange: number;
    timeSpan: string;
  };
}

const ProgressTrendCard = ({ title, trend }: TrendCardProps) => {
  // Get feedback message in the appropriate language (placeholder for future translation)
  const getFeedbackMessage = () => {
    const displayTitle = title.replace('_', ' ');
    
    switch(trend.trendType) {
      case 'improving':
        return `You've shown great improvement in ${displayTitle}!`;
      case 'declining':
        return `Your performance in ${displayTitle} has decreased. Let's focus on this area.`;
      case 'stable':
        return `Your performance in ${displayTitle} has been consistent.`;
    }
  };
  
  return (
    <div className="border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-center mb-2">
        <h4 className="font-medium capitalize">{title.replace('_', ' ')}</h4>
        <div className={`flex items-center text-sm ${
          trend.trendType === 'improving' 
            ? 'text-green-500' 
            : trend.trendType === 'declining'
              ? 'text-red-500'
              : 'text-yellow-500'
        }`}>
          {trend.trendType === 'improving' && <ArrowUp className="h-4 w-4 mr-1" />}
          {trend.trendType === 'declining' && <ArrowDown className="h-4 w-4 mr-1" />}
          {trend.trendType === 'stable' && <Minus className="h-4 w-4 mr-1" />}
          {trend.percentageChange > 0 ? '+' : ''}{trend.percentageChange}%
        </div>
      </div>
      
      <div className="text-xs text-gray-500 mb-2 flex items-center">
        <Calendar className="h-3 w-3 mr-1" />
        <span>{trend.timeSpan}</span>
      </div>
      
      <p className="text-sm">{getFeedbackMessage()}</p>
    </div>
  );
};

export default ProgressTrendCard;
