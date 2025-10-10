import { useState } from 'react';
import { LearningPathCurator } from '@/components/learning-style/LearningPathCurator';
import { InteractiveLearningPath } from '@/components/learning-style/InteractiveLearningPath';

export default function TestLearningPath() {
  const [mode, setMode] = useState<'create' | 'view'>('create');
  const [createdPath, setCreatedPath] = useState(null);

  const handlePathCreated = (path: any) => {
    setCreatedPath(path);
    setMode('view');
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8 flex justify-between items-center">
        <h1 className="text-3xl font-bold">Interactive Learning Path Test</h1>
        <div className="space-x-4">
          <button
            onClick={() => setMode('create')}
            className={`px-4 py-2 rounded ${
              mode === 'create' ? 'bg-blue-500 text-white' : 'bg-gray-200'
            }`}
          >
            Create
          </button>
          <button
            onClick={() => setMode('view')}
            className={`px-4 py-2 rounded ${
              mode === 'view' ? 'bg-blue-500 text-white' : 'bg-gray-200'
            }`}
            disabled={!createdPath}
          >
            View
          </button>
        </div>
      </div>

      {mode === 'create' ? (
        <LearningPathCurator onPathCreated={handlePathCreated} />
      ) : (
        createdPath && (
          <InteractiveLearningPath
            pathId={createdPath.id}
            studentId="test-student"
            title={createdPath.title}
            description={createdPath.description}
            steps={createdPath.steps}
          />
        )
      )}
    </div>
  );
}