
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ReadingPassageProps {
  title: string;
  text: string;
  isSelected: boolean;
  onSelect: () => void;
}

const ReadingPassage = ({ title, text, isSelected, onSelect }: ReadingPassageProps) => {
  return (
    <div
      className={`p-4 border rounded-md cursor-pointer transition-colors ${
        isSelected ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-primary/50'
      }`}
      onClick={onSelect}
    >
      <h3 className="font-medium">{title}</h3>
      <p className="text-sm text-gray-500 mt-1">
        {text.substring(0, 60)}...
      </p>
    </div>
  );
};

export default ReadingPassage;
